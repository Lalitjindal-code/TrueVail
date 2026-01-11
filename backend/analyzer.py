import os
import requests
import json
import time
import datetime
from bs4 import BeautifulSoup
from urllib.parse import urlparse, quote_plus

# ==============================================================================
# CLOUD-NATIVE GEMINI CONFIGURATION
# ==============================================================================

def get_gemini_model():
    """
    Lazily initialize and return Gemini model.
    Must be safe for cloud cold starts.
    """
    try:
        import google.generativeai as genai
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        # Use flash model for speed and cost efficiency
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        return None

# ==============================================================================
# CORE ANALYSIS FUNCTIONS
# ==============================================================================

def analyze_news(text, analysis_type="news", image_data=None, mime_type=None):
    """
    Analyzes news content, a URL, or media for authenticity and risks.
    Main entry point for analysis.
    """
    # Check if input is a URL
    parsed_url = urlparse(text.strip()) if text else None
    is_url = bool(parsed_url and parsed_url.scheme and parsed_url.netloc)
    
    try:
        if analysis_type == "deepfake":
            return analyze_deepfake(text, image_data=image_data, mime_type=mime_type)
        elif analysis_type == "privacy":
            return analyze_privacy(text)
        elif is_url:
            url = text.strip()
            content = fetch_url_content(url)
            if not content:
                content = f"News URL: {url}"
            return perform_ai_analysis(content, is_url=is_url, url=url, analysis_type=analysis_type)
        else:
            return perform_ai_analysis(text, analysis_type=analysis_type)
    except Exception:
        return heuristic_fallback(text, is_url, str(text), "Unexpected runtime error", analysis_type)

def fetch_url_content(url):
    """
    Fetches the main text content from a given URL using requests.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    for attempt in range(2):
        try:
            response = requests.get(url, headers=headers, timeout=7)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            article = soup.find('article')
            if article:
                text = article.get_text(separator='\n')
            else:
                p_texts = [p.get_text(separator=' ') for p in soup.find_all('p') if p.get_text(strip=True)]
                p_texts_sorted = sorted(p_texts, key=lambda s: len(s), reverse=True)
                text = '\n\n'.join(p_texts_sorted[:8]) if p_texts_sorted else soup.get_text()

            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split('  '))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            return text[:6000]
        except Exception:
            time.sleep(1)
    return None

def analyze_privacy(text):
    """
    Privacy analysis using Heuristics and AI.
    """
    # 1. Heuristic Scan
    text_lower = text.lower()
    privacy_indicators = ['@', '.com', 'phone', 'address', 'location', 'email', 'name', 'street', 'city', 'zip', 'ssn', 'credit card']
    privacy_risks = [indicator for indicator in privacy_indicators if indicator in text_lower]
    
    heuristic_risk = "Low"
    heuristic_expl = "No significant PII detected."
    
    if len(privacy_risks) >= 3:
        heuristic_risk = "High"
        heuristic_expl = f"Multiple PII markers detected: {', '.join(privacy_risks[:3])}."
    elif len(privacy_risks) >= 1:
        heuristic_risk = "Medium"
        
    model = get_gemini_model()
    if model:
        try:
            prompt = f"""Identify privacy risks/PII. Respond ONLY in strict JSON: {{ "risk_level": "Low|Medium|High", "explanation": "..." }}. Text: {text[:2000]}"""
            response = model.generate_content(
                prompt,
                generation_config={"temperature": 0.1, "max_output_tokens": 200, "response_mime_type": "application/json"}
            )
            if response and response.text:
                try:
                    data = json.loads(response.text)
                    return {
                        "status": "Privacy Analyzed",
                        "confidence": 0.9,
                        "reason": data.get("explanation", heuristic_expl),
                        "privacy_risk": data.get("risk_level", heuristic_risk),
                        "privacy_explanation": data.get("explanation", heuristic_expl)
                    }
                except Exception:
                    pass
        except Exception:
            pass
            
    return {
        "status": "Privacy Analyzed",
        "confidence": 0.8,
        "reason": heuristic_expl,
        "privacy_risk": heuristic_risk,
        "privacy_explanation": heuristic_expl
    }

def perform_ai_analysis(content, is_url=False, url=None, analysis_type="news"):
    """
    Use Gemini SDK to analyze content with strict JSON prompts.
    """
    model = get_gemini_model()
    
    if model:
        try:
            prompt_text = """Role: professional misinformation analyst.
Analyze the text content for authenticity and manipulation.
Disallow generic explanations.
Respond ONLY in strict JSON.

Required JSON schema:
{
  "verdict": "REAL | FAKE | UNCERTAIN",
  "confidence": 0-100,
  "key_reasons": ["short concrete reason"],
  "red_flags": []
}

