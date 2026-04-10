from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import alert, patient, beds

app = FastAPI(title="Aarogya Sanchalak API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alert.router, prefix="/api/alert")
app.include_router(patient.router, prefix="/api/patient")
app.include_router(beds.router, prefix="/api/beds")

@app.get("/")
def root():
    return {"status": "Aarogya Sanchalak backend running"}
