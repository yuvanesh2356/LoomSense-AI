"""SQLite/Postgres database setup, models, and demo seed data for LoomSense AI."""
import json
import os
from datetime import date, datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Date, DateTime,
    ForeignKey, Boolean, inspect, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Phase 12: environment-driven so Phase 15's Postgres migration is a
# config change, not a code change. SQLite needs check_same_thread=False
# for FastAPI's threaded request handling; Postgres does not accept (or
# need) that argument, so it's applied conditionally.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./loomsense.db")
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Weaver(Base):
    __tablename__ = "weavers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cluster = Column(String, nullable=False)
    product_category = Column(String, nullable=False)
    region = Column(String, nullable=False)
    weekly_capacity = Column(Integer, default=15)

    users = relationship("User", back_populates="weaver")
    forecasts = relationship("Forecast", back_populates="weaver")
    income_records = relationship("IncomeRecord", back_populates="weaver")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    # Phase 12: language/theme preference, persisted per-user so switching
    # devices or logging back in restores the same choice. Written via the
    # new auth-derived PATCH /api/me endpoint below.
    preferred_language = Column(String, default="en")
    preferred_theme = Column(String, default="light")

    weaver = relationship("Weaver", back_populates="users")


class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    target_date = Column(Date, nullable=False)
    reason = Column(String, nullable=False)
    factors_json = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    weaver = relationship("Weaver", back_populates="forecasts")
    outcomes = relationship("Outcome", back_populates="forecast")


class Outcome(Base):
    __tablename__ = "outcomes"
    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"))
    sold_quantity = Column(Integer, default=0)
    actual_price = Column(Float, default=0)
    accepted = Column(Boolean, default=True)
    logged_at = Column(DateTime, default=datetime.utcnow)

    forecast = relationship("Forecast", back_populates="outcomes")


class IncomeRecord(Base):
    __tablename__ = "income_records"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    month_label = Column(String, nullable=False)
    projected = Column(Float, nullable=False)
    actual = Column(Float, nullable=True)

    weaver = relationship("Weaver", back_populates="income_records")


class StateDemand(Base):
    __tablename__ = "states_demand"
    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String, unique=True, index=True, nullable=False)
    state_name = Column(String, nullable=False)
    demand_index = Column(Integer, nullable=False)
    growth_pct = Column(Float, nullable=False)
    top_products_json = Column(String, nullable=False)
    festivals_json = Column(String, nullable=False)
    price_trend = Column(String, nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    role = Column(String, nullable=False)
    message = Column(String, nullable=False)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)


class Festival(Base):
    __tablename__ = "festivals"
    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, index=True, nullable=False)
    festival_name = Column(String, nullable=False)
    month = Column(Integer, nullable=False)
    lift_multiplier = Column(Float, nullable=False)
    notes = Column(String, nullable=True)


class MarketplaceChannel(Base):
    __tablename__ = "marketplace_channels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    channel_type = Column(String, nullable=False)
    price_band_low = Column(Float, nullable=False)
    price_band_high = Column(Float, nullable=False)
    competition_level = Column(String, nullable=False)
    base_score = Column(Integer, nullable=False)
    info_url = Column(String, nullable=True)


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    applicable_states_json = Column(String, nullable=False)
    applicable_genders_json = Column(String, nullable=False)
    occupation_tags_json = Column(String, nullable=False)
    max_income = Column(Float, nullable=True)
    requires_shg = Column(Boolean, nullable=True)
    benefits = Column(String, nullable=False)
    eligibility_notes = Column(String, nullable=False)
    apply_link = Column(String, nullable=True)


class WeaverSchemeMatch(Base):
    __tablename__ = "weaver_scheme_matches"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"), nullable=True)
    scheme_id = Column(Integer, ForeignKey("government_schemes.id"))
    matched_at = Column(DateTime, default=datetime.utcnow)


