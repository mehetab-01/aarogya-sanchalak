import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
import anthropic
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class VoicePayload(BaseModel):
    transcript: str

# Handles Hinglish, Maringlish, pure Hindi, pure English, or any mix.
SYSTEM_PROMPT = (
    "Extract patient info from Indian ambulance driver speech. Input may be Hindi (Devanagari), "
    "Hinglish, Marathi, English, or any mix. Reply ONLY valid JSON, no markdown:\n"
    '{"name":str|null,"age":int|null,"condition":"CRITICAL"|"SERIOUS"|"STABLE",'
    '"bp":"X/Y"|null,"pulse":int|null,"eta":int|null,'
    '"bloodLoss":"None"|"Minor"|"Moderate"|"Severe"|null,'
    '"bloodGroup":"A+"|"A-"|"B+"|"B-"|"AB+"|"AB-"|"O+"|"O-"|"Unknown"|null,'
    '"hospitalName":str|null,"notes":str|null}\n'
    "CONDITION rules — always set, never null, default SERIOUS if unclear:\n"
    "  CRITICAL=unconscious/khatra/hosh nahi/severe/cardiac/critical/क्रिटिकल/बेहोश/खतरनाक\n"
    "  SERIOUS=injured/chot/dard/hurt/serious/accident/गंभीर/चोट/दुर्घटना\n"
    "  STABLE=conscious/theek/stable/hosh mein/okay/ठीक/होश में\n"
    "BLOOD LOSS rules — set if mentioned, else null:\n"
    "  Severe=bahut khoon/zyada bleeding/severe blood loss/khoon bahut zyada/बहुत खून\n"
    "  Moderate=kuch khoon/moderate bleeding/thoda bahut khoon/कुछ खून\n"
    "  Minor=thoda khoon/minor bleeding/थोड़ा खून\n"
    "  None=no blood/khoon nahi/खून नहीं\n"
    "BLOOD GROUP: extract A+/A-/B+/B-/AB+/AB-/O+/O- if mentioned. "
    "Common speech: 'O positive'→'O+', 'B negative'→'B-', 'AB positive'→'AB+'. "
    "If speaker says 'unknown'/'pata nahi'/'nahi pata'/'don't know' for blood group → use 'Unknown'. "
    "Only leave bloodGroup null if blood group is not mentioned at all.\n"
    "HOSPITAL NAME: extract hospital/aspatal/रुग्णालय/अस्पताल name if mentioned. "
    "Examples: 'City Hospital'→'City Hospital', 'KEM hospital'→'KEM Hospital'.\n"
    "AGE: extract number from '25 saal'/'25 साल'/'25 वर्ष'.\n"
    "ETA: extract minutes from '8 minute'/'8 मिनट में'.\n"
    "TEXT FIELDS (name, hospitalName, notes): translate to English, append original in brackets if non-English. "
    "Example: name='Suresh (सुरेश)', hospitalName='City Hospital'. "
    "Romanize names: 'सुरेश'→'Suresh', 'राहुल'→'Rahul'."
)

_EMPTY = {"name": None, "age": None, "condition": None,
          "bp": None, "pulse": None, "eta": None,
          "bloodLoss": None, "bloodGroup": None,
          "hospitalName": None, "notes": None}


@router.post("/parse")
async def parse_voice(payload: VoicePayload):
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,         # expanded schema — more fields, Devanagari uses more tokens
            system=[{
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # prompt cache — reused across calls
            }],
            messages=[{
                "role": "user",
                "content": payload.transcript,
            }],
        )
        raw = message.content[0].text.strip()
        print(f"[VOICE] Claude raw: {repr(raw)}")
        # Strip markdown code fences if Claude added them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        return json.loads(raw)

    except json.JSONDecodeError as e:
        print(f"[VOICE] JSON parse failed: {e} | raw: {repr(raw) if 'raw' in dir() else 'no raw'}")
        return _EMPTY
    except Exception as e:
        print(f"[VOICE] Parse error: {e}")
        return _EMPTY
