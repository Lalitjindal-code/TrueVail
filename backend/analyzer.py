import os
import re
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
            # Direct privacy analysis using AI or heuristics
            return perform_ai_analysis(text, analysis_type="privacy")
        elif is_url:
            url = text.strip()
            content = fetch_url_content(url)
            if not content:
                # If scraping fails, pass URL to AI for assessment context
                content = f"News URL: {url}"
                # is_url remains True
            
            return perform_ai_analysis(content, is_url=is_url, url=url, analysis_type=analysis_type)
        else:
            if analysis_type == "news_advanced":
                return analyze_content(text, analysis_type=analysis_type)
            else:
                return perform_ai_analysis(text, analysis_type=analysis_type)
    except Exception:
        # Global safety catch - ensure we always return a valid structure
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
            return text[:12000]
        except Exception as e:
            time.sleep(1)
    return None

def web_search_duckduckgo(query, max_results=3):
    """
    Perform a simple DuckDuckGo HTML search (best-effort).
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    for attempt in range(2):
        try:
            q = quote_plus(query)
            search_url = f"https://html.duckduckgo.com/html/?q={q}"
            r = requests.get(search_url, headers=headers, timeout=6)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, 'html.parser')
            links = []
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and 'duckduckgo.com' not in href:
                    if href not in links:
                        links.append(href)
                if len(links) >= max_results:
                    break
            return links[:max_results]
        except Exception:
            time.sleep(1)
    return []

def perform_ai_analysis(content, is_url=False, url=None, analysis_type="news"):
    """
    Use Gemini SDK to analyze content with fallback reliability.
    """
    model = get_gemini_model()
    
    if model:
        try:
            if analysis_type == "privacy":
                prompt_text = f"Identify PII/privacy risks in this text. Respond ONLY as: Status: [Low/Med/High], Confidence: [0-100], Explanation: [Short summary]. TEXT: {content[:5000]}"
            else:
                prompt_text = f"Verify news authenticity. Respond ONLY as: Status: [Likely Real/Fake/Uncertain], Confidence: [0-100], Explanation: [Brief assessment]. CONTENT: {content[:5000]}"

            response = model.generate_content(
                prompt_text,
                generation_config={
                    "temperature": 0.1,
                    "max_output_tokens": 250
                }
            )
            
            if response and response.text:
                return parse_ai_response(response.text, analysis_type=analysis_type)
                
        except Exception:
            # Fall through to heuristic fallback
            pass
            
    return heuristic_fallback(content, is_url, url, "AI unavailable", analysis_type)

def parse_ai_response(ai_response, analysis_type="news"):
    """
    Parse the AI response to extract structured data.
    """
    status = "Uncertain"
    confidence = 0.5
    reason = "Could not parse AI response details."
    privacy_risk = "Low"
    privacy_explanation = "No privacy risks detected."
    correction = ""
    
    try:
        # Extract Status
        status_match = re.search(r"Status:.*?(\b(Likely Real|Likely Fake|Uncertain|Low|Medium|High)\b)", ai_response, re.IGNORECASE)
        if status_match:
            status = status_match.group(1).title()
            if analysis_type == "privacy":
                privacy_risk = status
                if status == "High": status = "High Risk"
                elif status == "Medium": status = "Medium Risk"
                else: status = "Low Risk"

        # Extract Confidence
        conf_match = re.search(r"Confidence:.*?(\d+)", ai_response)
        if conf_match:
            confidence = int(conf_match.group(1)) / 100.0
        
        # Extract Explanation
        exp_match = re.search(r"Explanation:\s*(.*)", ai_response, re.IGNORECASE)
        if exp_match:
            reason = exp_match.group(1).strip()
            if analysis_type == "privacy":
                privacy_explanation = reason

        # News specific correction logic
        if analysis_type == "news" and "Fake" in status:
            if "Explanation:" not in ai_response:
                reason = "AI detected potential misinformation."
            correction = "Verification with independent sources is recommended."

        return {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "privacy_risk": privacy_risk,
            "privacy_explanation": privacy_explanation,
            "correction": correction,
            "used_evidence": True
        }
    except Exception:
        return {
            "status": status,
            "confidence": confidence,
            "reason": f"Analysis completed (partial parse). {reason}",
            "privacy_risk": privacy_risk,
            "privacy_explanation": privacy_explanation,
            "correction": correction,
            "used_evidence": True
        }

def analyze_deepfake(file_path_or_data, image_data=None, mime_type=None):
    """
    Analyzes media content for deep fake indicators using Gemini Vision.
    """
    model = get_gemini_model()
    
    if model and image_data:
        try:
            import base64
            # Decode provided base64 data to bytes
            try:
                if isinstance(image_data, str):
                    image_bytes = base64.b64decode(image_data)
                else:
                    image_bytes = image_data
            except Exception:
                # If decoding fails, fallback immediately
                raise ValueError("Invalid image data")

            prompt_text = (
                "You are an expert deepfake detector. Analyze this media for synthetic generation, manipulation, or AI artifacts. "
                "Respond ONLY in this format: Verdict: [Likely Real/Likely Deepfake/Uncertain], Confidence: [0-100], Reasoning: [Short explanation]."
            )

            # Construct request with inline data
            # Use dictionary format compatible with standard SDK
            user_content = [
                prompt_text,
                {
                    "mime_type": mime_type or "image/jpeg",
                    "data": image_bytes
                }
            ]

            response = model.generate_content(
                user_content,
                generation_config={
                    "temperature": 0.1,
                    "max_output_tokens": 200
                }
            )

            if response and response.text:
                ai_analysis = response.text
                
                # Parse Verdict
                verdict = "Uncertain"
                verdict_match = re.search(r"Verdict:\s*(Likely Real|Likely Deepfake|Uncertain|Likely Authentic)", ai_analysis, re.IGNORECASE)
                if verdict_match:
                    v_raw = verdict_match.group(1).title()
                    if "Deepfake" in v_raw: verdict = "Likely Deepfake"
                    elif "Real" in v_raw or "Authentic" in v_raw: verdict = "Likely Authentic"
                
                # Parse Confidence
                conf_val = 0.5
                conf_match = re.search(r"Confidence:\s*(\d+)", ai_analysis)
                if conf_match:
                    conf_val = int(conf_match.group(1)) / 100.0
                
                # Parse Reasoning
                reasoning = "AI analysis completed."
                reason_match = re.search(r"Reasoning:\s*(.*)", ai_analysis, re.DOTALL | re.IGNORECASE)
                if reason_match:
                    reasoning = reason_match.group(1).strip()

                return {
                    "status": verdict,
                    "confidence": conf_val,
                    "reason": reasoning,
                    "privacy_risk": "Low",
                    "privacy_explanation": "Media content analysis completed.",
                    "analysis_details": {
                        "indicators_found": 0,
                        "fake_probability": conf_val if "Deepfake" in verdict else 1 - conf_val,
                        "technical_assessment": f"AI assessment: {reasoning}"
                    }
                }

        except Exception:
            pass # Fallback to heuristics
            
    # Heuristic Fallback
    return heuristic_fallback(file_path_or_data, False, None, "Deepfake AI unavailable", "deepfake")

def analyze_url(domain):
    """
    Heuristics for suspicious domains.
    """
    suspicious_domains = [
        'bit.ly', 'tinyurl.com', 'ow.ly', 't.co', 'is.gd', 'buff.ly',
        'clickbait', 'fakenews', 'rumor', 'gossip', 'sensational',
        'unverified', 'shady', 'questionable', 'scam', 'hoax'
    ]
    trusted_sources = [
        'reuters.com', 'ap.org', 'bbc.com', 'nytimes.com', 'washingtonpost.com',
        'cnn.com', 'foxnews.com', 'nbcnews.com', 'abcnews.go.com', 'cbsnews.com'
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
        "privacy_explanation": "URL itself poses minimal privacy risk."
    }

def extract_content_from_url(url):
    try:
        parsed = urlparse(url)
        return f"Content from {parsed.netloc}: {parsed.path.replace('/', ' ').strip()}"
    except:
        return None

def analyze_content(text, analysis_type="news"):
    """
    Robust analysis handling both Heuristics and Advanced AI (if enabled).
    """
    text_lower = text.lower().strip()
    
    # 1. Privacy Analysis (Heuristic Support)
    if analysis_type == "privacy":
        privacy_indicators = ['@', '.com', 'phone', 'address', 'location', 'email', 'name', 'street', 'city', 'zip', 'ssn', 'credit card']
        privacy_risks = [indicator for indicator in privacy_indicators if indicator in text_lower]
        
        if len(privacy_risks) >= 3:
            privacy_risk = "High"
            explanation = f"Multiple privacy risks detected: {', '.join(privacy_risks[:3])}."
        elif len(privacy_risks) >= 1:
            privacy_risk = "Medium"
            explanation = f"Potential privacy risks: {', '.join(privacy_risks)}."
        else:
            privacy_risk = "Low"
            explanation = "No significant privacy risks detected."
        
        return {
            "status": privacy_risk,
            "confidence": 0.8,
            "reason": "Based on presence of personal identifiers",
            "privacy_risk": privacy_risk,
            "privacy_explanation": explanation
        }

    # 2. Advanced News Analysis (Gemini)
    if analysis_type == "news_advanced":
        model = get_gemini_model()
        if model:
            try:
                prompt = (
                    "As an expert fact-checker, analyze this news content thoroughly. "
                    "Respond in JSON format with keys: status, confidence, reason, indicators, verification_suggestions. "
                    f"Content: {text[:1500]}"
                )
                response = model.generate_content(
                    prompt, 
                    generation_config={"temperature": 0.1, "max_output_tokens": 1000}
                )
                
                if response and response.text:
                    try:
                        # Clean markdown code blocks if present
                        clean_text = response.text.replace("```json", "").replace("```", "")
                        parsed = json.loads(clean_text)
                        
                        # Normalize confidence
                        conf = parsed.get("confidence", 0.5)
                        if isinstance(conf, str) and "%" in conf:
                            conf = float(conf.replace("%", "")) / 100
                        
                        return {
                            "status": parsed.get("status", "Uncertain"),
                            "confidence": float(conf) if isinstance(conf, (int, float)) else 0.5,
                            "reason": parsed.get("reason", "Analysis completed"),
                            "indicators": parsed.get("indicators", ""),
                            "verification_suggestions": parsed.get("verification_suggestions", ""),
                            "raw_output": response.text,
                            "correction": generate_correction_suggestion(text),
                            "privacy_risk": "Not Applicable",
                            "privacy_explanation": "Privacy risk assessment not applicable."
                        }
                    except Exception:
                        pass # JSON parse fail, fall to heuristic
            except Exception:
                pass # Model fail, fall to heuristic
        
        # Fallback to basic news heuristic if advanced failed
        return analyze_content(text, analysis_type="news")

    # 3. Basic News Analysis (Heuristic/Pre-trained)
    if analysis_type == "news":
        try:
            # Lazy import to avoid top-level side effects
            from fake_news_detection import detect_fake_news
            detection_result = detect_fake_news(text)
            return {
                "status": detection_result['status'],
                "confidence": detection_result['confidence'],
                "reason": detection_result['reason'],
                "correction": generate_correction_suggestion(text) if detection_result.get('is_fake') else "",
                "privacy_risk": "Not Applicable",
                "privacy_explanation": "Privacy risk assessment not applicable."
            }
        except Exception:
            pass # Fallback to manual heuristics below

        # Manual Heuristics
        fake_indicators = ['you won\'t believe', 'shocking', 'urgent', 'breaking news', 'secret', 'conspiracy']
        real_indicators = ['according to', 'study shows', 'reported by', 'official', 'statement']
        
        fake_score = sum(1 for i in fake_indicators if i in text_lower)
        real_score = sum(1 for i in real_indicators if i in text_lower)
        
        if fake_score > real_score:
            status = "Likely Fake"
            confidence = 0.7
            reason = f"Contains indicators of misinformation ({fake_score} flags)."
            correction = generate_correction_suggestion(text)
        elif real_score > fake_score:
            status = "Likely Real"
            confidence = 0.7
            reason = f"Contains indicators of reliable reporting ({real_score} markers)."
            correction = ""
        else:
            status = "Uncertain"
            confidence = 0.5
            reason = "insufficient indicators to determine authenticity."
            correction = ""

        return {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "correction": correction,
            "privacy_risk": "Not Applicable",
            "privacy_explanation": "Privacy risk assessment not applicable."
        }
        
    # Default fallback for unknown types
    return {
        "status": "Uncertain",
        "confidence": 0.5,
        "reason": "Unknown analysis type requested.",
        "correction": "",
        "privacy_risk": "Low",
        "privacy_explanation": "N/A"
    }

def generate_correction_suggestion(text):
    text_lower = text.lower()
    corrections = []
    
    if 'you won\'t believe' in text_lower:
        corrections.append("This is a classic clickbait phrase. Verify with credible sources.")
    elif 'breaking news' in text_lower and 'urgent' in text_lower:
        corrections.append("Check established news outlets to confirm this story.")
    elif 'miracle cure' in text_lower:
        corrections.append("Medical claims should be verified with peer-reviewed studies.")
    
    if not corrections:
        corrections.append("We recommend fact-checking this information with trusted news sources.")
        
    return " ".join(corrections)

def heuristic_fallback(text, is_url=False, url=None, error_msg="", analysis_type="news"):
    """
    Comprehensive safe fallback when AI fails.
    Never raises exceptions.
    """
    try:
        if is_url and url:
            domain = urlparse(url).netloc.lower()
            url_res = analyze_url(domain)
            return {
                "status": url_res["status"],
                "confidence": url_res["confidence"],
                "reason": f"{url_res['reason']} (AI unavailable: {error_msg})",
                "correction": "",
                "privacy_risk": "Low",
                "privacy_explanation": "Heuristic fallback used."
            }
        
        if analysis_type == "deepfake":
            # Simple filename/string heuristic
            s_text = str(text).lower()
            if any(x in s_text for x in ['fake', 'deep', 'generated']):
                return {
                    "status": "Likely Deepfake", 
                    "confidence": 0.6,
                    "reason": "Metadata/Filename suggests manipulation (AI unavailable).",
                    "analysis_details": {"technical_assessment": "Heuristic fallback only."}
                }
            return {
                "status": "Uncertain",
                "confidence": 0.5,
                "reason": "AI analysis unavailable. Visual verification required.",
                "analysis_details": {"technical_assessment": "Heuristic fallback only."}
            }

        # Fallback to standard content heuristic
        return analyze_content(str(text), analysis_type)
        
    except Exception:
        # Ultimate fail-safe
        return {
            "status": "Uncertain",
            "confidence": 0.0,
            "reason": "System error during fallback analysis.",
            "correction": "",
            "privacy_risk": "Unknown",
            "privacy_explanation": "System error."
        }

def get_trending_news():
    """
    Fetches trending news.
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
                "trends": {"categories": [], "popularity": [], "sentiment": []}, # Simplified
                "preferences": {},
                "timestamp": datetime.datetime.now().isoformat()
            }
    except Exception:
        pass
        
    # Mock Fallback
    return {
        "status": "success",
        "trending_news": [
            {
                "title": "Global Markets Rally (Mock)",
                "description": "Demonstration data when API is unavailable.",
                "source": "Demo News",
                "published_at": datetime.datetime.now().isoformat(),
                "url": "#"
            }
        ],
        "trends": {
            "categories": ["Tech", "Science"],
            "popularity": [90, 80],
            "sentiment": ["Positive", "Neutral"]
        },
        "preferences": {
            "most_read_categories": ["Tech"],
            "preferred_sources": ["Demo News"]
        },
        "timestamp": datetime.datetime.now().isoformat()
    }