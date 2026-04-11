import asyncio
import time
import math
import os
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from firebase_client import get_ref
from dotenv import load_dotenv

load_dotenv()
HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital1")

router = APIRouter(tags=["bloodbank"])

# Blood bank directory — Mumbai Metropolitan Region
# Source: data.gov.in Blood Bank Directory (National Health Portal)
# Lat/lng from NHP directory; stock is simulated for demo
import random, hashlib

def _stock(seed: str, group: str) -> int:
    """Deterministic pseudo-random stock so numbers are stable per bank+group."""
    h = int(hashlib.md5(f"{seed}{group}".encode()).hexdigest(), 16)
    base = {"A+": 20, "B+": 18, "O+": 25, "AB+": 8,
            "A-": 4,  "B-": 3,  "O-": 6,  "AB-": 2}
    return (h % (base[group] + 1))

def _make_stock(bank_id: str) -> dict:
    groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    return {g: _stock(bank_id, g) for g in groups}

_RAW_BANKS = [
    # Mumbai City
    {"id": "kem",        "name": "KEM Hospital Blood Bank",                  "location": "Parel, Mumbai",          "lat": 19.0005, "lng": 72.8407, "phone": "022-24136051"},
    {"id": "nair",       "name": "Nair Hospital Blood Bank",                 "location": "Mumbai Central",         "lat": 18.9726, "lng": 72.8195, "phone": "022-23027600"},
    {"id": "sion",       "name": "Sion Hospital Blood Bank",                 "location": "Sion, Mumbai",           "lat": 19.0401, "lng": 72.8639, "phone": "022-24076381"},
    {"id": "jj",         "name": "J.J. Hospital Blood Bank",                 "location": "Byculla, Mumbai",        "lat": 18.9616, "lng": 72.8347, "phone": "022-23735555"},
    {"id": "hinduja",    "name": "Hinduja Hospital Blood Bank",              "location": "Mahim, Mumbai",          "lat": 19.0390, "lng": 72.8394, "phone": "022-24452222"},
    {"id": "cooper",     "name": "Cooper Hospital Blood Bank",               "location": "Vile Parle, Mumbai",     "lat": 19.1041, "lng": 72.8490, "phone": "022-26207254"},
    {"id": "bkl",        "name": "Bhabha Hospital Blood Bank",               "location": "Kurla, Mumbai",          "lat": 19.0745, "lng": 72.8828, "phone": "022-25012051"},
    {"id": "rajawadi",   "name": "Rajawadi Hospital Blood Bank",             "location": "Ghatkopar, Mumbai",      "lat": 19.0897, "lng": 72.9076, "phone": "022-25012051"},
    {"id": "bhagwati",   "name": "Bhagwati Hospital Blood Bank",             "location": "Borivali, Mumbai",       "lat": 19.2284, "lng": 72.8634, "phone": "022-28914281"},
    {"id": "hkb",        "name": "Holy Cross Blood Bank",                    "location": "Kurla West, Mumbai",     "lat": 19.0700, "lng": 72.8780, "phone": "022-25014261"},
    {"id": "masina",     "name": "Masina Hospital Blood Bank",               "location": "Byculla, Mumbai",        "lat": 18.9743, "lng": 72.8374, "phone": "022-23088888"},
    {"id": "bombay",     "name": "Bombay Hospital Blood Bank",               "location": "Marine Lines, Mumbai",   "lat": 18.9413, "lng": 72.8243, "phone": "022-22067676"},
    {"id": "breach",     "name": "Breach Candy Hospital Blood Bank",         "location": "Breach Candy, Mumbai",   "lat": 18.9720, "lng": 72.8056, "phone": "022-23667888"},
    {"id": "lilavati",   "name": "Lilavati Hospital Blood Bank",             "location": "Bandra West, Mumbai",    "lat": 19.0525, "lng": 72.8258, "phone": "022-26751000"},
    {"id": "kokilaben",  "name": "Kokilaben Dhirubhai Ambani Blood Bank",    "location": "Andheri West, Mumbai",   "lat": 19.1327, "lng": 72.8269, "phone": "022-30999999"},
    {"id": "nanavati",   "name": "Nanavati Hospital Blood Bank",             "location": "Vile Parle, Mumbai",     "lat": 19.1001, "lng": 72.8347, "phone": "022-26182800"},
    {"id": "seven_hills","name": "Seven Hills Hospital Blood Bank",          "location": "Marol, Andheri",         "lat": 19.1157, "lng": 72.8791, "phone": "022-67676767"},
    {"id": "srcc",       "name": "SRCC Children's Hospital Blood Bank",      "location": "Haji Ali, Mumbai",       "lat": 18.9795, "lng": 72.8146, "phone": "022-61588888"},
    # Thane
    {"id": "cheda",      "name": "Civil Hospital Blood Bank Thane",          "location": "Thane",                  "lat": 19.2183, "lng": 72.9781, "phone": "022-25334265"},
    {"id": "jupiter",    "name": "Jupiter Hospital Blood Bank",              "location": "Thane West",             "lat": 19.2090, "lng": 72.9634, "phone": "022-21826100"},
    {"id": "kaushalya",  "name": "Kaushalya Medical Foundation Blood Bank",  "location": "Thane",                  "lat": 19.2156, "lng": 72.9740, "phone": "022-25402020"},
    # Navi Mumbai
    {"id": "mgm",        "name": "MGM Hospital Blood Bank",                  "location": "Vashi, Navi Mumbai",     "lat": 19.0771, "lng": 72.9988, "phone": "022-27650000"},
    {"id": "nhavi",      "name": "Apollo Hospitals Blood Bank",              "location": "CBD Belapur, Navi Mumbai","lat": 19.0215, "lng": 73.0489, "phone": "022-67786767"},
    {"id": "terna",      "name": "Terna Hospital Blood Bank",                "location": "Nerul, Navi Mumbai",     "lat": 19.0307, "lng": 73.0178, "phone": "022-27709000"},
    # Mira-Bhayandar / North
    {"id": "wockhardt",  "name": "Wockhardt Hospital Blood Bank",            "location": "Mira Road",              "lat": 19.2857, "lng": 72.8691, "phone": "022-28120022"},
    {"id": "bhairav",    "name": "Bhairav Hospital Blood Bank",              "location": "Bhayandar",              "lat": 19.3018, "lng": 72.8471, "phone": "022-28195252"},
    # Vasai-Virar
    {"id": "vasai_civil","name": "Civil Hospital Blood Bank Vasai",          "location": "Vasai",                  "lat": 19.3601, "lng": 72.8374, "phone": "0250-2340271"},
    # Kalyan-Dombivli
    {"id": "indira",     "name": "Indira Gandhi Memorial Hospital BB",       "location": "Kalyan",                 "lat": 19.2437, "lng": 73.1355, "phone": "0251-2311083"},
    {"id": "rukm",       "name": "Rukminibai Hospital Blood Bank",           "location": "Kalyan",                 "lat": 19.2452, "lng": 73.1347, "phone": "0251-2230550"},
    # Ulhasnagar / Ambernath
    {"id": "central_ulh","name": "Central Hospital Blood Bank Ulhasnagar",   "location": "Ulhasnagar",             "lat": 19.2215, "lng": 73.1535, "phone": "0251-2731295"},
    # Raigad / Panvel
    {"id": "panvel_civil","name": "Civil Hospital Blood Bank Panvel",        "location": "Panvel",                 "lat": 18.9894, "lng": 73.1175, "phone": "022-27452175"},
]

