from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class AlertPayload(BaseModel):
    patientName: str
    age: int
    condition: str          # CRITICAL | SERIOUS | STABLE
    bp: str
    pulse: int
    eta: int                # minutes
    driverId: str
    notes: str = ""

@router.post("/trigger")
async def trigger_alert(payload: AlertPayload):
    # TODO: write to Firebase, fire Twilio voice + WhatsApp
    return {"status": "alert_triggered", "patient": payload.patientName}

@router.post("/doctor-ack")
async def doctor_ack(alertId: str):
    # TODO: set doctorAck=true in Firebase
    return {"status": "acknowledged"}
