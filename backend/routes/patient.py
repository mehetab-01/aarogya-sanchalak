from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class PatientUpdate(BaseModel):
    patientId: str
    condition: str
    eta: int
    notes: str = ""

@router.post("/update")
async def update_patient(payload: PatientUpdate):
    # TODO: update Firebase /hospitals/hospital1/patients/{patientId}
    return {"status": "updated"}
