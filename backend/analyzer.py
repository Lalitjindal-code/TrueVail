import os
import json
import base64
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from google import genai

# ==============================================================================
# GLOBAL CONFIGURATION & CACHING
# ==============================================================================

_GEMINI_CLIENT = None

def get_gemini_client():
    """
    Returns cached Gemini client instance.
    Configures SDK only once. Handles missing API key gracefully.
    """
    global _GEMINI_CLIENT
    
    if _GEMINI_CLIENT:
        return _GEMINI_CLIENT

    api_key = os.environ.get("GEMINI_API_KEY")
    print("GEMINI_API_KEY exists:", bool(api_key))
    
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment.")
        return None

    try:
        _GEMINI_CLIENT = genai.Client(api_key=api_key)
        print("Gemini client initialized successfully.")
        return _GEMINI_CLIENT
    except Exception as e:
        print(f"Error initializing Gemini client: {str(e)}")
        return None

def safe_json_parse(text):
    """
    Safely parses JSON string by extracting the JSON object.
    Returns None on failure. Never throws exceptions.
    """
    if not text:
        return None
    try:
        # Robustly extract JSON object from potentially noisy output
        start = text.find('{')
        end = text.rfind('}')
        
        if start != -1 and end != -1:
            cleaned = text[start:end+1]
            return json.loads(cleaned)
            
        # Fallback to direct parse if no brackets found (unlikely for object)
        return json.loads(text.strip())
    except Exception:
        return None

# ==============================================================================
# CORE ANALYSIS ENTRY POINTS
# ==============================================================================

def analyze_news(text, analysis_type="news", image_data=None, mime_type=None):
    """
    Main entry point. Routes to specific analysis functions.
    """
    try:
        if analysis_type == "deepfake":
            return analyze_deepfake(image_data, mime_type)
        
        # URL detection and content fetching
        parsed = urlparse(text.strip())
        if parsed.scheme and parsed.netloc:
            content = fetch_url_content(text) or text
            return perform_ai_analysis(content, analysis_type)
        
        return perform_ai_analysis(text, analysis_type)

    except Exception:
        return heuristic_fallback(text, False, None, "Runtime Error", analysis_type)

def analyze_content(text, analysis_type="news"):
    """
    Legacy wrapper for analyze_news.
    """
    return analyze_news(text, analysis_type)

# ==============================================================================
# AI ANALYSIS IMPLEMENTATIONS
# ==============================================================================

def perform_ai_analysis(content, analysis_type="news"):
    """
    Analyzes text content using Gemini with strict JSON enforcement.
    """
    client = get_gemini_client()
    if not client:
        print("AI Analysis skipped: Client not initialized.")
        return heuristic_fallback(content, False, None, "No API Key or Init Failed", analysis_type)

    try:
        # Context block based on analysis type
        context_block = ""
        if analysis_type == "news":
            context_block = "Evaluate journalistic credibility, factual consistency, and verify key claims."
        elif analysis_type == "link":
            context_block = "Prioritize source reputation, domain trustworthiness, and cross-reference checks."
        elif analysis_type == "advanced":
            context_block = "Analyze manipulation patterns, narrative framing, and emotional targeting."

        prompt = f"""You are a professional misinformation analyst assisting a fact-checking platform.
Analyze the following text.
Context: {context_block}

RULES:
- You MUST list concrete, verifiable evidence in "evidence_used".
- Evidence MUST be factual (timeline mismatch, source contradiction, unsupported claim).
- If evidence_used is empty OR missing:
  - status MUST be "Unverified"
  - confidence MUST be <= 0.4
- NO speculative language ("may", "might", "could").
- NO generic phrasing.
- NO safety disclaimers.
- Respond ONLY with valid JSON. No markdown. No commentary.

JSON Schema:
{{
  "status": "Real | Fake | Misleading | Unverified",
  "confidence": 0.0-1.0,
  "evidence_used": [
    "specific factual inconsistency",
    "verifiable source mismatch"
  ],
  "reason": "2–3 sentences explicitly referencing the evidence above",
  "correction": "corrected information if false, otherwise null",
  "privacy_risk": "Low | Medium | High",
  "privacy_explanation": "why"
}}

CONTENT:
{str(content)[:8000]}"""

        # Structured content payload
        contents = [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
        
        # Explicit generation config
        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "max_output_tokens": 512
        }

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
            generation_config=generation_config
        )

        if response and response.text:
            print("RAW GEMINI RESPONSE (Text):", response.text)
            data = safe_json_parse(response.text)
            if data:
                # Enforce evidence check with strict validation
                evidence = data.get("evidence_used")
                if not isinstance(evidence, list) or not any(
                    isinstance(e, str) and e.strip() for e in evidence
                ):
                    return heuristic_fallback(
                        content,
                        False,
                        None,
                        "AI returned empty or invalid evidence",
                        analysis_type
                    )
                return data
        
        return heuristic_fallback(content, False, None, "Invalid AI JSON", analysis_type)

    except Exception as e:
        print(f"AI Analysis Exception: {str(e)}")
        return heuristic_fallback(content, False, None, f"AI Request Failed: {str(e)}", analysis_type)

