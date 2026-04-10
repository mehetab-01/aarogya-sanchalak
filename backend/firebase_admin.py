import firebase_admin
from firebase_admin import credentials, db

# TODO: add your serviceAccountKey.json path
def init_firebase():
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://YOUR_PROJECT.firebaseio.com"
    })