CONTENT:
""" + str(content)[:5000]

            response = model.generate_content(
                prompt_text,
                generation_config={
                    "temperature": 0.2,
                    "max_output_tokens": 512,
                    "response_mime_type": "application/json"
                }
            )
            
            if response and response.text:
                try:
                    data = json.loads(response.text)
                    
                    verdict = data.get("verdict", "UNCERTAIN").upper()
                    if "FAKE" in verdict:
                        status = "Likely Fake"
                    elif "REAL" in verdict:
                        status = "Likely Real"
                    else:
                        status = "Uncertain"
                    
                    # Normalize confidence to 0-1
                    conf_raw = data.get("confidence", 50)
                    try:
                        confidence = float(conf_raw)
                        if confidence > 1.0: confidence /= 100.0
                    except:
                        confidence = 0.5
                    
                    reasons = data.get("key_reasons", [])
                    reason_str = "; ".join(reasons) if reasons else "Analysis completed."
                    
                    return {
                        "status": status,
                        "confidence": confidence,
                        "reason": reason_str,
                        "privacy_risk": "Not Applicable",
                        "privacy_explanation": "Not analyzed for privacy.",
                        "correction": generate_correction_suggestion(content) if status == "Likely Fake" else "",
                        "used_evidence": True,
                        "verification_suggestions": "; ".join(data.get("red_flags", []))
                    }
                except Exception:
                    pass
        except Exception:
            pass
    
    # Fallback if AI fails
    return heuristic_fallback(content, is_url, url, "AI Service Unavailable", analysis_type)

def analyze_deepfake(file_path_or_data, image_data=None, mime_type=None):
    """
    Analyzes media content for deep fake indicators using Gemini Vision.
    Uses Part.from_bytes for correct payload handling.
    """
    model = get_gemini_model()
    
    if model and image_data:
        try:
            import base64
            from google.generativeai.types import Part
            
            # Decode provided base64 data to bytes
            try:
                if isinstance(image_data, str):
                    image_bytes = base64.b64decode(image_data)
                else:
                    image_bytes = image_data
            except Exception:
                raise ValueError("Invalid image data")

            prompt_text = """You are an AI image forensic assistant.
Analyze the image for visual inconsistencies commonly associated with
AI-generated or manipulated images.

DO NOT claim certainty.
DO NOT say definitively real or fake.

