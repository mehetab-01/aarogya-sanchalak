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
    "Extract patient info from Indian ambulance driver speech. Input may be Hindi (Devanagari script), "
    "Hinglish, Maringlish, Marathi, English, or any mix. Reply ONLY valid JSON, no markdown:\n"
    '{"name":str|null,"age":int|null,"condition":"CRITICAL"|"SERIOUS"|"STABLE",'
    '"bp":"X/Y"|null,"pulse":int|null,"eta":int|null,"notes":str|null}\n'
    "CRITICAL=unconscious/khatra/hosh nahi/severe/bahut serious/critical/किटिक्स/क्रिटिकल/बेहोश/हेल्थ क्रिटिकल. "
    "SERIOUS=injured/chot/dard/hurt/serious/गंभीर/चोट. "
    "STABLE=conscious/theek/stable/hosh mein/okay/ठीक/होश में. "
    "Age: extract number from '25 saal'/'25 साल'/'25 वर्ष'. "
    "ETA: extract minutes from '8 minute'/'8 मिनट'/'8 मिनट में'. "
    "condition is ALWAYS set — default SERIOUS if unclear. Never null for condition. "
    "IMPORTANT: All text fields (name, notes) must be in English. "
    "If the original was in Hindi/Marathi/Hinglish, translate to English and append the original in brackets. "
    "Example: name='Suresh (सुरेश)', notes='Critical health condition, going to City Hospital in 8 minutes (किटिक्स हेल्थ है, सिटी हॉस्पिटल जा रहे हैं 8 मिनट में)'. "
    "Romanize names if needed: 'सुरेश'→'Suresh', 'राहुल'→'Rahul'."
)

_EMPTY = {"name": None, "age": None, "condition": None,
          "bp": None, "pulse": None, "eta": None, "notes": None}


@router.post("/parse")
async def parse_voice(payload: VoicePayload):
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,         # Hindi/Devanagari input uses more tokens
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