class InventoryItem(Base):
    """Phase 9: Smart Inventory Management."""
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    item_type = Column(String, nullable=False)   # raw_material | finished_good
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)          # kg | units
    available_stock = Column(Float, nullable=False)
    predicted_stock = Column(Float, nullable=False)
    required_stock = Column(Float, nullable=False)
    low_stock_threshold = Column(Float, nullable=False)
    expiry_date = Column(Date, nullable=True)
    storage_location = Column(String, nullable=True)


class Alert(Base):
    """Phase 9: Smart Alerts — populated lazily on-read (see
    alerts_engine.generate_alerts), not via seed(). Deduped per weaver via
    source_key so repeated requests never create duplicates."""
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)   # info | warning | critical
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    source_key = Column(String, nullable=False, index=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class LearningResource(Base):
    """Phase 9: Learning Hub."""
    __tablename__ = "learning_resources"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)   # video | pdf | article
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    url = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    language = Column(String, default="en")


class CommunityProfile(Base):
    """Phase 9: Community Hub."""
    __tablename__ = "community_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    profile_type = Column(String, nullable=False)   # weaver | shg | mentor | expert
    region = Column(String, nullable=False)
    cluster = Column(String, nullable=False)
    bio = Column(String, nullable=False)
    contact_info = Column(String, nullable=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"), nullable=True)


class CommunityEvent(Base):
    __tablename__ = "community_events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    event_date = Column(String, nullable=False)   # simple label, e.g. "2026-09-14"
    region = Column(String, nullable=False)
    event_type = Column(String, nullable=False)


class FabricRecognitionLog(Base):
    """Phase 10: Fabric Image Recognition — audit log of uploads/results."""
    __tablename__ = "fabric_recognition_logs"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    uploaded_filename = Column(String, nullable=False)
    avg_color_hex = Column(String, nullable=False)
    detected_pattern = Column(String, nullable=False)
    predicted_category = Column(String, nullable=False)
    estimated_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WeaveRecommendationLog(Base):
    """Phase 10: 'What Should I Weave?' — audit log of recommendation runs."""
    __tablename__ = "weave_recommendation_logs"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"), nullable=True)
    region = Column(String, nullable=False)
    raw_material_kg = Column(Float, nullable=False)
    budget = Column(Float, nullable=False)
    time_available_days = Column(Float, nullable=False)
    results_json = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationPreference(Base):
    """Phase 12: Settings module notification channel toggles. Schema is
    provider-agnostic (just a channel + enabled flag) so it doesn't need
    to change when Firebase (Phase 13) or real notification delivery
    (later) are added."""
    __tablename__ = "notification_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel = Column(String, nullable=False)   # in_app | sms | email
    enabled = Column(Boolean, default=True)


def _ensure_column(engine, table_name: str, column_name: str, ddl_type: str, default_sql: str):
    """Phase 12: lightweight migration helper.

    `Base.metadata.create_all()` only creates tables that don't exist yet —
    it does NOT add new columns to tables that already exist (true for
    both SQLite and Postgres). Since this project's existing databases
    already have a `users` table without `preferred_language`/
    `preferred_theme`, those columns need an explicit ALTER TABLE, run
    once, idempotently, at startup. Using SQLAlchemy's inspector (not
    PRAGMA/information_schema directly) keeps this identical across
    SQLite today and Postgres after the Phase 15 migration.
    """
    inspector = inspect(engine)
    existing_columns = [col["name"] for col in inspector.get_columns(table_name)]
    if column_name not in existing_columns:
        with engine.connect() as conn:
            conn.execute(text(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_type} DEFAULT {default_sql}"
            ))
            conn.commit()