BLOOD_BANKS = [
    {**b, "distance_km": 0.0, "status": "OPEN", "available": _make_stock(b["id"])}
    for b in _RAW_BANKS
]


RADIUS_KM = 50  # search radius — include all banks within this distance


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in km between two lat/lng points."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(d_lng / 2) ** 2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def get_requirement(condition: str) -> dict:
    if condition == "CRITICAL":
        return {"urgency": "IMMEDIATE", "units": 2, "groups": ["O-", "O+"]}
    elif condition == "SERIOUS":
        return {"urgency": "URGENT", "units": 1, "groups": ["O+", "A+", "B+"]}
    else:
        return {"urgency": "STANDBY", "units": 0, "groups": []}


class CheckPayload(BaseModel):
    alertId: str
    condition: str
    bloodGroup: str = "Unknown"
    lat: Optional[float] = None
    lng: Optional[float] = None


class RequestPayload(BaseModel):
    alertId: str
    bankId: str


@router.post("/check")
async def check_blood_banks(payload: CheckPayload):
    requirement = get_requirement(payload.condition)

    # Compute real distance if caller sent location, otherwise keep static fallback
    banks_with_distance = []
    for b in BLOOD_BANKS:
        bank = dict(b)
        if payload.lat is not None and payload.lng is not None:
            bank["distance_km"] = haversine(payload.lat, payload.lng, b["lat"], b["lng"])
        banks_with_distance.append(bank)

    # Filter to radius when location is available, otherwise show all
    if payload.lat is not None:
        in_radius = [b for b in banks_with_distance if b["distance_km"] <= RADIUS_KM]
        # Always include at least the 2 closest even if outside radius (edge case)
        if len(in_radius) < 2:
            in_radius = sorted(banks_with_distance, key=lambda b: b["distance_km"])[:2]
    else:
        in_radius = banks_with_distance

    # Sort: blood group availability first, then distance
    def bank_sort_key(b):
        has_stock = 0 if b["available"].get(payload.bloodGroup, 0) > 0 else 1
        return (has_stock, b["distance_km"])

    sorted_banks = sorted(in_radius, key=bank_sort_key)

    try:
        get_ref(f"/hospitals/{HOSPITAL_ID}/bloodbank/{payload.alertId}").set({
            "status": "SEARCHING",
            "urgency": requirement["urgency"],
            "units": requirement["units"],
            "bloodGroup": payload.bloodGroup,
            "locationUsed": payload.lat is not None,
            "requestedAt": int(time.time() * 1000),
            "confirmedBank": None,
            "confirmedAt": None,
        })
    except Exception as e:
        print(f"[BLOODBANK] Firebase write error: {e}")

    return {
        "requirement": requirement,
        "banks": sorted_banks,
        "alertId": payload.alertId,
        "radius_km": RADIUS_KM if payload.lat is not None else None,
        "total_found": len(sorted_banks),
    }


