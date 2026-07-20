"""SQLite database setup, models, and demo seed data for LoomSense AI."""
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
    password = Column(String, nullable=False)  # plaintext for demo simplicity
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
    factors_json = Column(String, nullable=False)  # JSON-serialized factor list
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
    month_label = Column(String, nullable=False)   # e.g. "2026-08"
    projected = Column(Float, nullable=False)
    actual = Column(Float, nullable=True)

    weaver = relationship("Weaver", back_populates="income_records")


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

    # Seed 12 months of income history (past 6 actual, future 6 projected-only)
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