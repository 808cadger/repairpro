"""main.py — AutoRepairIQ Pro FastAPI backend"""
# Aloha from Pearl City! 🌺

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models import (
    init_db, get_db,
    Vehicle, Estimate, RepairJob, Shop, MaintenanceLog, Expense,
)

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("autorepairiq.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.image_upload_dir, exist_ok=True)
    init_db()
    logger.info("AutoRepairIQ Pro backend started")
    yield
    logger.info("AutoRepairIQ Pro backend shutting down")


app = FastAPI(
    title="AutoRepairIQ Pro API",
    description="Unified AI auto repair — scan, estimate, jobs, finance",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.image_upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.image_upload_dir), name="uploads")


# ── Schemas ──────────────────────────────────────────────────

class VehicleIn(BaseModel):
    vin: str | None = None
    year: str = Field(..., min_length=4, max_length=4)
    make: str = Field(..., min_length=1, max_length=64)
    model: str = Field(..., min_length=1, max_length=64)
    trim: str | None = None
    mileage: str | None = None


class EstimateIn(BaseModel):
    vehicle_id: int | None = None
    estimate_type: str = "scan"  # scan | quote | lookup
    client_name: str | None = None
    image_paths: list[str] = []
    # For quote/lookup type
    repair_name: str | None = None
    job_description: str | None = None


class JobIn(BaseModel):
    estimate_id: int | None = None
    shop_id: int | None = None
    notes: str | None = None


class ShopIn(BaseModel):
    name: str
    phone: str | None = None
    hourly_rate: float = 110.0
    address: str | None = None


class ExpenseIn(BaseModel):
    job_id: int | None = None
    category: str
    amount: float
    description: str | None = None


class MaintenanceLogIn(BaseModel):
    vehicle_id: int
    service_type: str
    cost: float | None = None
    mileage_at: int | None = None
    notes: str | None = None


# ── Health ───────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"app": "AutoRepairIQ Pro", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        db.execute(db.bind.dialect.compiler(db.bind.dialect, None).__class__.__module__ and __import__("sqlalchemy").text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"
    return {"status": "ok", "version": "1.0.0", "db": db_status}


# ── Vehicles ─────────────────────────────────────────────────

@app.post("/vehicles", status_code=201)
async def create_vehicle(body: VehicleIn, db: Session = Depends(get_db)):
    v = Vehicle(**body.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return _vehicle_dict(v)


@app.get("/vehicles")
async def list_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).order_by(Vehicle.created_at.desc()).limit(50).all()
    return [_vehicle_dict(v) for v in vehicles]


