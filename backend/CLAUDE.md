# Backend CLAUDE.md
## Owner: Mehetab Ali (TabCrypt) — SOLE OWNER OF THIS DIRECTORY

---

## Your Role

You own everything in `backend/`. No other team member should be editing files here. Your job is:
- FastAPI routes for alert triggering, acknowledgements, patient updates, bed status
- Twilio AI voice calls (doctor escalation, nurse escalation)
- Twilio WhatsApp and SMS alerts
- Firebase Admin SDK integration (server-side writes/reads)
- `.env` management and keeping `.env.example` in sync

---

## Files You Own

```
backend/
├── main.py                      # FastAPI app, router registration, CORS config
├── firebase_admin.py            # Firebase Admin SDK init (reads FIREBASE_* from .env)
├── routes/
│   ├── alert.py                 # POST /api/alert/trigger, POST /api/alert/doctor-ack
│   ├── patient.py               # POST /api/patient/update
│   └── beds.py                  # GET /api/beds/status
├── services/
│   ├── twilio_voice.py          # AI voice calls — TwiML, Polly.Aditi, en-IN, escalation
│   ├── twilio_whatsapp.py       # WhatsApp Business API alerts
│   └── twilio_sms.py            # SMS fallback
├── requirements.txt
└── .env.example                 # Template — never put real secrets here
```

---

## Running the Backend

```bash
# From the backend/ directory
cd backend

# Activate virtualenv (create if needed)
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash

# Install dependencies
pip install -r requirements.txt

# Start dev server
uvicorn main:app --reload
# Runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill every value before running. Never commit `.env`.

```bash
# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_URL=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=          # From number for voice + SMS
TWILIO_WHATSAPP_FROM=         # e.g. whatsapp:+14155238886 (sandbox)

# Staff contact numbers (no hardcoding in code — always from .env)
DOCTOR_PHONE=
NURSE_PHONE=
WARDBOY_PHONE=
DOCTOR_WHATSAPP=
NURSE_WHATSAPP=
WARDBOY_WHATSAPP=

# App
HOSPITAL_ID=hospital_001
```

---

## API Endpoints

### POST /api/alert/trigger
Called by the driver portal after submitting patient data. Writes alert to Firebase, then fires voice + WhatsApp to doctor and WhatsApp to ward boy.

**Request body:**
```json
{
  "patientName": "Rahul Sharma",
  "age": 34,
  "condition": "CRITICAL",
  "vitals": { "bp": "90/60", "pulse": 112 },
  "eta": 8,
  "driverId": "AMB-042"
}
```

**Response:**
```json
{ "alertId": "<firebase_push_key>", "status": "triggered" }
```

### POST /api/alert/doctor-ack
Called when the doctor acknowledges via their portal. Updates `doctorAck: true` in Firebase.

**Request body:**
```json
{ "alertId": "<firebase_push_key>" }
```

### POST /api/patient/update
Updates patient record in `/hospitals/{id}/patients/{patientId}/`.

### GET /api/beds/status
Returns current bed counts from Firebase for the configured `HOSPITAL_ID`.

---

## Firebase Admin SDK Pattern

```python
# firebase_admin.py — initialize once
import firebase_admin
from firebase_admin import credentials, db
import os

cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
    "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
    # ... other fields
})
firebase_admin.initialize_app(cred, {
    "databaseURL": os.getenv("FIREBASE_DATABASE_URL")
})

# In routes — import and use db directly
from firebase_admin import db as firebase_db

ref = firebase_db.reference(f"/hospitals/{HOSPITAL_ID}/alerts")
new_alert = ref.push(alert_data)   # returns push key
alert_id = new_alert.key
```

---

## Twilio Voice — Escalation Logic

```python
# services/twilio_voice.py
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Say
import os, asyncio

def build_twiml(patient_name: str, condition: str, eta: int) -> str:
    response = VoiceResponse()
    response.say(
        f"Aarogya Sanchalak emergency alert. Patient {patient_name}, "
        f"condition {condition}, arriving in {eta} minutes. "
        f"Please acknowledge immediately on the Aarogya Sanchalak portal.",
        voice="Polly.Aditi",
        language="en-IN"
    )
    return str(response)

