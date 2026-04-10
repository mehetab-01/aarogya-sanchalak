import firebase_admin
from firebase_admin import credentials, db
import os
from dotenv import load_dotenv

load_dotenv()

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": os.getenv("FIREBASE_DATABASE_URL")
})

print("Resetting alerts...")
db.reference("/hospitals/hospital1/alerts").delete()

print("Resetting patients...")
db.reference("/hospitals/hospital1/patients").delete()

print("Resetting beds...")
db.reference("/hospitals/hospital1/beds").set({
    "icu":       {"total": 20, "occupied": 14},
    "general":   {"total": 80, "occupied": 61},
    "emergency": {"total": 10, "occupied": 7}
})

print("Demo reset complete. Ready for pitch.")
