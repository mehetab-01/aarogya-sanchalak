# Twilio AI voice call — escalation chain
# TODO: fill TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM in .env

def generate_doctor_twiml(patient: dict) -> str:
    """Returns TwiML XML string for doctor call."""
    # TODO: implement with twilio.twiml.voice_response
    return ""

def call_doctor(patient: dict, doctor_phone: str):
    """Fire Twilio voice call to doctor."""
    # TODO: implement
    pass

def call_nurse(patient: dict, nurse_phone: str):
    """Escalation — called if doctorAck false after 60s."""
    # TODO: implement
    pass