Respond ONLY in strict JSON:
{
  "likelihood": "LOW | MEDIUM | HIGH",
  "confidence": 0-100,
  "visual_indicators": ["short concrete observations"],
  "limitations": "why this is not definitive"
}"""

            # Create strictly typed image part
            image_part = Part.from_bytes(data=image_bytes, mime_type=mime_type or "image/jpeg")
            
            response = model.generate_content(
                [image_part, prompt_text],
                generation_config={
                    "temperature": 0.2,
                    "max_output_tokens": 512,
                    "response_mime_type": "application/json"
                }
            )

            if response and response.text:
                try:
                    data = json.loads(response.text)
                    
                    likelihood = str(data.get("likelihood", "MEDIUM")).upper()
                    if "HIGH" in likelihood:
                        status = "High Manipulation Risk"
                    elif "MEDIUM" in likelihood:
                        status = "Possible Manipulation"
                    elif "LOW" in likelihood:
                         status = "Low Manipulation Risk"
                    else:
                        status = "Uncertain"
                        
                    conf_raw = data.get("confidence", 50)
                    try:
                        confidence = float(conf_raw)
                        if confidence > 1.0: confidence /= 100.0
                    except:
                        confidence = 0.5
                    
                    indicators = data.get("visual_indicators", [])
                    limitations = data.get("limitations", "")
                    
                    reason = "; ".join(indicators) if indicators else "Visual analysis inconclusive."
                    technical_details = f"{reason} (Limitations: {limitations})"

                    return {
                        "status": status,
                        "confidence": confidence,
                        "reason": reason,
                        "privacy_risk": "Low",
                        "privacy_explanation": "Media scanned for artifacts.",
                        "analysis_details": {
                            "indicators_found": len(indicators),
                            "fake_probability": confidence if status == "High Manipulation Risk" else (1.0 - confidence),
                            "technical_assessment": technical_details
                        }
                    }
                except Exception:
                    pass

        except Exception:
             pass
            
    # Heuristic Fallback
    return heuristic_fallback(file_path_or_data, False, None, "Vision AI unavailable", "deepfake")

def analyze_url(domain):
    """
    Heuristics for suspicious domains.
    """
    suspicious_domains = [
        'bit.ly', 'tinyurl.com', 'ow.ly', 't.co', 'clickbait', 
        'fakenews', 'rumor', 'gossip', 'sensational', 'scam'
    ]
    trusted_sources = [
        'reuters.com', 'ap.org', 'bbc.com', 'nytimes.com', 
        'washingtonpost.com', 'cnn.com', 'foxnews.com'
    ]
    
    domain_lower = domain.lower()
    
    if any(trusted in domain_lower for trusted in trusted_sources):
        status = "Trusted Source"
        confidence = 0.9
        reason = f"Published by a known trusted news source: {domain}"
    elif any(suspicious in domain_lower for suspicious in suspicious_domains):
        status = "Suspicious Source"
        confidence = 0.8
        reason = f"Domain contains suspicious elements: {domain}"
    else:
        status = "Neutral Source"
        confidence = 0.6
        reason = f"Source {domain} is neither explicitly trusted nor suspicious."
    
    return {
        "status": status,
        "confidence": confidence,
        "reason": reason,
        "privacy_risk": "Low",
        "privacy_explanation": "URL check."
    }

def analyze_content(text, analysis_type="news"):
    """
    Deprecated/Simplified: Delegates to perform_ai_analysis or handles fallback logic.
    """
    return perform_ai_analysis(text, analysis_type=analysis_type)

def generate_correction_suggestion(text):
    text_lower = text.lower()
    if 'you won\'t believe' in text_lower:
        return "This is a classic clickbait phrase. Verify with credible sources."
    elif 'miracle cure' in text_lower:
        return "Medical claims should be verified with peer-reviewed studies."
    return "Verification with independent, reliable sources is recommended."

def heuristic_fallback(text, is_url=False, url=None, error_msg="", analysis_type="news"):
    """
    Comprehensive safe fallback when AI fails.
    """
    try:
        if is_url and url:
            domain = urlparse(url).netloc.lower()
            url_res = analyze_url(domain)
            return {
                "status": url_res["status"],
                "confidence": url_res["confidence"],
                "reason": f"{url_res['reason']} (Fallback: {error_msg})",
                "correction": "",
                "privacy_risk": "Low",
                "privacy_explanation": "Heuristic fallback."
            }
        
        if analysis_type == "deepfake":
            # Simple filename/string heuristic if bytes weren't processed
            s_text = str(text).lower()
            if any(x in s_text for x in ['fake', 'generated', 'synthetic']):
                return {
                    "status": "High Manipulation Risk", 
                    "confidence": 0.6,
                    "reason": "Metadata/Filename suggestions.",
                    "analysis_details": {"technical_assessment": "Heuristic fallback."}
                }
            return {
                "status": "Uncertain",
                "confidence": 0.5,
                "reason": f"AI unavailable ({error_msg}).",
                "analysis_details": {"technical_assessment": "Analysis failed."}
            }

        # Text Fallback
        fake_indicators = ['shocking', 'breaking news', 'secret', 'conspiracy']
        text_lower = str(text).lower()
        fake_score = sum(1 for i in fake_indicators if i in text_lower)
        
        if fake_score >= 2:
            return {
                "status": "Likely Fake",
                "confidence": 0.6,
                "reason": "Contains sensationalist language.",
                "correction": generate_correction_suggestion(str(text)),
                "privacy_risk": "Low",
                "privacy_explanation": "N/A"
            }
            
        return {
            "status": "Uncertain",
            "confidence": 0.5,
            "reason": f"System limitation ({error_msg}).",
            "correction": "",
            "privacy_risk": "Low",
            "privacy_explanation": "N/A"
        }
        
    except Exception:
        return {
            "status": "Uncertain",
            "confidence": 0.0,
            "reason": "System error.",
            "correction": "",
            "privacy_risk": "Unknown",
            "privacy_explanation": "Error."
        }

def get_trending_news():
    """
    Fetches trending news with robust fallback.
    """
    API_KEY = os.getenv("NEWS_API_KEY")
    try:
        if not API_KEY:
            raise Exception("No API Key")
        headlines_url = f"https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey={API_KEY}"
        resp = requests.get(headlines_url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            articles = []
            for a in data.get("articles", []):
                articles.append({
                    "title": a.get("title"),
                    "description": a.get("description"),
                    "source": a.get("source", {}).get("name"),
                    "published_at": a.get("publishedAt"),
                    "url": a.get("url")
                })
            return {
                "status": "success",
                "trending_news": articles,
                "trends": {"categories": ["General", "Tech"], "popularity": [80, 60], "sentiment": ["Neutral"]},
                "preferences": {"most_read_categories": ["General"], "reading_time_distribution": [10, 20, 40, 20, 10]},
                "timestamp": datetime.datetime.now().isoformat()
            }
    except Exception:
        pass
    
    # Mock Fallback
    return {
        "status": "success",
        "trending_news": [
            {
                "title": "Global Innovation Summit 2024",
                "description": "Leaders gather to discuss future technologies.",
                "source": "TrueVail News",
                "published_at": datetime.datetime.now().isoformat(),
                "url": "#"
            },
            {
                "title": "Tech Sector Recovery Continues",
                "description": "Market analysts report steady growth in technology stocks.",
                "source": "Market Watch",
                "published_at": datetime.datetime.now().isoformat(),
                "url": "#"
            }
        ],
        "trends": {
            "categories": ["Technology", "Business", "Science", "Politics", "Health", "Ent."],
            "popularity": [95, 80, 70, 60, 50, 40]
        },
        "preferences": {
             "most_read_categories": ["Technology", "Science", "Business"],
             "reading_time_distribution": [15, 25, 30, 20, 10]
        },
        "timestamp": datetime.datetime.now().isoformat()
    }
