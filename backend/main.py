"""LoomSense AI — FastAPI backend. Single-file API layer."""
import json
import logging
import os
from datetime import date, datetime, timedelta
from typing import Optional

import jwt
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import (
    Base, engine, get_db, seed, SessionLocal, run_migrations,
    Weaver, User, Forecast, Outcome, IncomeRecord, StateDemand, ChatMessage,
    Festival, MarketplaceChannel, GovernmentScheme, WeaverSchemeMatch,
    InventoryItem, Alert, LearningResource, CommunityProfile, CommunityEvent,
    FabricRecognitionLog, WeaveRecommendationLog,
)
import ai_engine
import planner_engine
import assistant_engine
import festival_engine
import marketplace_engine
import scheme_engine
import inventory_engine
import alerts_engine
import analytics_engine
import fabric_engine
import recommender_engine

# --- Logging (Phase 11: no new dependency, stdlib logging) -------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("loomsense")

# --- App setup -----------------------------------------------------------
Base.metadata.create_all(bind=engine)
run_migrations(engine)  # Phase 12: adds preferred_language/preferred_theme to existing DBs
app = FastAPI(title="LoomSense AI API")

# Phase 12: CORS origins are now environment-driven. "*" is fine for local
# dev; Phase 14 deployment must set ALLOWED_ORIGINS to the real frontend
# origin(s) instead, since a wildcard is not safe once real user auth exists.
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
_allowed_origins = ["*"] if _allowed_origins_env == "*" else [
    o.strip() for o in _allowed_origins_env.split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_seed_db = SessionLocal()
try:
    seed(_seed_db)
finally:
    _seed_db.close()

# Phase 12: JWT_SECRET now environment-driven. The fallback value below is
# for local development only — Phase 14 deployment MUST set a real
# JWT_SECRET env var, and Phase 13 removes this signing scheme entirely
# in favor of Firebase-issued tokens.
JWT_SECRET = os.environ.get("JWT_SECRET", "loomsense-hackathon-demo-secret")
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


class SchemeMatchRequest(BaseModel):
    weaver_id: Optional[int] = None
    age: int
    state: str
    occupation: str
    income: float
    gender: str
    shg: bool = False


class WeaveRecommendRequest(BaseModel):
    weaver_id: Optional[int] = None
    region: str
    raw_material_kg: float
    budget: float
    time_available_days: float


def envelope(data=None, error=None):
    return {
        "success": error is None,
        "data": data,
        "meta": {"timestamp": datetime.utcnow().isoformat()},
        "error": error,
    }


# --- Phase 11: global exception handlers for consistent error responses ------
# These make every error path (validation, 404s/401s via HTTPException, and
# unhandled 500s) return the exact same envelope shape the frontend already
# expects on success, instead of FastAPI's default {"detail": ...} shape.
# No endpoint body below needed to change for this.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", [])[1:]) or "request"
    message = f"Invalid value for '{field}': {first.get('msg', 'validation failed')}"
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, message)
    return JSONResponse(
        status_code=422,
        content=envelope(error={"code": "VALIDATION_ERROR", "message": message}),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.info("HTTPException on %s %s: %s", request.method, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=envelope(error={"code": f"HTTP_{exc.status_code}", "message": str(exc.detail)}),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=envelope(error={"code": "INTERNAL_ERROR", "message": "Something went wrong on our end."}),
    )


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


def get_state_row_for_weaver(w: Weaver, db: Session):
    state_code = ai_engine.STATE_CODE_BY_REGION.get(w.region)
    return db.query(StateDemand).filter(StateDemand.state_code == state_code).first() if state_code else None


def get_market_trend(w: Weaver, db: Session) -> dict:
    state_row = get_state_row_for_weaver(w, db)
    return {
        "growth_pct": state_row.growth_pct if state_row else 0.0,
        "state_name": state_row.state_name if state_row else w.region,
    }


def get_unit_price(w: Weaver) -> float:
    return planner_engine.UNIT_PRICE.get(w.product_category, 1200)


# --- Routes ------------------------------------------------------------------
@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == req.username, User.password == req.password
    ).first()
    if not user:
        logger.info("Failed login attempt for username=%s", req.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id)
    logger.info("User %s logged in", user.username)
    return envelope({
        "token": token,
        "user": {"id": user.id, "username": user.username, "weaver_id": user.weaver_id},
    })


class UpdateMeRequest(BaseModel):
    # All fields optional — PATCH semantics, only supplied fields change.
    name: Optional[str] = None
    cluster: Optional[str] = None
    product_category: Optional[str] = None
    region: Optional[str] = None
    weekly_capacity: Optional[int] = None
    preferred_language: Optional[str] = None
    preferred_theme: Optional[str] = None


