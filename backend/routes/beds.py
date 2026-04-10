from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def get_bed_status():
    # TODO: pull live from Firebase /hospitals/hospital1/beds
    return {
        "icu":       {"total": 20, "occupied": 14},
        "general":   {"total": 80, "occupied": 61},
        "emergency": {"total": 10, "occupied": 7},
    }