def analyze_deepfake(image_data, mime_type):
    """
    Analyzes images for deepfake indicators using Gemini Vision.
    """
    client = get_gemini_client()
    if not client:
        print("Deepfake Analysis skipped: Client not initialized.")
        return heuristic_fallback("image", False, None, "No API Key or Init Failed", "deepfake")

    try:
        # Decode base64 to ensure it IS base64, then re-encode to string for payload
        # This part handles both raw bytes and existing base64 strings
        target_b64_str = ""
        
        if isinstance(image_data, bytes):
            target_b64_str = base64.b64encode(image_data).decode('utf-8')
        elif isinstance(image_data, str):
            # Verify it's valid base64 by decoding then re-encoding
            try:
                # remove header if present for validation
                clean_data = image_data
                if "base64," in clean_data:
                    clean_data = clean_data.split("base64,")[1]
                
                # Check validity
                decoded = base64.b64decode(clean_data)
                target_b64_str = base64.b64encode(decoded).decode('utf-8')
            except Exception:
                return heuristic_fallback("image", False, None, "Invalid Image Data", "deepfake")
        else:
             return heuristic_fallback("image", False, None, "Unknown Image Data Format", "deepfake")

        if not mime_type:
            mime_type = "image/jpeg"

        prompt = """You are an AI image forensic assistant performing visual authenticity analysis.
Analyze the image for visual inconsistencies.
- Never claim certainty.
- Never say definitively real or fake.
- Base conclusions ONLY on visible forensic indicators.
- Explicitly reference indicators such as: lighting, shadows, anatomy, texture, blending, reflections, edges.
- Respond ONLY in strict JSON.

JSON Schema:
{
  "status": "Authentic | Manipulated | Suspicious",
  "confidence": "LOW | MEDIUM | HIGH",
  "reason": "specific forensic observations",
  "analysis_details": {
    "technical_assessment": "forensic explanation",
    "indicators_found": 0,
    "fake_probability": 0.0-1.0
  },
  "privacy_risk": "Low | Medium | High",
  "privacy_explanation": "..."
}"""

        # Structured content payload for Vision
        contents = [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime_type, "data": target_b64_str}}
                ]
            }
        ]

        # Explicit generation config
        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "max_output_tokens": 512
        }

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
            generation_config=generation_config
        )

        if response and response.text:
            print("RAW GEMINI RESPONSE (Vision):", response.text)
            data = safe_json_parse(response.text)
            if data:
                # Normalization
                if "analysis_details" not in data:
                    data["analysis_details"] = {
                         "technical_assessment": data.get("reason", "Analysis done"),
                         "indicators_found": 0,
                         "fake_probability": 0.5
                    }
                
                # Confidence Normalization
                valid_conf = {"LOW", "MEDIUM", "HIGH"}
                conf = str(data.get("confidence", "LOW")).upper()
                if conf not in valid_conf:
                    conf = "LOW"
                data["confidence"] = conf
                
                return data

        return heuristic_fallback("image", False, None, "Invalid AI Vision JSON", "deepfake")

    except Exception as e:
        print(f"Deepfake Analysis Exception: {str(e)}")
        return heuristic_fallback("image", False, None, f"Vision Analysis Failed: {str(e)}", "deepfake")

# ==============================================================================
# HELPERS & FALLBACKS
# ==============================================================================

def fetch_url_content(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        # Shorter timeout to prevent hanging
        resp = requests.get(url, headers=headers, timeout=4)
        if resp.status_code != 200: 
            return None
        soup = BeautifulSoup(resp.text, 'html.parser')
        paragraphs = soup.find_all('p')
        text = " ".join([p.get_text() for p in paragraphs])
        return text[:5000] if text else None
    except Exception:
        return None

def heuristic_fallback(text, is_url=False, url=None, error_msg="", analysis_type="news"):
    """
    Deterministic fallback. NEVER CRASHES.
    """
    safe_text = str(text).lower()

    if analysis_type == "deepfake":
        return {
            "status": "Suspicious",
            "confidence": "LOW",
            "reason": f"AI analysis unavailable. File metadata check only. ({error_msg})",
            "analysis_details": {
                "technical_assessment": "Automatic analysis failed, manual review recommended.",
                "indicators_found": 0,
                "fake_probability": 0.0
            },
            "privacy_risk": "Low",
            "privacy_explanation": "Could not scan image."
        }

    # Text Analysis Fallback
    bad_keywords = ["fake", "scam", "clickbait", "rumor", "conspiracy", "won't believe", "shocking"]
    score = sum(1 for w in bad_keywords if w in safe_text)
    
    status = "Unverified"
    risk_level = "Low"
    evidence = []
    
    if score >= 2: 
        status = "Misleading"
        risk_level = "Medium"
        evidence = ["High density of sensationalist keywords detected"]

    return {
        "status": status,
        "confidence": 0.0,
        "evidence_used": evidence,
        "reason": f"AI service unavailable. Basic keyword scan performed. ({error_msg})",
        "correction": None,
        "privacy_risk": risk_level,
        "privacy_explanation": "Heuristic scan only."
    }

def get_trending_news():
    """
    Safe Mock Data for Trending News.
    """
    return {
        "status": "success",
        "trending_news": [
            {
                "title": "AI Technology Advances in 2026",
                "description": "New benchmarks in generative models.",
                "source": "TechDaily",
                "published_at": "2026-01-11T10:00:00Z"
            },
            {
                "title": "Global Cyber Security Summit",
                "description": "Leaders discuss deepfake prevention.",
                "source": "SecurityWeekly",
                "published_at": "2026-01-11T09:30:00Z"
            }
        ],
        "trends": {
            "categories": ["Tech", "Security", "AI", "Policy"],
            "popularity": [90, 85, 95, 60]
        },
        "preferences": {
            "most_read_categories": ["AI", "Tech"],
            "reading_time_distribution": [10, 30, 40, 20, 0]
        }
    } 
    
