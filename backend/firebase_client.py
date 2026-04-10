import os
import firebase_admin
from firebase_admin import credentials, db, auth
from dotenv import load_dotenv

load_dotenv()

_SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")

try:
    cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred, {
        "databaseURL": _DATABASE_URL
    })
    print(f"[FIREBASE] Connected to: {_DATABASE_URL}")
except ValueError:
    # App already initialized (e.g. during hot-reload)
    pass


def get_ref(path: str) -> db.Reference:
    """Return a Firebase Realtime DB reference for the given path."""
    return db.reference(path)


def set_custom_claim(uid: str, role: str) -> None:
    """Set a custom role claim on a Firebase Auth user."""
    auth.set_custom_user_claims(uid, {"role": role})