@app.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.get(Vehicle, vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    return _vehicle_dict(v)


def _vehicle_dict(v: Vehicle) -> dict[str, Any]:
    return {
        "id": v.id, "vin": v.vin, "year": v.year, "make": v.make,
        "model": v.model, "trim": v.trim, "mileage": v.mileage,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


# ── Estimates ────────────────────────────────────────────────

@app.post("/estimates", status_code=201)
async def create_estimate(body: EstimateIn, db: Session = Depends(get_db)):
    est = Estimate(
        vehicle_id=body.vehicle_id,
        estimate_type=body.estimate_type,
        client_name=body.client_name,
        image_paths=body.image_paths if body.image_paths else None,
        repair_name=body.repair_name,
        status="pending",
    )
    db.add(est)
    db.commit()
    db.refresh(est)
    return _estimate_dict(est)


@app.get("/estimates")
async def list_estimates(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    ests = db.query(Estimate).order_by(Estimate.created_at.desc()).offset(skip).limit(min(limit, 100)).all()
    return [_estimate_dict(e) for e in ests]


@app.get("/estimates/{estimate_id}")
async def get_estimate(estimate_id: int, db: Session = Depends(get_db)):
    est = db.get(Estimate, estimate_id)
    if not est:
        raise HTTPException(404, "Estimate not found")
    return _estimate_dict(est)


def _estimate_dict(e: Estimate) -> dict[str, Any]:
    return {
        "id": e.id, "vehicle_id": e.vehicle_id, "estimate_type": e.estimate_type,
        "client_name": e.client_name, "status": e.status,
        "repair_name": e.repair_name,
        "total_min": e.total_min, "total_mid": e.total_mid, "total_max": e.total_max,
        "confidence_score": e.confidence_score,
        "vision": e.vision_result, "parts_map": e.parts_map,
        "pricing": e.pricing_result, "decision": e.decision_result,
        "error_message": e.error_message,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


# ── Repair Jobs ──────────────────────────────────────────────

@app.post("/jobs", status_code=201)
async def create_job(body: JobIn, db: Session = Depends(get_db)):
    job = RepairJob(**body.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_dict(job)


@app.get("/jobs")
async def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(RepairJob).order_by(RepairJob.created_at.desc()).limit(50).all()
    return [_job_dict(j) for j in jobs]


@app.patch("/jobs/{job_id}/status")
async def update_job_status(job_id: int, status: str, db: Session = Depends(get_db)):
    job = db.get(RepairJob, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    valid = {"estimate", "in-progress", "done", "invoiced"}
    if status not in valid:
        raise HTTPException(422, f"Invalid status. Must be one of: {valid}")
    job.status = status
    if status == "done":
        job.completed_at = datetime.now(timezone.utc)
    db.commit()
    return _job_dict(job)


def _job_dict(j: RepairJob) -> dict[str, Any]:
    return {
        "id": j.id, "estimate_id": j.estimate_id, "shop_id": j.shop_id,
        "status": j.status, "notes": j.notes,
        "scheduled_at": j.scheduled_at.isoformat() if j.scheduled_at else None,
        "completed_at": j.completed_at.isoformat() if j.completed_at else None,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }


# ── Shops ────────────────────────────────────────────────────

@app.post("/shops", status_code=201)
async def create_shop(body: ShopIn, db: Session = Depends(get_db)):
    shop = Shop(**body.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return _shop_dict(shop)


@app.get("/shops")
async def list_shops(db: Session = Depends(get_db)):
    shops = db.query(Shop).order_by(Shop.name).all()
    return [_shop_dict(s) for s in shops]


def _shop_dict(s: Shop) -> dict[str, Any]:
    return {
        "id": s.id, "name": s.name, "phone": s.phone,
        "hourly_rate": s.hourly_rate, "address": s.address,
    }


# ── Expenses ─────────────────────────────────────────────────

@app.post("/expenses", status_code=201)
async def create_expense(body: ExpenseIn, db: Session = Depends(get_db)):
    exp = Expense(**body.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return _expense_dict(exp)


@app.get("/expenses")
async def list_expenses(job_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Expense).order_by(Expense.date.desc())
    if job_id:
        q = q.filter(Expense.job_id == job_id)
    return [_expense_dict(e) for e in q.limit(100).all()]


@app.get("/expenses/export-csv")
async def export_expenses_csv(db: Session = Depends(get_db)):
    """QuickBooks-compatible CSV export"""
    from fastapi.responses import StreamingResponse
    import csv
    import io

    expenses = db.query(Expense).order_by(Expense.date).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Category", "Description", "Amount", "Job ID", "Invoiced"])
    for e in expenses:
        writer.writerow([
            e.date.strftime("%Y-%m-%d") if e.date else "",
            e.category, e.description or "", f"{e.amount:.2f}",
            e.job_id or "", "Yes" if e.invoiced else "No",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=autorepairiq-expenses.csv"},
    )


def _expense_dict(e: Expense) -> dict[str, Any]:
    return {
        "id": e.id, "job_id": e.job_id, "category": e.category,
        "amount": e.amount, "description": e.description,
        "date": e.date.isoformat() if e.date else None, "invoiced": e.invoiced,
    }


# ── Maintenance Logs ─────────────────────────────────────────

@app.post("/maintenance", status_code=201)
async def create_maintenance_log(body: MaintenanceLogIn, db: Session = Depends(get_db)):
    log = MaintenanceLog(**body.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return _maint_dict(log)


@app.get("/maintenance/{vehicle_id}")
async def get_maintenance_logs(vehicle_id: int, db: Session = Depends(get_db)):
    logs = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id == vehicle_id
    ).order_by(MaintenanceLog.service_date.desc()).limit(50).all()
    return [_maint_dict(m) for m in logs]


def _maint_dict(m: MaintenanceLog) -> dict[str, Any]:
    return {
        "id": m.id, "vehicle_id": m.vehicle_id, "service_type": m.service_type,
        "cost": m.cost, "mileage_at": m.mileage_at,
        "service_date": m.service_date.isoformat() if m.service_date else None,
        "next_due": m.next_due.isoformat() if m.next_due else None,
        "notes": m.notes,
    }


# ── Image Upload ─────────────────────────────────────────────

@app.post("/images/upload")
async def upload_image(file: UploadFile = File(...)):
    from backend.utils.image_store import save_upload
    content = await file.read()
    filename, size_kb = await save_upload(content, file.content_type or "image/jpeg")
    return {"filename": filename, "path": f"/uploads/{filename}", "size_kb": size_kb}
