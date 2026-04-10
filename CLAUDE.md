# Aarogya Sanchalak — Root CLAUDE.md
## Project Coordinator: Mehetab Ali (TabCrypt)

---

## What Is This?

**Aarogya Sanchalak** is a real-time hospital emergency coordination system built for NEOFuture Hackathon 2026 (PS-601, Open Innovation, SLRTCE, April 10–11).

**The problem it solves:** In India's emergency hospitals, the window between a patient boarding an ambulance and the hospital being fully prepared is completely uncoordinated — doctors get frantic phone calls, beds are checked manually, ward boys scramble after arrival. WHO data links this gap to 1 in 4 preventable deaths in under-resourced hospitals.

**The solution:** A unified, zero-phone-call platform with real-time Firebase sync across 5 role-based portals. An ambulance driver submits patient data; the system fires AI voice calls (Twilio/Polly.Aditi), WhatsApp alerts, and live bed preparation workflows — all before the patient arrives.

**Team: Neon Cortex**
| Person | Role | Owns |
|---|---|---|
| Mehetab Ali | Backend + Firebase + Integration + Pitch Demo | `backend/`, `portals/shared/` |
| Dhanshree Porwal | Admin Portal + Pitch Presenter | `portals/admin/` |
| Aditya Dherange | Doctor + Nurse + Ward Boy portals | `portals/doctor/`, `portals/nurse/`, `portals/wardboy/` |
| Sayali Bhagwat | Ambulance Driver portal (mobile-first) + Demo data | `portals/driver/` |

---

## Repository Structure

```
aarogya-sanchalak/
├── backend/                    # FastAPI — Mehetab ONLY
│   ├── main.py                 # App entry, router registration, CORS
│   ├── firebase_admin.py       # Firebase Admin SDK init
│   ├── routes/
│   │   ├── alert.py            # POST /api/alert/trigger, POST /api/alert/doctor-ack
│   │   ├── patient.py          # POST /api/patient/update
│   │   └── beds.py             # GET /api/beds/status
│   ├── services/
│   │   ├── twilio_voice.py     # AI voice calls (Polly.Aditi, en-IN, TwiML)
│   │   ├── twilio_whatsapp.py  # WhatsApp Business API alerts
│   │   └── twilio_sms.py       # SMS fallback
│   ├── requirements.txt
│   └── .env.example
├── portals/
│   ├── shared/                 # Mehetab ONLY — READ-ONLY for everyone else
│   │   ├── firebase.js         # Single Firebase init; exports db + auth
│   │   └── types.js            # ROLES, CONDITIONS, DB_PATHS, HOSPITAL_ID
│   ├── admin/                  # Dhanshree — localhost:5173
│   ├── driver/                 # Sayali  — localhost:5174
│   ├── doctor/                 # Aditya  — localhost:5175
│   ├── nurse/                  # Aditya  — localhost:5176
│   └── wardboy/                # Aditya  — localhost:5177
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend portals | React + Vite + Tailwind CSS (one Vite app per portal) |
| Backend | FastAPI (Python 3.10+) |
| Database | Firebase Realtime Database |
| Auth | Firebase Auth with custom JWT role claims |
| AI Voice | Twilio Programmable Voice — Polly.Aditi, en-IN |
| WhatsApp | Twilio WhatsApp Business API sandbox |
| SMS fallback | Twilio SMS |

---

## Firebase Database Schema

```
/hospitals/{hospitalId}/
  beds/
    icu:        { total: 20, occupied: 14 }
    general:    { total: 80, occupied: 61 }
    emergency:  { total: 10, occupied: 7 }
  alerts/{alertId}/
    patientName   string
    age           number
    condition     "CRITICAL" | "SERIOUS" | "STABLE"
    vitals:       { bp: string, pulse: number }
    eta           number  (minutes)
    driverId      string
    status        "INCOMING" | "ADMITTED" | "DISCHARGED"
    doctorAck     boolean (default: false)
    nurseAck      boolean (default: false)
    wardAck       boolean (default: false)
    timestamp     number  (Unix ms)
  patients/{patientId}/
    ...
