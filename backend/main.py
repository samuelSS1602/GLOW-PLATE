"""
GlowPlate API — estimates calories, protein, carbs and fat from a meal photo or description.
Developed by Code Crafters.

Run:  uvicorn main:app --reload --port 8000
"""
import base64
import os

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()

ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
SKIP_AUTH = os.getenv("SKIP_AUTH", "false").lower() == "true"  # only for local testing
MAX_IMAGE_BYTES = 6 * 1024 * 1024

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY

# Firebase login tokens are checked against Google's public keys, which needs only the
# project ID: no service account key, locally or on Vercel.
google_request = google_requests.Request()

app = FastAPI(title="GlowPlate API", description="Developed by Code Crafters")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


def verify_user(authorization: str | None) -> str:
    """Returns the Firebase user ID if the request carries a valid login token for this project."""
    if SKIP_AUTH:
        return "local-dev"
    if not FIREBASE_PROJECT_ID:
        raise HTTPException(500, "The server is missing FIREBASE_PROJECT_ID.")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to analyse meals.")
    try:
        # Checks Google's signature, expiry and that the token was issued for this project
        claims = id_token.verify_firebase_token(
            authorization.split(" ", 1)[1], google_request, audience=FIREBASE_PROJECT_ID, clock_skew_in_seconds=10
        )
    except Exception:
        raise HTTPException(401, "Your session has expired. Sign in again.")
    if claims.get("iss") != f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}" or not claims.get("sub"):
        raise HTTPException(401, "Your session has expired. Sign in again.")
    return claims["sub"]


NUTRITION_TOOL = {
    "name": "record_meal_nutrition",
    "description": "Record the foods in the meal (seen in the photo or described by the user) with estimated portions and nutrition.",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_food": {"type": "boolean", "description": "False if the photo or description is not food or drink."},
            "summary": {"type": "string", "description": "Short meal name, e.g. 'Idli, sambar and boiled eggs'."},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "portion": {"type": "string", "description": "e.g. '3 pieces', '1 cup (200 g)', '150 g'"},
                        "calories": {"type": "number"},
                        "protein": {"type": "number", "description": "grams"},
                        "carbs": {"type": "number", "description": "grams"},
                        "fat": {"type": "number", "description": "grams"},
                    },
                    "required": ["name", "portion", "calories", "protein", "carbs", "fat"],
                },
            },
            "tips": {
                "type": "array",
                "items": {"type": "string"},
                "description": "1-2 short, specific tips on how this meal helps or could better support skin glow and hair growth, or protein intake.",
            },
        },
        "required": ["is_food", "summary", "items", "tips"],
    },
}

SYSTEM = (
    "You are a nutritionist who estimates nutrition from meal photos or short descriptions. The user is "
    "a 22-year-old man in Coimbatore, Tamil Nadu, eating mostly South Indian home food and on a fat-loss "
    "plan with a high protein target. Identify each separate food (idli, dosa, sambar, chutney, rice, "
    "chapati, poriyal, kootu, curd, chicken curry, fish fry, eggs, etc.). Estimate portion sizes from plate "
    "and utensil size, or assume a typical home portion when only a description is given, and include the "
    "cooking oil or ghee you can see or that the dish usually has. Use standard Indian food composition "
    "values (IFCT/NIN). Be realistic, not optimistic. If the user adds a note, trust it over the photo."
)


@app.get("/api/health")
def health():
    return {"ok": True, "model": ANTHROPIC_MODEL, "by": "Code Crafters"}


@app.post("/api/analyze")
async def analyze(
    image: UploadFile | None = File(None),
    note: str = Form(""),
    authorization: str | None = Header(None),
):
    """Takes a meal photo (with an optional note), or just a description of the meal."""
    verify_user(authorization)
    note = note.strip()[:300]

    content = []
    if image is not None:
        data = await image.read()
        if not data:
            raise HTTPException(400, "The image is empty.")
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(413, "The image is larger than 6 MB.")
        media_type = image.content_type if image.content_type in ("image/jpeg", "image/png", "image/webp") else "image/jpeg"
        content.append({"type": "image", "source": {"type": "base64", "media_type": media_type,
                                                    "data": base64.b64encode(data).decode()}})
        prompt = "Estimate the nutrition of this meal."
        if note:
            prompt += f"\nUser's note about the meal: {note}"
    elif note:
        prompt = f"Estimate the nutrition of this meal from the user's description: {note}"
    else:
        raise HTTPException(400, "Add a photo or describe what you ate.")
    content.append({"type": "text", "text": prompt})

    try:
        msg = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1500,
            system=SYSTEM,
            tools=[NUTRITION_TOOL],
            tool_choice={"type": "tool", "name": "record_meal_nutrition"},
            messages=[{"role": "user", "content": content}],
        )
    except anthropic.APIError as e:
        raise HTTPException(502, f"The AI service returned an error: {getattr(e, 'message', str(e))}")

    result = next((b.input for b in msg.content if b.type == "tool_use"), None)
    if not result:
        raise HTTPException(502, "The AI did not return a result. Try again.")
    if not result.get("is_food"):
        raise HTTPException(422, "This doesn't look like food. Try a clearer photo of your plate, or describe the meal.")

    items = []
    for it in result.get("items", []):
        items.append({
            "name": str(it.get("name", "")).strip(),
            "portion": str(it.get("portion", "")).strip(),
            **{k: round(max(0.0, float(it.get(k, 0) or 0)), 1) for k in ("calories", "protein", "carbs", "fat")},
        })
    totals = {k: round(sum(i[k] for i in items), 1) for k in ("calories", "protein", "carbs", "fat")}
    return {"summary": result.get("summary", ""), "items": items, "totals": totals, "tips": result.get("tips", [])[:2]}
