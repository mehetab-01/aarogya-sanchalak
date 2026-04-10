from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import alert, patient, beds, setup
from firebase_client import get_ref
import os
from dotenv import load_dotenv

load_dotenv()
HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital1")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    print("  Aarogya Sanchalak — Backend Starting")
    print("=" * 55)
    try:
        bed_data = get_ref(f"/hospitals/{HOSPITAL_ID}/beds").get()
        if bed_data:
            print(f"[FIREBASE] Connected ✓  (hospital: {HOSPITAL_ID})")
            print("[BEDS] Current status:")
            for bed_type, data in bed_data.items():
                total    = data.get("total", 0)
                occupied = data.get("occupied", 0)
                available = total - occupied
                pct = round((occupied / total) * 100) if total > 0 else 0
                print(f"  {bed_type:<12} {occupied}/{total} occupied  ({available} free, {pct}%)")
        else:
            print(f"[FIREBASE] Connected ✓  — no bed data found for hospital: {HOSPITAL_ID}")
    except Exception as e:
        print(f"[FIREBASE] WARNING — could not reach database on startup: {e}")
    print("=" * 55 + "\n")
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    print("\n[SERVER] Shutting down. Goodbye.")


app = FastAPI(
    title="Aarogya Sanchalak API",
    description="Real-time hospital emergency coordination — NEOFuture 2026",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # admin
        "http://localhost:5174",  # driver
        "http://localhost:5175",  # doctor
        "http://localhost:5176",  # nurse
        "http://localhost:5177",  # wardboy
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alert.router,   prefix="/api/alert")
app.include_router(patient.router, prefix="/api/patient")
app.include_router(beds.router,    prefix="/api/beds")
app.include_router(setup.router,   prefix="/api/setup")


@app.get("/", tags=["root"])
def root():
    return {
        "status":  "Aarogya Sanchalak backend running",
        "version": "1.0.0",
        "docs":    "/docs",
    }
