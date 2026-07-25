"""SQLite database setup, models, and demo seed data for LoomSense AI."""
import json
from datetime import date, datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Date, DateTime,
    ForeignKey, Boolean
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./loomsense.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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
    """Phase 5+6: AI Weaver Consultant conversation history."""
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    weaver_id = Column(Integer, ForeignKey("weavers.id"))
    role = Column(String, nullable=False)          # "user" | "assistant"
    message = Column(String, nullable=False)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed(db):
    """Populate demo data once, idempotently."""
    if db.query(Weaver).count() > 0:
        return

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