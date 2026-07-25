"""LoomSense AI — FastAPI backend. Single-file API layer."""
import json
from datetime import date, datetime, timedelta

import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import (
    Base, engine, get_db, seed, SessionLocal,
    Weaver, User, Forecast, Outcome, IncomeRecord, StateDemand, ChatMessage,
)
import ai_engine
import planner_engine
import assistant_engine

# --- App setup -----------------------------------------------------------
Base.metadata.create_all(bind=engine)
app = FastAPI(title="LoomSense AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_seed_db = SessionLocal()
try:
    seed(_seed_db)
finally:
    _seed_db.close()

JWT_SECRET = "loomsense-hackathon-demo-secret"
JWT_ALGO = "HS256"
JWT_EXPIRY_HOURS = 12
bearer_scheme = HTTPBearer()


# --- Schemas ---------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class SimulateRequest(BaseModel):
    weaver_id: int
    alt_product_category: str
    alt_quantity: int


class OutcomeRequest(BaseModel):
    forecast_id: int
    sold_quantity: int
    actual_price: float
    accepted: bool = True


class ChatRequest(BaseModel):
    weaver_id: int
    message: str
    language: str = "en"


def envelope(data=None, error=None):
    return {
        "success": error is None,
        "data": data,
        "meta": {"timestamp": datetime.utcnow().isoformat()},
        "error": error,
    }


# --- Auth helpers ------------------------------------------------------------
def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_weaver_or_404(weaver_id: int, db: Session) -> Weaver:
    w = db.query(Weaver).filter(Weaver.id == weaver_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Weaver not found")
    return w


def get_or_create_forecast(w: Weaver, db: Session) -> Forecast:
    existing = (
        db.query(Forecast)
        .filter(Forecast.weaver_id == w.id)
        .order_by(Forecast.created_at.desc())
        .first()
    )
    if existing and existing.target_date >= date.today():
        return existing
    result = ai_engine.generate_forecast(w)
    f = Forecast(
        weaver_id=w.id, product=result["product"], quantity=result["quantity"],
        confidence=result["confidence"], target_date=result["target_date"],
        reason=result["reason"], factors_json=json.dumps(result["factors"]),
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


def get_market_trend(w: Weaver, db: Session) -> dict:
    state_code = ai_engine.STATE_CODE_BY_REGION.get(w.region)
    state_row = (
        db.query(StateDemand).filter(StateDemand.state_code == state_code).first()
        if state_code else None
    )
    return {
        "growth_pct": state_row.growth_pct if state_row else 0.0,
        "state_name": state_row.state_name if state_row else w.region,
    }


# --- Routes ------------------------------------------------------------------
@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == req.username, User.password == req.password
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id)
    return envelope({
        "token": token,
        "user": {"id": user.id, "username": user.username, "weaver_id": user.weaver_id},
    })


@app.get("/api/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = db.query(Weaver).filter(Weaver.id == user.weaver_id).first()
    return envelope({
        "user_id": user.id,
        "username": user.username,
        "weaver": {
            "id": w.id, "name": w.name, "cluster": w.cluster,
            "product_category": w.product_category, "region": w.region,
            "weekly_capacity": w.weekly_capacity,
        },
    })


@app.get("/api/forecast/{weaver_id}")
def get_forecast(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    f = get_or_create_forecast(w, db)
    return envelope({
        "forecast_id": f.id,
        "product": f.product,
        "quantity": f.quantity,
        "confidence": f.confidence,
        "confidence_tier": ai_engine.confidence_tier(f.confidence),
        "target_date": f.target_date.isoformat(),
        "reason": f.reason,
    })


@app.get("/api/forecast/{forecast_id}/explain")
def explain_forecast(forecast_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Forecast).filter(Forecast.id == forecast_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return envelope(ai_engine.build_explanation(f))


@app.get("/api/income-calendar/{weaver_id}")
def income_calendar(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_weaver_or_404(weaver_id, db)
    records = (
        db.query(IncomeRecord)
        .filter(IncomeRecord.weaver_id == weaver_id)
        .order_by(IncomeRecord.month_label.asc())
        .all()
    )
    safety_threshold = None
    projected_values = [r.projected for r in records]
    if projected_values:
        safety_threshold = round(sum(projected_values) / len(projected_values) * 0.6)

    return envelope({
        "safety_threshold": safety_threshold,
        "months": [
            {
                "month": r.month_label,
                "projected": r.projected,
                "actual": r.actual,
                "below_safety": r.projected < safety_threshold if safety_threshold else False,
            }
            for r in records
        ],
    })


@app.post("/api/simulate")
def simulate(req: SimulateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(req.weaver_id, db)
    result = ai_engine.simulate_scenario(w, req.alt_product_category, req.alt_quantity)
    return envelope(result)


@app.get("/api/stability-score/{weaver_id}")
def stability_score(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    records = db.query(IncomeRecord).filter(IncomeRecord.weaver_id == weaver_id).all()
    return envelope(ai_engine.compute_stability_score(w, records))


@app.post("/api/outcomes")
def log_outcome(req: OutcomeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Forecast).filter(Forecast.id == req.forecast_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Forecast not found")
    o = Outcome(
        forecast_id=req.forecast_id, sold_quantity=req.sold_quantity,
        actual_price=req.actual_price, accepted=req.accepted,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return envelope({"outcome_id": o.id, "logged": True})


@app.get("/api/heatmap/states")
def heatmap_states(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(StateDemand).order_by(StateDemand.state_name.asc()).all()
    return envelope([
        {"state_code": r.state_code, "state_name": r.state_name,
         "demand_index": r.demand_index, "growth_pct": r.growth_pct}
        for r in rows
    ])


@app.get("/api/heatmap/states/{state_code}")
def heatmap_state_detail(state_code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(StateDemand).filter(StateDemand.state_code == state_code.upper()).first()
    if not r:
        raise HTTPException(status_code=404, detail="State not found")
    return envelope({
        "state_code": r.state_code, "state_name": r.state_name,
        "demand_index": r.demand_index, "growth_pct": r.growth_pct,
        "top_products": json.loads(r.top_products_json),
        "festivals": json.loads(r.festivals_json),
        "price_trend": r.price_trend,
    })


@app.get("/api/dashboard/summary/{weaver_id}")
def dashboard_summary(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    f = get_or_create_forecast(w, db)
    today_demand = ai_engine.get_today_demand_snapshot(w)

    outcomes = (
        db.query(Outcome)
        .join(Forecast, Outcome.forecast_id == Forecast.id)
        .filter(Forecast.weaver_id == weaver_id)
        .all()
    )
    accuracy = ai_engine.compute_forecast_accuracy(outcomes)

    current_month_label = date.today().strftime("%Y-%m")
    income_row = (
        db.query(IncomeRecord)
        .filter(IncomeRecord.weaver_id == weaver_id, IncomeRecord.month_label == current_month_label)
        .first()
    )
    estimated_income = income_row.projected if income_row else None

    market_trend = get_market_trend(w, db)
    inventory_status = "Tight" if f.quantity > w.weekly_capacity * 1.2 else "Adequate"

    return envelope({
        "today_demand": today_demand,
        "estimated_income": estimated_income,
        "forecast_accuracy": accuracy,
        "market_trend": market_trend,
        "recommended_product": f.product,
        "inventory_status": inventory_status,
        "production_capacity": w.weekly_capacity,
    })


# --- Phase 5+6: Production Planner -------------------------------------------
@app.get("/api/planner/{weaver_id}")
def get_production_plan(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    f = get_or_create_forecast(w, db)
    plan = planner_engine.generate_production_plan(w, f)
    return envelope(plan)


# --- Phase 5+6: AI Weaver Consultant ------------------------------------------
@app.post("/api/assistant/chat")
def assistant_chat(req: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(req.weaver_id, db)
    f = get_or_create_forecast(w, db)
    forecast_result = {"product": f.product, "quantity": f.quantity}
    market_trend = get_market_trend(w, db)

    result = assistant_engine.generate_reply(req.message, w, forecast_result, market_trend, req.language)

    db.add(ChatMessage(weaver_id=w.id, role="user", message=req.message, language=req.language))
    db.add(ChatMessage(weaver_id=w.id, role="assistant", message=result["reply_text"], language=req.language))
    db.commit()

    return envelope({"reply_text": result["reply_text"], "intent": result["intent"]})


@app.get("/api/assistant/history/{weaver_id}")
def assistant_history(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_weaver_or_404(weaver_id, db)
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.weaver_id == weaver_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return envelope([
        {"role": r.role, "message": r.message, "language": r.language, "created_at": r.created_at.isoformat()}
        for r in rows
    ])


@app.get("/api/health")
def health():
    return envelope({"status": "ok"})