@app.get("/api/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = db.query(Weaver).filter(Weaver.id == user.weaver_id).first()
    return envelope({
        "user_id": user.id,
        "username": user.username,
        "preferred_language": user.preferred_language,
        "preferred_theme": user.preferred_theme,
        "weaver": {
            "id": w.id, "name": w.name, "cluster": w.cluster,
            "product_category": w.product_category, "region": w.region,
            "weekly_capacity": w.weekly_capacity,
        },
    })


@app.patch("/api/me")
def update_me(req: UpdateMeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Phase 12: profile + preference updates, scoped entirely to the
    authenticated user's own record — no ID is ever accepted from the
    client. This ownership pattern (identity derived from the verified
    token, never from a client-supplied ID) is deliberately the same
    pattern Firebase-verified tokens will use in Phase 13, so this
    endpoint requires zero redesign when that migration happens — only
    the token-verification call inside get_current_user changes.
    """
    w = db.query(Weaver).filter(Weaver.id == user.weaver_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Weaver profile not found")

    weaver_fields = ["name", "cluster", "product_category", "region", "weekly_capacity"]
    for field in weaver_fields:
        value = getattr(req, field)
        if value is not None:
            setattr(w, field, value)

    if req.preferred_language is not None:
        user.preferred_language = req.preferred_language
    if req.preferred_theme is not None:
        user.preferred_theme = req.preferred_theme

    db.commit()
    db.refresh(w)
    db.refresh(user)

    return envelope({
        "user_id": user.id,
        "username": user.username,
        "preferred_language": user.preferred_language,
        "preferred_theme": user.preferred_theme,
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


@app.get("/api/planner/{weaver_id}")
def get_production_plan(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    f = get_or_create_forecast(w, db)
    plan = planner_engine.generate_production_plan(w, f)
    return envelope(plan)


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


@app.get("/api/festivals/predict/{weaver_id}")
def predict_festivals(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    rows = db.query(Festival).filter(Festival.region == w.region).all()
    predictions = festival_engine.predict_festivals(w, rows, get_unit_price(w))
    return envelope(predictions)


@app.get("/api/marketplace/recommendations/{weaver_id}")
def marketplace_recommendations(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    channels = db.query(MarketplaceChannel).all()
    demand_index = ai_engine.get_today_demand_snapshot(w)["demand_index"]
    ranked = marketplace_engine.rank_channels(channels, demand_index, get_unit_price(w))
    return envelope(ranked)


@app.post("/api/schemes/match")
def match_schemes(req: SchemeMatchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    schemes = db.query(GovernmentScheme).all()
    profile = {
        "age": req.age, "state": req.state, "occupation": req.occupation,
        "income": req.income, "gender": req.gender, "shg": req.shg,
    }
    matched = scheme_engine.match_schemes(schemes, profile)

    if req.weaver_id:
        for m in matched:
            db.add(WeaverSchemeMatch(weaver_id=req.weaver_id, scheme_id=m["scheme_id"]))
        db.commit()

    return envelope(matched)


@app.get("/api/schemes/history/{weaver_id}")
def scheme_history(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_weaver_or_404(weaver_id, db)
    rows = (
        db.query(WeaverSchemeMatch, GovernmentScheme)
        .join(GovernmentScheme, WeaverSchemeMatch.scheme_id == GovernmentScheme.id)
        .filter(WeaverSchemeMatch.weaver_id == weaver_id)
        .order_by(WeaverSchemeMatch.matched_at.desc())
        .all()
    )
    return envelope([
        {"scheme_name": scheme.name, "matched_at": match.matched_at.isoformat()}
        for match, scheme in rows
    ])


@app.get("/api/inventory/{weaver_id}")
def get_inventory(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_weaver_or_404(weaver_id, db)
    items = db.query(InventoryItem).filter(InventoryItem.weaver_id == weaver_id).all()
    return envelope([inventory_engine.compute_status(i) for i in items])


@app.get("/api/alerts/{weaver_id}")
def get_alerts(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    inventory_items = db.query(InventoryItem).filter(InventoryItem.weaver_id == weaver_id).all()
    state_row = get_state_row_for_weaver(w, db)
    festival_rows = db.query(Festival).filter(Festival.region == w.region).all()
    income_records = db.query(IncomeRecord).filter(IncomeRecord.weaver_id == weaver_id).all()
    f = get_or_create_forecast(w, db)
    plan = planner_engine.generate_production_plan(w, f)

    alerts_engine.generate_alerts(w, inventory_items, state_row, festival_rows, income_records, plan, db)

    rows = db.query(Alert).filter(Alert.weaver_id == weaver_id).order_by(Alert.created_at.desc()).all()
    return envelope([
        {"id": a.id, "alert_type": a.alert_type, "severity": a.severity, "title": a.title,
         "message": a.message, "read": a.read, "created_at": a.created_at.isoformat()}
        for a in rows
    ])


@app.patch("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.read = True
    db.commit()
    return envelope({"id": a.id, "read": True})


@app.get("/api/learning/resources")
def learning_resources(category: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(LearningResource)
    if category:
        query = query.filter(LearningResource.category == category)
    rows = query.all()
    return envelope([
        {"id": r.id, "title": r.title, "resource_type": r.resource_type, "category": r.category,
         "description": r.description, "url": r.url, "duration_minutes": r.duration_minutes}
        for r in rows
    ])


@app.get("/api/community/nearby/{weaver_id}")
def community_nearby(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    rows = db.query(CommunityProfile).filter(CommunityProfile.region == w.region).all()
    return envelope([
        {"id": p.id, "name": p.name, "profile_type": p.profile_type, "region": p.region,
         "cluster": p.cluster, "bio": p.bio, "contact_info": p.contact_info}
        for p in rows
    ])


@app.get("/api/community/events")
def community_events(region: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(CommunityEvent)
    if region:
        query = query.filter(CommunityEvent.region == region)
    rows = query.order_by(CommunityEvent.event_date.asc()).all()
    return envelope([
        {"id": e.id, "title": e.title, "description": e.description, "event_date": e.event_date,
         "region": e.region, "event_type": e.event_type}
        for e in rows
    ])


@app.get("/api/analytics/summary/{weaver_id}")
def analytics_summary(weaver_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = get_weaver_or_404(weaver_id, db)
    outcomes = (
        db.query(Outcome)
        .join(Forecast, Outcome.forecast_id == Forecast.id)
        .filter(Forecast.weaver_id == weaver_id)
        .all()
    )
    income_records = db.query(IncomeRecord).filter(IncomeRecord.weaver_id == weaver_id).all()
    state_rows = db.query(StateDemand).all()
    state_row = get_state_row_for_weaver(w, db)
    inventory_items = db.query(InventoryItem).filter(InventoryItem.weaver_id == weaver_id).all()
    inventory_low_count = sum(1 for i in inventory_items if i.available_stock <= i.low_stock_threshold)

    return envelope({
        "forecast_accuracy_series": analytics_engine.forecast_accuracy_series(outcomes),
        "profit_trend": analytics_engine.profit_trend(w, income_records),
        "demand_curve": analytics_engine.demand_curve(income_records),
        "state_comparison": analytics_engine.state_comparison(state_rows, state_row.state_code if state_row else None),
        "product_comparison": analytics_engine.product_comparison(),
        "risk_analysis": analytics_engine.risk_analysis(w, income_records, state_row, inventory_low_count),
    })


@app.post("/api/fabric/recognize")
async def recognize_fabric(
    weaver_id: int = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    w = get_weaver_or_404(weaver_id, db)
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    try:
        result = fabric_engine.analyze_image(image_bytes)
    except Exception:
        logger.exception("Fabric image analysis failed for weaver_id=%s", weaver_id)
        raise HTTPException(status_code=422, detail="Could not read this image. Please upload a valid JPG or PNG.")

    state_row = get_state_row_for_weaver(w, db)
    similar_products = json.loads(state_row.top_products_json)[:3] if state_row else []

    db.add(FabricRecognitionLog(
        weaver_id=weaver_id, uploaded_filename=file.filename,
        avg_color_hex=result["avg_color_hex"], detected_pattern=result["detected_pattern"],
        predicted_category=result["predicted_category"], estimated_price=result["estimated_price"],
    ))
    db.commit()

    return envelope({**result, "similar_products": similar_products})


@app.post("/api/recommend/what-to-weave")
def recommend_what_to_weave(req: WeaveRecommendRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    state_row = db.query(StateDemand).filter(StateDemand.state_name == req.region).first()
    results = recommender_engine.recommend_products(state_row, req.raw_material_kg, req.budget, req.time_available_days)

    db.add(WeaveRecommendationLog(
        weaver_id=req.weaver_id, region=req.region, raw_material_kg=req.raw_material_kg,
        budget=req.budget, time_available_days=req.time_available_days, results_json=json.dumps(results),
    ))
    db.commit()

    return envelope(results)


@app.get("/api/health")
def health():
    return envelope({"status": "ok"})