import os
import json
import base64
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from google import genai

# ==============================================================================
# GEMINI CLIENT (NEW SDK – OFFICIAL)
# ==============================================================================

_GEMINI_CLIENT = None
MODEL_NAME = "gemini-3-flash-preview"


def get_gemini_client():
    global _GEMINI_CLIENT

    if _GEMINI_CLIENT:
        return _GEMINI_CLIENT

    api_key = os.environ.get("GEMINI_API_KEY")
    print("GEMINI_API_KEY exists:", bool(api_key))

    if not api_key:
        print("❌ GEMINI_API_KEY missing")
        return None

    try:
        _GEMINI_CLIENT = genai.Client(api_key=api_key)
        print("✅ Gemini client initialized")
        return _GEMINI_CLIENT
    except Exception as e:
        print("❌ Gemini init failed:", e)
        return None


# ==============================================================================
# SAFE JSON PARSER
# ==============================================================================

def safe_json_parse(text: str):
    if not text:
        return None
    try:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end + 1])
        return json.loads(text)
    except Exception:
        return None


# ==============================================================================
# ENTRY POINT
# ==============================================================================

def analyze_news(text, analysis_type="news", image_data=None, mime_type=None):
    try:
        if analysis_type == "deepfake":
            return analyze_deepfake(image_data, mime_type)

        parsed = urlparse(text.strip())
        if parsed.scheme and parsed.netloc:
            content = fetch_url_content(text) or text
        else:
            content = text

        return perform_ai_analysis(content, analysis_type)

    except Exception as e:
        return heuristic_fallback(text, f"Runtime error: {e}", analysis_type)


# ==============================================================================
# TEXT ANALYSIS
# ==============================================================================

def perform_ai_analysis(content, analysis_type="news"):
    client = get_gemini_client()
    if not client:
        return heuristic_fallback(content, "Gemini client not initialized", analysis_type)

    context_map = {
        "news": "Evaluate journalistic credibility and factual consistency.",
        "link": "Analyze source reputation and domain trustworthiness.",
        "advanced": "Analyze manipulation, framing, and emotional bias."
    }

    # Define allowed statuses based on analysis type
    if analysis_type == "link":
        status_options = "Safe | Suspicious | Phishing | Malicious | Unverified"
    else:
        status_options = "Real | Fake | Misleading | Unverified"

    prompt = f"""
You are a misinformation discovery engine. Analyze the content below.
CONTEXT: {context_map.get(analysis_type, "General analysis")}

STRICT INSTRUCTIONS:
1. Output MUST be valid JSON. No markdown formatting.
2. Use verifiable evidence only. Status defaults to "Unverified".
3. Confidence: 0.0 to 1.0.

JSON STRUCTURE:
{{
  "status": "{status_options}",
  "confidence": <float>,
  "evidence_used": ["<string>", ...],
  "reason": "<short_explanation>",
  "correction": <string_or_null>,
  "privacy_risk": "Low" | "Medium" | "High",
  "privacy_explanation": "<short_string>"
}}

CONTENT:
{str(content)[:8000]}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        if response and response.text:
            data = safe_json_parse(response.text)
            if data and isinstance(data.get("evidence_used"), list):
                return data

        return heuristic_fallback(content, "Invalid Gemini JSON", analysis_type)

    except Exception as e:
        return heuristic_fallback(content, f"Gemini error: {e}", analysis_type)


# ==============================================================================
# DEEPFAKE / VISION ANALYSIS
# ==============================================================================

def analyze_deepfake(image_data, mime_type):
    client = get_gemini_client()
    if not client:
        return heuristic_fallback("image", "Gemini client not initialized", "deepfake")

    try:
        # Normalize base64
        if isinstance(image_data, str):
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            image_bytes = base64.b64decode(image_data)
        elif isinstance(image_data, bytes):
            image_bytes = image_data
        else:
            return heuristic_fallback("image", "Invalid image format", "deepfake")

        image_b64 = base64.b64encode(image_bytes).decode()
        mime_type = mime_type or "image/jpeg"

        prompt = """
You are an AI image forensic assistant.

RULES:
- Analyze ONLY visible forensic indicators.
- No certainty claims.
- Respond ONLY in JSON.

JSON SCHEMA:
{
  "status": "Authentic | Manipulated | Suspicious",
  "confidence": "LOW | MEDIUM | HIGH",
  "reason": "...",
  "analysis_details": {
    "technical_assessment": "...",
    "indicators_found": 0,
    "fake_probability": 0.0
  },
  "privacy_risk": "Low | Medium | High",
  "privacy_explanation": "..."
}
"""

        contents = [{
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": mime_type, "data": image_b64}},
                {"text": prompt}
            ]
        }]

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents
        )

        if response and response.text:
            data = safe_json_parse(response.text)
            if data:
                data["confidence"] = str(data.get("confidence", "LOW")).upper()
                return data

        return heuristic_fallback("image", "Invalid Gemini vision JSON", "deepfake")

    except Exception as e:
        return heuristic_fallback("image", f"Vision error: {e}", "deepfake")


# ==============================================================================
# FALLBACK (NEVER FAILS)
# ==============================================================================

def heuristic_fallback(text, error_msg, analysis_type):
    if analysis_type == "deepfake":
        return {
            "status": "Suspicious",
            "confidence": "LOW",
            "reason": error_msg,
            "analysis_details": {
                "technical_assessment": "AI unavailable",
                "indicators_found": 0,
                "fake_probability": 0.0
            },
            "privacy_risk": "Low",
            "privacy_explanation": "No image processed"
        }

    return {
        "status": "Unverified",
        "confidence": 0.0,
        "evidence_used": [],
        "reason": error_msg,
        "correction": None,
        "privacy_risk": "Low",
        "privacy_explanation": "Fallback response"
    }


# ==============================================================================
# UTIL
# ==============================================================================

def fetch_url_content(url):
    try:
        r = requests.get(url, timeout=4, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        return " ".join(p.get_text() for p in soup.find_all("p"))[:5000]
    except Exception:
        return None
