import os
import time
import asyncio
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from firebase_client import get_ref

load_dotenv()

HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital1")
VALID_CONDITIONS = ["CRITICAL", "SERIOUS", "STABLE"]

router = APIRouter(tags=["alerts"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class AlertPayload(BaseModel):
    patientName: str
    age: int
    condition: str      # CRITICAL | SERIOUS | STABLE
    bp: str             # e.g. "90/60"
    pulse: int
    eta: int            # minutes
    driverId: str
    notes: str = ""


class AckPayload(BaseModel):
    alertId: str


class AdmitPayload(BaseModel):
    alertId: str
    bedType: str


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


# ---------------------------------------------------------------------------
# Escalation background task
# ---------------------------------------------------------------------------

async def escalation_check(alertId: str, patientName: str):
    log(f"[ESCALATION] Timer started for {alertId} ({patientName}) — waiting 60s")
    await asyncio.sleep(60)
    try:
        alert = get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{alertId}").get()
        if alert and not alert.get("doctorAck", False):
            get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{alertId}").update({
                "escalatedToNurse":  True,
                "escalationFiredAt": int(time.time() * 1000),
            })
            log(f"[ESCALATION] FIRED for {alertId} — doctor did not respond in 60s")
        else:
            log(f"[ESCALATION] Cancelled for {alertId} — doctor already acknowledged")
    except Exception as e:
        log(f"[ESCALATION] Error: {e}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/trigger")
async def trigger_alert(payload: AlertPayload, background_tasks: BackgroundTasks):
    if payload.condition not in VALID_CONDITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid condition '{payload.condition}'. Must be one of: {VALID_CONDITIONS}"
        )
    try:
        alertId = str(uuid4())
        now_ms  = int(time.time() * 1000)

        # Write alert to Firebase
        get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{alertId}").set({
            "patientName":        payload.patientName,
            "age":                payload.age,
            "condition":          payload.condition,
            "vitals":             {"bp": payload.bp, "pulse": payload.pulse},
            "eta":                payload.eta,
            "driverId":           payload.driverId,
            "notes":              payload.notes,
            "status":             "INCOMING",
            "doctorAck":          False,
            "nurseAck":           False,
            "wardAck":            False,
            "escalatedToNurse":    False,
            "escalationStartedAt": now_ms,
            "timestamp":           now_ms,
        })

        # Increment emergency occupied count
        bed_ref  = get_ref(f"/hospitals/{HOSPITAL_ID}/beds/emergency")
        bed_data = bed_ref.get()
        if bed_data:
            total    = bed_data.get("total", 0)
            occupied = bed_data.get("occupied", 0)
            new_occupied = min(occupied + 1, total)
            get_ref(f"/hospitals/{HOSPITAL_ID}/beds/emergency/occupied").set(new_occupied)

        # Start escalation timer
        background_tasks.add_task(escalation_check, alertId, payload.patientName)

        log(f"[ALERT] TRIGGERED: {alertId} | {payload.patientName} | {payload.condition} | ETA {payload.eta}min")

        return {
            "alertId":             alertId,
            "status":              "triggered",
            "escalationStartedAt": now_ms,
            "patient":             payload.patientName,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger alert: {str(e)}")


@router.post("/doctor-ack")
async def doctor_ack(payload: AckPayload):
    try:
        now_ms = int(time.time() * 1000)
        get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{payload.alertId}").update({
            "doctorAck":   True,
            "doctorAckAt": now_ms,
        })
        log(f"[ACK] Doctor acknowledged alert {payload.alertId}")
        return {"status": "acknowledged", "role": "doctor", "alertId": payload.alertId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Doctor ack failed: {str(e)}")


@router.post("/nurse-ack")
async def nurse_ack(payload: AckPayload):
    try:
        now_ms = int(time.time() * 1000)
        get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{payload.alertId}").update({
            "nurseAck":   True,
            "nurseAckAt": now_ms,
        })
        log(f"[ACK] Nurse acknowledged alert {payload.alertId}")
        return {"status": "acknowledged", "role": "nurse", "alertId": payload.alertId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nurse ack failed: {str(e)}")


@router.post("/ward-ack")
async def ward_ack(payload: AckPayload):
    try:
        now_ms = int(time.time() * 1000)
        get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{payload.alertId}").update({
            "wardAck":   True,
            "wardAckAt": now_ms,
        })
        log(f"[ACK] Ward boy acknowledged alert {payload.alertId}")
        return {"status": "acknowledged", "role": "wardboy", "alertId": payload.alertId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ward ack failed: {str(e)}")


@router.post("/admit")
async def admit_patient(payload: AdmitPayload):
    try:
        now_ms = int(time.time() * 1000)
        get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{payload.alertId}").update({
            "status":     "ADMITTED",
            "admittedAt": now_ms,
        })
        log(f"[ADMIT] Alert {payload.alertId} admitted to bed type: {payload.bedType}")
        return {"status": "admitted", "alertId": payload.alertId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Admit failed: {str(e)}")


@router.get("/active")
async def get_active_alerts():
    try:
        data = get_ref(f"/hospitals/{HOSPITAL_ID}/alerts").get()
        if not data:
            return []
        return [
            {"alertId": key, **alert}
            for key, alert in data.items()
            if alert.get("status") == "INCOMING"
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")


@router.get("/{alertId}")
async def get_alert(alertId: str):
    try:
        data = get_ref(f"/hospitals/{HOSPITAL_ID}/alerts/{alertId}").get()
        if data is None:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"alertId": alertId, **data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alert: {str(e)}")