```

`HOSPITAL_ID` is defined in `portals/shared/types.js` — never hardcode it.

---

## Escalation Flow (the core product)

```
1. Driver submits patient data
      → Firebase alert created under /hospitals/{id}/alerts/
      → POST /api/alert/trigger fires

2. Backend fires simultaneously:
      → Twilio AI voice call to doctor (Polly.Aditi, en-IN)
      → WhatsApp message to doctor
      → WhatsApp message to ward boy (bed prep)

3. If doctorAck=false after 60 seconds:
      → Auto-escalate: voice + WhatsApp to nurse

4. Firebase onValue() listeners update all portals in real-time:
      → Admin dashboard: live alert table + bed counts
      → Doctor portal: patient card appears
      → Nurse portal: task checklist activates
      → Ward boy portal: bed prep confirmation appears

5. Driver sees live status:
      "Hospital Notified" → "Doctor Acknowledged" → "Bed Assigned"
```

---

## Dev Ports (all run simultaneously)

| Portal | Command | URL |
|---|---|---|
| admin | `cd portals/admin && npm run dev` | http://localhost:5173 |
| driver | `cd portals/driver && npm run dev` | http://localhost:5174 |
| doctor | `cd portals/doctor && npm run dev` | http://localhost:5175 |
| nurse | `cd portals/nurse && npm run dev` | http://localhost:5176 |
| wardboy | `cd portals/wardboy && npm run dev` | http://localhost:5177 |
| backend | `cd backend && uvicorn main:app --reload` | http://localhost:8000 |

---

## Demo Scenario (preloaded for pitch)

```
Patient:      Rahul Sharma
Age:          34
Condition:    CRITICAL
BP:           90/60
Pulse:        112 bpm
ETA:          8 minutes
Ambulance ID: AMB-042
```

---

## Judging Criteria (NEOFuture 2026)

- Innovation
- Feasibility
- Technical Implementation
- Impact

**SDG alignment:** SDG 3 (primary — Good Health), SDG 10, SDG 9, SDG 11

**Pitch structure (5 min):**
1. Hook: "1 in 4 preventable deaths linked to emergency coordination delay"
2. Problem: real scenario walkthrough
3. Solution: Aarogya Sanchalak demo
4. Impact: SDG 3 target 3.8, 25,000+ govt hospitals, ₹8k/mo SaaS model
5. Close: "the communication layer India's emergency hospitals never had"

---

## Golden Rules — Enforce Everywhere

1. **Never edit `portals/shared/`** — only Mehetab touches `firebase.js` and `types.js`
2. **Import shared files correctly:** `import { db } from '../../shared/firebase.js'` — never duplicate Firebase init
3. **Use `onValue()` for all realtime data** — never setInterval/polling
4. **All portals are standalone Vite apps** — no shared `node_modules`, each has its own `package.json`
5. **Every Firebase-touching component must handle null/loading state** — show a spinner or "Loading…" before data arrives
6. **No hardcoded `HOSPITAL_ID`** — always import from `../../shared/types.js`
7. **No hardcoded phone numbers in code** — always read from `process.env` / `.env`
8. **Respect file ownership** — if a file isn't in your portal folder, don't touch it

---

## As Coordinator (Mehetab), Your Responsibilities

- Own the backend end-to-end: FastAPI routes, Twilio services, Firebase Admin SDK
- Own `portals/shared/` — any changes to `firebase.js` or `types.js` must come from you
- Ensure the backend `.env` is set up correctly before demo (all Twilio + Firebase keys)
- Coordinate integration testing: driver form → backend POST → Firebase write → portal updates
- Run the live demo on the day: driver phone + admin laptop, real Firebase sync

See `backend/CLAUDE.md` for your detailed backend briefing.