def run_migrations(engine):
    """Called once at app startup, after Base.metadata.create_all()."""
    _ensure_column(engine, "users", "preferred_language", "VARCHAR", "'en'")
    _ensure_column(engine, "users", "preferred_theme", "VARCHAR", "'light'")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed(db):
    """Populate demo data idempotently. Each table is seeded independently
    based on whether *that specific table* is empty — never gated behind a
    single early-return on `weavers`. This is the pattern established in
    Phase 7+8 and continued here for every new table; it's what makes
    Phase 12's real-dataset swap possible without ever deleting the DB or
    touching APIs/frontend."""

    # --- Weavers, users, income history --------------------------------------
    if db.query(Weaver).count() == 0:
        weavers = [
            Weaver(name="Lakshmi", cluster="Pochampally", product_category="Cotton Saree",
                   region="Telangana", weekly_capacity=14),
            Weaver(name="Ravi", cluster="Chanderi", product_category="Silk-Cotton Saree",
                   region="Madhya Pradesh", weekly_capacity=10),
            Weaver(name="Meena", cluster="Kanchipuram", product_category="Silk Saree",
                   region="Tamil Nadu", weekly_capacity=6),
        ]
        db.add_all(weavers)
        db.commit()

        users = [
            User(username="lakshmi", password="demo123", weaver_id=weavers[0].id),
            User(username="ravi", password="demo123", weaver_id=weavers[1].id),
            User(username="meena", password="demo123", weaver_id=weavers[2].id),
        ]
        db.add_all(users)
        db.commit()

        months = ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07",
                  "2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01"]
        base_by_weaver = {weavers[0].id: 9000, weavers[1].id: 7000, weavers[2].id: 15000}
        seasonal_curve = [0.7, 0.75, 0.65, 0.6, 0.55, 0.7, 0.9, 1.3, 1.5, 1.6, 1.2, 0.8]

        for w in weavers:
            base = base_by_weaver[w.id]
            for i, m in enumerate(months):
                projected = round(base * seasonal_curve[i], 0)
                is_past = i < 6
                actual = round(projected * (0.85 + 0.3 * ((w.id + i) % 3) / 2), 0) if is_past else None
                db.add(IncomeRecord(weaver_id=w.id, month_label=m, projected=projected, actual=actual))
        db.commit()

    # --- Phase 3+4: state-level demand summary -------------------------------
    if db.query(StateDemand).count() == 0:
        states_demand = [
            {"state_code": "TG", "state_name": "Telangana", "demand_index": 78, "growth_pct": 14.2,
             "top_products": ["Pochampally Ikkat Saree", "Cotton Dupatta", "Gadwal Saree"],
             "festivals": ["Ganesh Chaturthi", "Bathukamma", "Diwali"], "price_trend": "rising"},
            {"state_code": "TN", "state_name": "Tamil Nadu", "demand_index": 82, "growth_pct": 18.5,
             "top_products": ["Kanjeevaram Silk Saree", "Temple Border Saree", "Silk Stole"],
             "festivals": ["Pongal", "Navratri (Golu)", "Aadi Sale Season"], "price_trend": "rising"},
            {"state_code": "MP", "state_name": "Madhya Pradesh", "demand_index": 65, "growth_pct": 9.1,
             "top_products": ["Chanderi Silk-Cotton Saree", "Maheshwari Saree", "Dupatta Set"],
             "festivals": ["Navratri", "Diwali"], "price_trend": "stable"},
            {"state_code": "WB", "state_name": "West Bengal", "demand_index": 71, "growth_pct": 11.4,
             "top_products": ["Tant Cotton Saree", "Baluchari Saree", "Jamdani Saree"],
             "festivals": ["Durga Puja", "Poila Boishakh"], "price_trend": "rising"},
            {"state_code": "AS", "state_name": "Assam", "demand_index": 58, "growth_pct": 7.6,
             "top_products": ["Muga Silk Saree", "Gamosa", "Eri Silk Stole"],
             "festivals": ["Bihu", "Durga Puja"], "price_trend": "stable"},
            {"state_code": "AP", "state_name": "Andhra Pradesh", "demand_index": 60, "growth_pct": 8.3,
             "top_products": ["Mangalagiri Cotton Saree", "Uppada Silk Saree"],
             "festivals": ["Ugadi", "Sankranti"], "price_trend": "stable"},
            {"state_code": "KA", "state_name": "Karnataka", "demand_index": 55, "growth_pct": 6.0,
             "top_products": ["Ilkal Saree", "Mysore Silk Saree"],
             "festivals": ["Dasara", "Ugadi"], "price_trend": "falling"},
            {"state_code": "OD", "state_name": "Odisha", "demand_index": 62, "growth_pct": 10.2,
             "top_products": ["Sambalpuri Ikkat Saree", "Bomkai Saree"],
             "festivals": ["Rath Yatra", "Nuakhai"], "price_trend": "rising"},
            {"state_code": "UP", "state_name": "Uttar Pradesh", "demand_index": 48, "growth_pct": 4.5,
             "top_products": ["Banarasi Silk Saree", "Brocade Dupatta"],
             "festivals": ["Diwali", "Wedding Season"], "price_trend": "stable"},
            {"state_code": "GJ", "state_name": "Gujarat", "demand_index": 52, "growth_pct": 5.8,
             "top_products": ["Patola Saree", "Bandhani Dupatta"],
             "festivals": ["Navratri", "Diwali"], "price_trend": "stable"},
        ]
        for s in states_demand:
            db.add(StateDemand(
                state_code=s["state_code"], state_name=s["state_name"],
                demand_index=s["demand_index"], growth_pct=s["growth_pct"],
                top_products_json=json.dumps(s["top_products"]),
                festivals_json=json.dumps(s["festivals"]),
                price_trend=s["price_trend"],
            ))
        db.commit()

    # --- Phase 7: festivals ---------------------------------------------------
    if db.query(Festival).count() == 0:
        festivals = [
            {"region": "Telangana", "festival_name": "Ganesh Chaturthi", "month": 9, "lift": 1.35,
             "notes": "Strong demand for cotton and ikkat sarees across Telangana."},
            {"region": "Telangana", "festival_name": "Bathukamma", "month": 10, "lift": 1.3,
             "notes": "Traditional floral-festival demand for bright cotton sarees."},
            {"region": "Telangana", "festival_name": "Diwali", "month": 11, "lift": 1.4,
             "notes": "Peak gifting and wedding-adjacent season."},
            {"region": "Telangana", "festival_name": "Sankranti", "month": 1, "lift": 1.2,
             "notes": "Harvest festival, moderate demand uptick."},
            {"region": "Madhya Pradesh", "festival_name": "Navratri", "month": 10, "lift": 1.45,
             "notes": "Nine-night festival driving strong Chanderi saree demand."},
            {"region": "Madhya Pradesh", "festival_name": "Diwali", "month": 11, "lift": 1.5,
             "notes": "Highest-demand window of the year for the region."},
            {"region": "Madhya Pradesh", "festival_name": "Teej", "month": 8, "lift": 1.15,
             "notes": "Regional festival with modest demand for festive wear."},
            {"region": "Tamil Nadu", "festival_name": "Pongal", "month": 1, "lift": 1.6,
             "notes": "The single biggest demand window for Kanjeevaram silk sarees."},
            {"region": "Tamil Nadu", "festival_name": "Aadi Sale Season", "month": 8, "lift": 1.2,
             "notes": "Traditional shopping month, moderate uptick."},
            {"region": "Tamil Nadu", "festival_name": "Navratri (Golu)", "month": 10, "lift": 1.4,
             "notes": "Golu doll displays drive silk saree gifting."},
            {"region": "Tamil Nadu", "festival_name": "Deepavali", "month": 11, "lift": 1.3,
             "notes": "Strong festive and gifting demand."},
        ]
        for f in festivals:
            db.add(Festival(region=f["region"], festival_name=f["festival_name"],
                             month=f["month"], lift_multiplier=f["lift"], notes=f["notes"]))
        db.commit()

    # --- Phase 7: marketplace channels -----------------------------------------
    if db.query(MarketplaceChannel).count() == 0:
        channels = [
            {"name": "Amazon Karigar", "channel_type": "B2C Marketplace", "low": 800, "high": 5000,
             "competition": "High", "score": 70, "url": "https://www.amazonkarigar.com"},
            {"name": "GeM (Government e-Marketplace)", "channel_type": "Government Platform", "low": 600, "high": 4000,
             "competition": "Medium", "score": 65, "url": "https://gem.gov.in"},
            {"name": "ONDC", "channel_type": "Open Network Marketplace", "low": 700, "high": 4500,
             "competition": "Medium", "score": 68, "url": "https://ondc.org"},
            {"name": "Government Emporium", "channel_type": "Government Retail", "low": 1000, "high": 6000,
             "competition": "Low", "score": 60, "url": None},
            {"name": "Export Houses", "channel_type": "Export / B2B", "low": 1500, "high": 8000,
             "competition": "Medium", "score": 72, "url": None},
            {"name": "Local Haat / Market", "channel_type": "Local", "low": 500, "high": 2500,
             "competition": "Low", "score": 55, "url": None},
        ]
        for c in channels:
            db.add(MarketplaceChannel(
                name=c["name"], channel_type=c["channel_type"],
                price_band_low=c["low"], price_band_high=c["high"],
                competition_level=c["competition"], base_score=c["score"], info_url=c["url"],
            ))
        db.commit()

    # --- Phase 8: government schemes (illustrative demo dataset) --------------
    if db.query(GovernmentScheme).count() == 0:
        schemes = [
            {"name": "PM Vishwakarma", "category": "Credit & Skilling",
             "description": "Central scheme supporting traditional artisans and craftspeople, including handloom weavers, with recognition, skilling, and credit access.",
             "min_age": 18, "max_age": 65, "states": ["ALL"], "genders": ["ALL"],
             "occupations": ["weaver", "artisan", "handloom", "craftsperson"], "max_income": None,
             "shg": None, "benefits": "PM Vishwakarma certificate/ID, skill training stipend, toolkit incentive, collateral-free loans up to \u20b91 lakh (first tranche).",
             "notes": "Eligibility and benefit figures are illustrative for this demo \u2014 verify current terms before real-world use.",
             "link": "https://pmvishwakarma.gov.in"},
            {"name": "Mudra Loan \u2014 Shishu/Kishor/Tarun", "category": "Credit",
             "description": "Collateral-free micro-credit for small, non-corporate businesses, widely used by individual weavers and small handloom units.",
             "min_age": 18, "max_age": None, "states": ["ALL"], "genders": ["ALL"],
             "occupations": ["weaver", "artisan", "small business", "handloom"], "max_income": None,
             "shg": None, "benefits": "Loans from \u20b950,000 (Shishu) up to \u20b910 lakh (Tarun) depending on business stage, without collateral.",
             "notes": "Loan slabs are illustrative \u2014 confirm current limits with your bank/MFI.",
             "link": "https://www.mudra.org.in"},
            {"name": "Handloom Weavers' Comprehensive Welfare Scheme", "category": "Insurance",
             "description": "Life, accidental death, and disability insurance cover for handloom weavers, along with a health insurance component.",
             "min_age": 18, "max_age": 59, "states": ["ALL"], "genders": ["ALL"],
             "occupations": ["weaver", "handloom"], "max_income": None,
             "shg": None, "benefits": "Life cover, accidental death/disability cover, and health insurance for eligible handloom weavers and their families.",
             "notes": "Administered through state handloom departments \u2014 confirm current premium/coverage with your local office.",
             "link": None},
            {"name": "Yarn Supply Scheme", "category": "Subsidy",
             "description": "Subsidized yarn (cotton, silk, wool) supply to registered handloom weavers and cooperatives to reduce raw-material cost.",
             "min_age": None, "max_age": None, "states": ["ALL"], "genders": ["ALL"],
             "occupations": ["weaver", "handloom", "cooperative"], "max_income": None,
             "shg": None, "benefits": "Price subsidy and transport subsidy on yarn purchased through approved depots.",
             "notes": "Requires registration with the state handloom department or a recognized cooperative.",
             "link": None},
            {"name": "National Handicraft Development Programme", "category": "Training",
             "description": "Skill upgradation, design development, and marketing support for artisans and weavers.",
             "min_age": 18, "max_age": None, "states": ["ALL"], "genders": ["ALL"],
             "occupations": ["weaver", "artisan", "handicraft"], "max_income": None,
             "shg": None, "benefits": "Free/subsidized training programs, design workshops, and exposure visits to marketing events.",
             "notes": "Availability varies by state implementation cycle.",
             "link": None},
            {"name": "SHG-Linked Micro-credit Support", "category": "Credit",
             "description": "Priority-sector, lower-interest credit access for women weavers organized under a registered Self-Help Group.",
             "min_age": 18, "max_age": None, "states": ["ALL"], "genders": ["Female"],
             "occupations": ["weaver", "artisan", "handloom"], "max_income": 200000,
             "shg": True, "benefits": "Lower interest rates and simplified documentation for SHG-linked loans.",
             "notes": "Requires active, registered SHG membership \u2014 income cap is illustrative for this demo.",
             "link": None},
        ]
        for s in schemes:
            db.add(GovernmentScheme(
                name=s["name"], category=s["category"], description=s["description"],
                min_age=s["min_age"], max_age=s["max_age"],
                applicable_states_json=json.dumps(s["states"]),
                applicable_genders_json=json.dumps(s["genders"]),
                occupation_tags_json=json.dumps(s["occupations"]),
                max_income=s["max_income"], requires_shg=s["shg"],
                benefits=s["benefits"], eligibility_notes=s["notes"], apply_link=s["link"],
            ))
        db.commit()

    # --- Phase 9: inventory items ----------------------------------------------
    if db.query(InventoryItem).count() == 0:
        weavers = db.query(Weaver).all()
        inventory_seed = {
            "Lakshmi": [
                {"item_type": "raw_material", "name": "Cotton Yarn", "unit": "kg",
                 "available_stock": 8, "predicted_stock": 6, "required_stock": 10,
                 "low_stock_threshold": 3, "storage_location": "Home storeroom"},
                {"item_type": "finished_good", "name": "Cotton Saree (finished)", "unit": " units",
                 "available_stock": 4, "predicted_stock": 3, "required_stock": 12,
                 "low_stock_threshold": 2, "storage_location": "Cooperative warehouse"},
            ],
            "Ravi": [
                {"item_type": "raw_material", "name": "Silk-Cotton Yarn", "unit": "kg",
                 "available_stock": 5, "predicted_stock": 4, "required_stock": 8,
                 "low_stock_threshold": 2, "storage_location": "Home storeroom"},
                {"item_type": "finished_good", "name": "Silk-Cotton Saree (finished)", "unit": " units",
                 "available_stock": 2, "predicted_stock": 2, "required_stock": 8,
                 "low_stock_threshold": 2, "storage_location": "Local depot"},
            ],
            "Meena": [
                {"item_type": "raw_material", "name": "Mulberry Silk Yarn", "unit": "kg",
                 "available_stock": 3, "predicted_stock": 2, "required_stock": 5,
                 "low_stock_threshold": 1.5, "storage_location": "Home storeroom"},
                {"item_type": "finished_good", "name": "Silk Saree (finished)", "unit": " units",
                 "available_stock": 1, "predicted_stock": 1, "required_stock": 5,
                 "low_stock_threshold": 1, "storage_location": "Cooperative warehouse"},
            ],
        }
        for w in weavers:
            for item in inventory_seed.get(w.name, []):
                db.add(InventoryItem(weaver_id=w.id, **item))
        db.commit()

    # --- Phase 9: learning resources ---------------------------------------------
    if db.query(LearningResource).count() == 0:
        resources = [
            {"title": "Basics of Warping a Handloom", "resource_type": "video", "category": "Video Tutorials",
             "description": "Step-by-step guide to preparing the warp before weaving.", "url": None, "duration_minutes": 12},
            {"title": "Natural Dyeing Techniques", "resource_type": "video", "category": "Traditional Techniques",
             "description": "Traditional plant-based dyeing methods for cotton and silk yarn.", "url": None, "duration_minutes": 18},
            {"title": "Handloom Mark Registration Guide", "resource_type": "pdf", "category": "Government PDFs",
             "description": "Official steps to register for the Handloom Mark and GI tagging.", "url": None, "duration_minutes": None},
            {"title": "PM Vishwakarma Scheme Booklet", "resource_type": "pdf", "category": "Government PDFs",
             "description": "Full scheme details, eligibility, and application process.", "url": "https://pmvishwakarma.gov.in", "duration_minutes": None},
            {"title": "Reducing Yarn Wastage", "resource_type": "article", "category": "Best Practices",
             "description": "Practical tips to cut down on raw material wastage during weaving.", "url": None, "duration_minutes": 5},
            {"title": "Pricing Your Handloom Products Fairly", "resource_type": "article", "category": "Best Practices",
             "description": "How to set prices that cover cost and labour without losing customers.", "url": None, "duration_minutes": 6},
            {"title": "Power-Assisted Pre-Loom Processes", "resource_type": "video", "category": "Modern Methods",
             "description": "Modern equipment options for warping and winding that save time.", "url": None, "duration_minutes": 15},
            {"title": "Jacquard Weaving Fundamentals", "resource_type": "video", "category": "Traditional Techniques",
             "description": "Introduction to jacquard patterning on a traditional handloom.", "url": None, "duration_minutes": 20},
        ]
        for r in resources:
            db.add(LearningResource(**r))
        db.commit()

    # --- Phase 9: community profiles & events -------------------------------------
    if db.query(CommunityProfile).count() == 0:
        weavers = db.query(Weaver).all()
        profile_seed = {
            "Telangana": [
                {"name": "Pochampally Weavers Cooperative", "profile_type": "shg", "cluster": "Pochampally",
                 "bio": "120-member cooperative supporting bulk yarn purchase and order-sharing."},
                {"name": "Anjali Devi", "profile_type": "mentor", "cluster": "Pochampally",
                 "bio": "30 years of ikkat weaving experience, mentors new weavers on dye techniques."},
            ],
            "Madhya Pradesh": [
                {"name": "Chanderi Weavers Association", "profile_type": "shg", "cluster": "Chanderi",
                 "bio": "Cluster association coordinating festival-season bulk orders."},
                {"name": "Suresh Kumar", "profile_type": "expert", "cluster": "Chanderi",
                 "bio": "Design consultant specializing in modernizing traditional Chanderi motifs."},
            ],
            "Tamil Nadu": [
                {"name": "Kanchipuram Silk Weavers Trust", "profile_type": "shg", "cluster": "Kanchipuram",
                 "bio": "Trust supporting raw silk procurement and quality certification."},
                {"name": "Meenakshi Sundaram", "profile_type": "mentor", "cluster": "Kanchipuram",
                 "bio": "Master weaver specializing in temple-border silk sarees."},
            ],
        }
        for w in weavers:
            for p in profile_seed.get(w.region, []):
                db.add(CommunityProfile(name=p["name"], profile_type=p["profile_type"], region=w.region,
                                         cluster=p["cluster"], bio=p["bio"], contact_info=None, weaver_id=None))
        db.commit()

    if db.query(CommunityEvent).count() == 0:
        events = [
            {"title": "Telangana Handloom Expo", "description": "State-level exhibition and bulk-buyer meet.",
             "event_date": "2026-09-20", "region": "Telangana", "event_type": "Exhibition"},
            {"title": "Chanderi Design Workshop", "description": "Workshop on modernizing traditional motifs for export markets.",
             "event_date": "2026-10-05", "region": "Madhya Pradesh", "event_type": "Workshop"},
            {"title": "Kanchipuram Silk Mela", "description": "Annual silk saree fair with export house participation.",
             "event_date": "2026-10-18", "region": "Tamil Nadu", "event_type": "Fair"},
        ]
        for e in events:
            db.add(CommunityEvent(**e))
        db.commit()