async def _confirm_after_delay(alert_id: str, bank_id: str):
    await asyncio.sleep(20)
    try:
        get_ref(f"/hospitals/{HOSPITAL_ID}/bloodbank/{alert_id}").update({
            "status": "CONFIRMED",
            "confirmedBank": bank_id,
            "confirmedAt": int(time.time() * 1000),
            "eta_minutes": 12,
        })
    except Exception as e:
        print(f"[BLOODBANK] Confirm update error: {e}")


@router.post("/request")
async def request_blood(payload: RequestPayload, background_tasks: BackgroundTasks):
    try:
        get_ref(f"/hospitals/{HOSPITAL_ID}/bloodbank/{payload.alertId}").update({
            "status": "REQUESTED",
            "requestedBankId": payload.bankId,
            "requestedAt": int(time.time() * 1000),
        })
    except Exception as e:
        print(f"[BLOODBANK] Firebase write error: {e}")

    background_tasks.add_task(_confirm_after_delay, payload.alertId, payload.bankId)
    return {"status": "requested", "eta_minutes": 12}


@router.get("/status/{alert_id}")
async def get_status(alert_id: str):
    try:
        data = get_ref(f"/hospitals/{HOSPITAL_ID}/bloodbank/{alert_id}").get()
        return data or {}
    except Exception as e:
        print(f"[BLOODBANK] Status fetch error: {e}")
        return {}