async def call_with_escalation(alert_id: str, patient_name: str,
                                condition: str, eta: int):
    client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

    # Fire call to doctor
    client.calls.create(
        to=os.getenv("DOCTOR_PHONE"),
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        twiml=build_twiml(patient_name, condition, eta)
    )

    # Wait 60 seconds, then check doctorAck
    await asyncio.sleep(60)

    from firebase_admin import db
    alert = db.reference(f"/hospitals/{HOSPITAL_ID}/alerts/{alert_id}").get()
    if alert and not alert.get("doctorAck", False):
        # Escalate to nurse
        client.calls.create(
            to=os.getenv("NURSE_PHONE"),
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            twiml=build_twiml(patient_name, condition, eta)
        )
```

Run escalation as a background task using `asyncio.create_task()` from the route handler — don't block the HTTP response.

---

## WhatsApp Alert Pattern

```python
# services/twilio_whatsapp.py
from twilio.rest import Client
import os

def send_whatsapp(to_number: str, message: str):
    """to_number format: 'whatsapp:+919876543210'"""
    client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
    client.messages.create(
        body=message,
        from_=os.getenv("TWILIO_WHATSAPP_FROM"),  # e.g. whatsapp:+14155238886
        to=to_number
    )

def alert_doctor_whatsapp(patient_name: str, condition: str, eta: int):
    msg = (
        f"🚨 AAROGYA SANCHALAK ALERT\n"
        f"Patient: {patient_name}\n"
        f"Condition: {condition}\n"
        f"ETA: {eta} minutes\n"
        f"Please acknowledge on the portal immediately."
    )
    send_whatsapp(os.getenv("DOCTOR_WHATSAPP"), msg)
```

---

## Route Pattern (FastAPI)

```python
# routes/alert.py
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from firebase_admin import db
from services.twilio_voice import call_with_escalation
from services.twilio_whatsapp import alert_doctor_whatsapp, alert_wardboy_whatsapp
import os, time

router = APIRouter(prefix="/api/alert", tags=["alert"])
HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital_001")

class AlertRequest(BaseModel):
    patientName: str
    age: int
    condition: str  # CRITICAL | SERIOUS | STABLE
    vitals: dict
    eta: int
    driverId: str

@router.post("/trigger")
async def trigger_alert(payload: AlertRequest, background_tasks: BackgroundTasks):
    alert_data = {
        **payload.dict(),
        "status": "INCOMING",
        "doctorAck": False,
        "nurseAck": False,
        "wardAck": False,
        "timestamp": int(time.time() * 1000)
    }

    # Write to Firebase
    ref = db.reference(f"/hospitals/{HOSPITAL_ID}/alerts")
    new_ref = ref.push(alert_data)
    alert_id = new_ref.key

    # Fire comms (non-blocking)
    alert_doctor_whatsapp(payload.patientName, payload.condition, payload.eta)
    alert_wardboy_whatsapp(payload.patientName, payload.condition, payload.eta)
    background_tasks.add_task(
        call_with_escalation,
        alert_id, payload.patientName, payload.condition, payload.eta
    )

    return {"alertId": alert_id, "status": "triggered"}
```

---

## CORS Configuration

```python
# main.py — allow all portal origins in dev
from fastapi.middleware.cors import CORSMiddleware

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
```

---

## Common Mistakes to Avoid

- **Blocking the event loop:** Never `time.sleep()` in an async route. Use `asyncio.sleep()` or `BackgroundTasks`.
- **Private key newlines:** Firebase private key from `.env` needs `.replace("\\n", "\n")` — GCP formats it with literal `\n`.
- **Double Firebase init:** `firebase_admin.initialize_app()` must only be called once. Import `firebase_admin.py` via the app startup, not from every route file.
- **Hardcoding phone numbers:** Every number goes in `.env`. The code reads `os.getenv(...)`.
- **Not handling Twilio errors:** Wrap `client.calls.create()` in try/except — if Twilio is unreachable, the alert still goes into Firebase. Log the error but don't crash the request.
- **Forgetting to update `.env.example`:** Every time you add a new env var, update `.env.example` with a blank placeholder and a comment.

---

## Golden Rules (Backend Edition)

1. No other team member edits files in `backend/` — if they ask for an API change, you make it
2. Never commit `.env` — only `.env.example`
3. All phone numbers and credentials come from `os.getenv()`
4. Firebase writes use the Admin SDK (server-side) — not the client SDK
5. Voice escalation runs as a background task — the HTTP response returns immediately
6. Test every endpoint at `http://localhost:8000/docs` before declaring it done
