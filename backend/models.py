"""models.py — AutoRepairIQ Pro ORM models"""
# Aloha from Pearl City! 🌺

import json
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from sqlalchemy.types import TypeDecorator

from backend.config import settings

DATABASE_URL = f"sqlite:///{settings.db_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class JSONColumn(TypeDecorator):
    """Stores Python dicts/lists as JSON text in SQLite."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value) if value is not None else None

    def process_result_value(self, value, dialect):
        return json.loads(value) if value is not None else None


def _utcnow():
    return datetime.now(timezone.utc)


# ── Vehicle ──────────────────────────────────────────────────

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vin = Column(String(17), nullable=True, unique=True)
    year = Column(String(4), nullable=True)
    make = Column(String(64), nullable=True)
    model = Column(String(64), nullable=True)
    trim = Column(String(64), nullable=True)
    mileage = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    estimates = relationship("Estimate", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")


# ── Estimate ─────────────────────────────────────────────────

class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    estimate_type = Column(String(16), default="scan")  # scan | quote | lookup
    client_name = Column(String(128), nullable=True)

    # Image references
    image_paths = Column(JSONColumn, nullable=True)

    # Vision pipeline outputs (scan type)
    vision_result = Column(JSONColumn, nullable=True)
    parts_map = Column(JSONColumn, nullable=True)
    pricing_result = Column(JSONColumn, nullable=True)
    decision_result = Column(JSONColumn, nullable=True)

    # Quick estimate fields (quote/lookup type)
    repair_name = Column(String(256), nullable=True)
    labor_hrs_min = Column(Float, nullable=True)
    labor_hrs_max = Column(Float, nullable=True)
    parts_min = Column(Float, nullable=True)
    parts_max = Column(Float, nullable=True)
    labor_min = Column(Float, nullable=True)
    labor_max = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    # Denormalized summary
    total_min = Column(Float, nullable=True)
    total_mid = Column(Float, nullable=True)
    total_max = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    human_review_flag = Column(Boolean, default=False)
    severity = Column(String(16), nullable=True)
    primary_part = Column(String(128), nullable=True)

    status = Column(String(16), default="pending")  # pending | complete | failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    vehicle = relationship("Vehicle", back_populates="estimates")
    job = relationship("RepairJob", back_populates="estimate", uselist=False)


# ── Shop ─────────────────────────────────────────────────────

class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    phone = Column(String(20), nullable=True)
    hourly_rate = Column(Float, default=110.0)
    address = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    jobs = relationship("RepairJob", back_populates="shop")


# ── Repair Job ───────────────────────────────────────────────

class RepairJob(Base):
    __tablename__ = "repair_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), nullable=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
    status = Column(String(16), default="estimate")  # estimate | in-progress | done | invoiced
    notes = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    estimate = relationship("Estimate", back_populates="job")
    shop = relationship("Shop", back_populates="jobs")
    expenses = relationship("Expense", back_populates="job")


# ── Maintenance Log ──────────────────────────────────────────

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String(64), nullable=False)  # oil_change | brake_pad | tire_rotation | etc
    cost = Column(Float, nullable=True)
    mileage_at = Column(Integer, nullable=True)
    service_date = Column(DateTime, default=_utcnow, nullable=False)
    next_due = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")


# ── Expense ──────────────────────────────────────────────────

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("repair_jobs.id"), nullable=True)
    category = Column(String(32), nullable=False)  # labor | parts | materials | other
    amount = Column(Float, nullable=False)
    description = Column(String(256), nullable=True)
    date = Column(DateTime, default=_utcnow, nullable=False)
    invoiced = Column(Boolean, default=False)

    job = relationship("RepairJob", back_populates="expenses")


# ── DB Helpers ───────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
