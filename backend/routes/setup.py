import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_client import set_custom_claim, get_ref

load_dotenv()

HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital1")

VALID_ROLES = ["admin", "ambulance_driver", "doctor", "nurse", "wardboy"]

TEST_USERS = {
    "admin":    "5JLOqRGezuWLjtmfVI8C1GzOFS12",
    "driver":   "X16L8MynXlZN3a8K6Vvc5TR7C0a2",
    "doctor":   "0G6v3rr2dOfw7yEjnQdzejP41iH3",
    "nurse":    "2aDPWMRSXrMxvMC7EYWA8yK24UU2",
    "wardboy":  "ibKmTh1GaPbryEBPLEUME6LDACB2",
}

router = APIRouter(tags=["setup"])


class RolePayload(BaseModel):
    uid: str
    role: str


@router.post("/set-role")
def set_role(payload: RolePayload):
    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{payload.role}'. Must be one of: {VALID_ROLES}"
        )
    set_custom_claim(payload.uid, payload.role)
    print(f"[SETUP] Role '{payload.role}' assigned to uid: {payload.uid}")
    return {"status": "role_set", "uid": payload.uid, "role": payload.role}


@router.get("/ping-firebase")
def ping_firebase():
    try:
        result = get_ref(f"/hospitals/{HOSPITAL_ID}/beds").get()
        return {"status": "firebase_connected", "beds": result}
    except Exception as e:
        return {"status": "firebase_error", "error": str(e)}


@router.get("/users")
def get_test_users():
    return TEST_USERS
