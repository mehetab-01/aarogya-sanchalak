import os
import time
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_client import get_ref

load_dotenv()

HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital1")

router = APIRouter(tags=["patients"])


class PatientUpdatePayload(BaseModel):
    patientId: str
    condition: str
    eta: int
    notes: str = ""


@router.post("/update")
def update_patient(payload: PatientUpdatePayload):
    get_ref(f"/hospitals/{HOSPITAL_ID}/patients/{payload.patientId}").set({
        "condition": payload.condition,
        "eta":       payload.eta,
        "notes":     payload.notes,
        "updatedAt": int(time.time() * 1000),
    })
    print(f"[PATIENT] Updated {payload.patientId} — {payload.condition}, ETA {payload.eta}min")
    return {"status": "updated", "patientId": payload.patientId}


@router.get("/{patientId}")
def get_patient(patientId: str):
    data = get_ref(f"/hospitals/{HOSPITAL_ID}/patients/{patientId}").get()
    if data is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return data
