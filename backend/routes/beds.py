import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_client import get_ref

load_dotenv()

HOSPITAL_ID = os.getenv("HOSPITAL_ID", "hospital1")
BED_TYPES = ["icu", "general", "emergency"]

router = APIRouter(tags=["beds"])


@router.get("/status")
def get_bed_status():
    try:
        data = get_ref(f"/hospitals/{HOSPITAL_ID}/beds").get()
        result = {}
        for bed_type in BED_TYPES:
            total    = data[bed_type]["total"]
            occupied = data[bed_type]["occupied"]
            available = total - occupied
            occupancy_pct = round((occupied / total) * 100) if total > 0 else 0
            result[bed_type] = {
                "total":         total,
                "occupied":      occupied,
                "available":     available,
                "occupancy_pct": occupancy_pct,
            }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firebase error: {str(e)}")


class BedUpdatePayload(BaseModel):
    bedType: str  # icu | general | emergency
    action: str   # increment | decrement


@router.post("/update")
def update_bed(payload: BedUpdatePayload):
    if payload.bedType not in BED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid bedType '{payload.bedType}'. Must be one of: {BED_TYPES}"
        )
    if payload.action not in ["increment", "decrement"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{payload.action}'. Must be 'increment' or 'decrement'."
        )

    bed_ref  = get_ref(f"/hospitals/{HOSPITAL_ID}/beds/{payload.bedType}")
    bed_data = bed_ref.get()
    total    = bed_data["total"]
    occupied = bed_data["occupied"]

    if payload.action == "increment":
        new_val = min(occupied + 1, total)
    else:
        new_val = max(occupied - 1, 0)

    get_ref(f"/hospitals/{HOSPITAL_ID}/beds/{payload.bedType}/occupied").set(new_val)
    print(f"[BEDS] {payload.bedType} {payload.action}d → occupied: {new_val}")

    return {
        "bedType":   payload.bedType,
        "total":     total,
        "occupied":  new_val,
        "available": total - new_val,
    }
