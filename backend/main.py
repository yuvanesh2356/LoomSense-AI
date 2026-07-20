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
    Weaver, User, Forecast, Outcome, IncomeRecord,
)
import ai_engine

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

    existing = (
        db.query(Forecast)
        .filter(Forecast.weaver_id == weaver_id)
        .order_by(Forecast.created_at.desc())
        .first()
    )
    if existing and existing.target_date >= date.today():
        f = existing
    else:
        result = ai_engine.generate_forecast(w)
        f = Forecast(
            weaver_id=w.id, product=result["product"], quantity=result["quantity"],
            confidence=result["confidence"], target_date=result["target_date"],
            reason=result["reason"], factors_json=json.dumps(result["factors"]),
        )
        db.add(f)
        db.commit()
        db.refresh(f)

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


@app.get("/api/health")
def health():
    return envelope({"status": "ok"})