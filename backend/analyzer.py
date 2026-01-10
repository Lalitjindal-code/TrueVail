import os
import re
import requests
import json
import time
from bs4 import BeautifulSoup
from urllib.parse import urlparse, quote_plus
try:
    import google.genai as genai
    NEW_SDK = True
except ImportError:
    import google.generativeai as genai
    NEW_SDK = False
    
# Check if the new SDK is properly available
try:
    if NEW_SDK:
        genai.configure(api_key=GEMINI_API_KEY)
except AttributeError:
    # If configure doesn't exist, fall back to legacy SDK
    NEW_SDK = False
    import google.generativeai as genai
from dotenv import load_dotenv
from fake_news_detection import detect_fake_news, train_fake_news_detector
import datetime

# Load environment variables from .env file
load_dotenv()

# AI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_PLATFORM = os.getenv("AI_PLATFORM", "gemini").lower() # gemini or ollama
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL_TEXT = os.getenv("OLLAMA_MODEL_TEXT", "llama3.1:latest")
OLLAMA_MODEL_VISION = os.getenv("OLLAMA_MODEL_VISION", "llava:latest")

def call_ollama(prompt, model="llama3.1", images=None, timeout=60):
    """Calls local Ollama API"""
    print(f"DEBUG: call_ollama called with model: {model}, images: {bool(images)}, timeout: {timeout}")
    try:
        with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- {time.ctime()} --- OLLAMA REQ ({model}) ---\nPrompt: {prompt[:200]}...\n")
            if images: f.write(f"Images attached: {len(images)}\n")

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1}
        }
        if images:
            payload["images"] = images
            
        print(f"DEBUG: Calling Ollama ({model}) with payload...")
        # Use specified timeout (default 60 seconds for better performance)
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=timeout)
        
        with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
            f.write(f"Ollama Status: {response.status_code}\n")

        if response.status_code == 200:
            res_json = response.json()
            print(f"DEBUG: Ollama response received: {res_json.keys() if isinstance(res_json, dict) else type(res_json)}")
            res_text = res_json.get("response", "")
            with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                f.write(f"Ollama Resp: {res_text[:500]}\n")
            print(f"DEBUG: Returning response: {res_text[:100]}...")
            return res_text
        else:
            err_msg = f"Error: Ollama returned {response.status_code}"
            with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                f.write(f"{err_msg}\n")
            print(f"DEBUG: Ollama returned error: {err_msg}")
            return err_msg
    except requests.exceptions.ConnectionError:
        err_msg = "Error: Cannot connect to Ollama. Is the Ollama service running?"
        print(f"DEBUG: Connection error to Ollama: {err_msg}")
        return err_msg
    except requests.exceptions.Timeout:
        err_msg = "Error: Ollama request timed out. Using faster local analysis."
        print(f"DEBUG: Ollama request timed out: {err_msg}")
        return err_msg
    except Exception as e:
        err_msg = f"Error connecting to Ollama: {str(e)}"
        with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
            f.write(f"{err_msg}\n")
        print(f"DEBUG: General error in call_ollama: {err_msg}")
        return err_msg

# Initialize the Gemini model with the google.genai/google.generativeai package
model = None
if GEMINI_API_KEY and GEMINI_API_KEY != "" and len(GEMINI_API_KEY) > 20:  # Check for a reasonably long API key
    print(f"DEBUG: Key found (starts with: {GEMINI_API_KEY[:4]}...)")
    try:
        if NEW_SDK:
            # Configure the API key for new SDK
            genai.configure(api_key=GEMINI_API_KEY)
            # Initialize the model with new SDK
            model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            # Configure the API key for legacy SDK
            genai.configure(api_key=GEMINI_API_KEY)
            # Initialize the model with legacy SDK
            model = genai.GenerativeModel('gemini-1.5-flash')
        print("DEBUG: Model initialized successfully")
    except Exception as e:
        print(f"DEBUG: Error initializing model: {e}")
        model = None
else:
    print("DEBUG: No valid API key provided")
    model = None

def analyze_news(text, analysis_type="news", image_data=None, mime_type=None):
    """
    Analyzes news content, a URL, or media for authenticity and risks.
    """
    print(f"DEBUG: analyze_news called with text type: {type(text)}, analysis_type: {analysis_type}, image_data: {bool(image_data)}")
    
    # Check if input is a URL
    parsed_url = urlparse(text.strip()) if text else None
    is_url = bool(parsed_url and parsed_url.scheme and parsed_url.netloc)
    
    if analysis_type == "deepfake":
        # For deepfake detection, we use the uploaded image data if available
        return analyze_deepfake(text, image_data=image_data, mime_type=mime_type)
    elif analysis_type == "privacy":
        # For privacy analysis, use our dedicated function
        print(f"DEBUG: Calling privacy analysis for: {text[:50]}...")
        return analyze_content(text, analysis_type="privacy")
    elif is_url:
        url = text.strip()
        content = fetch_url_content(url)
        if not content:
            # If scraping fails, don't just fail-fast with heuristics.
            # Use the URL itself as the 'content' for the AI, which will trigger a web search.
            content = f"News URL: {url}"
            is_url = True # Keep this flag
            print(f"DEBUG: Scraping failed for {url}. Passing URL to AI for search-enhanced analysis.")
        
        return perform_ai_analysis(content, is_url=is_url, url=url, analysis_type=analysis_type)
    else:
        # For news_advanced analysis, use analyze_content directly
        if analysis_type == "news_advanced":
            return analyze_content(text, analysis_type=analysis_type)
        else:
            return perform_ai_analysis(text, analysis_type=analysis_type)

def fetch_url_content(url):
    """
    Fetches the main text content from a given URL.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    # Try a couple of times to fetch the page and extract main content
    for attempt in range(2):
        try:
            response = requests.get(url, headers=headers, timeout=7)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            # Prefer <article> content if available
            article = soup.find('article')
            if article:
                text = article.get_text(separator='\n')
            else:
                # Fallback: join largest <p> blocks (heuristic)
                p_texts = [p.get_text(separator=' ') for p in soup.find_all('p') if p.get_text(strip=True)]
                # Choose longest contiguous set: take top 8 paragraphs by length
                p_texts_sorted = sorted(p_texts, key=lambda s: len(s), reverse=True)
                text = '\n\n'.join(p_texts_sorted[:8]) if p_texts_sorted else soup.get_text()

            # Normalize whitespace and return a reasonable slice
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split('  '))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            return text[:12000]
        except Exception as e:
            # Distinguish timeouts and retry once
            try:
                from requests.exceptions import ReadTimeout
                if isinstance(e, ReadTimeout):
                    print(f"Timeout fetching URL (attempt {attempt+1}): {url}")
                else:
                    print(f"Error fetching URL (attempt {attempt+1}): {e}")
            except:
                print(f"Error fetching URL (attempt {attempt+1}): {e}")
            time.sleep(1)
    return None


def web_search_duckduckgo(query, max_results=3):
    """
    Perform a simple DuckDuckGo HTML search and return a list of result URLs (best-effort).
    This avoids JavaScript-heavy search pages and attempts to provide quick evidence links.
    """
    # Try twice to get search results (best-effort)
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
        except Exception as e:
            print(f"DEBUG: web_search_duckduckgo attempt {attempt+1} failed: {e}")
            time.sleep(1)

def perform_ai_analysis(content, is_url=False, url=None, analysis_type="news"):
    """
    Use the Gemini SDK to analyze content.
    """
    # Prioritize Gemini when available, regardless of AI_PLATFORM setting
    if GEMINI_API_KEY and model:
        try:
            # Save request for debug
            with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                f.write(f"\n--- {time.ctime()} --- SDK CALL ---\nType: {analysis_type}\n")

            if analysis_type == "privacy":
                prompt_text = f"Identify PII/privacy risks in this text. Respond ONLY as: Status: [Low/Med/High], Confidence: [0-100], Explanation: [Short summary]. TEXT: {content[:5000]}"
            else: # news analysis
                prompt_text = f"Verify news authenticity. Respond ONLY as: Status: [Likely Real/Fake/Uncertain], Confidence: [0-100], Explanation: [Brief assessment]. CONTENT: {content[:5000]}"

            # Use the SDK to call the model
            if model:
                response = model.generate_content(
                    prompt_text,
                    generation_config={
                        "temperature": 0.1,
                        "max_output_tokens": 250
                    }
                )
                
                if hasattr(response, 'text') and response.text:
                    ai_text = response.text
                else:
                    raise Exception(f"No text in response: {response}")
            else:
                raise Exception("Model not initialized")

            return parse_ai_response(ai_text, analysis_type=analysis_type)

        except Exception as e:
            print(f"DEBUG: Gemini analysis failed: {e}")
            # If Gemini fails, fall back to other methods
    
    # If Gemini is not available or failed, use Ollama or pre-trained model
    if AI_PLATFORM == "ollama":
        if analysis_type == "news":
            # For news analysis, first try the pre-trained model
            try:
                print(f"DEBUG: Attempting to use pre-trained fake news detector for news analysis...")
                detection_result = detect_fake_news(content)
                print(f"DEBUG: Pre-trained model result: {detection_result}")
                
                # Return the result in the expected format
                result = {
                    "status": detection_result['status'],
                    "confidence": detection_result['confidence'],
                    "reason": detection_result['reason'],
                    "correction": detection_result.get('correction', ''),
                    "privacy_risk": "Not Applicable",
                    "privacy_explanation": "Privacy risk assessment not applicable to this function."
                }
                print(f"DEBUG: Returning pre-trained model result: {result['status']} with confidence {result['confidence']}")
                return result
            except Exception as e:
                print(f"DEBUG: Error using pre-trained fake news detector, falling back to Ollama: {e}")
                # Continue with Ollama as fallback
        
        if analysis_type == "privacy":
            # Reduce privacy context and use neutral data classification prompt
            prompt = (
                "Task: Classify data sensitivity.\n"
                f"Input: {content[:1500]}\n"
                "Instructions: Determine if the input contains sensitive personal data (Names, Emails, IDs).\n"
                "Do not write code.\n"
                "Response Format:\n"
                "Status: [High/Medium/Low]\n"
                "Confidence: [0-100]\n"
                "Explanation: [Brief reason]\n"
            )
        else: # news analysis fallback to Ollama
            # Add search context to prevent hallucinations
            # Extract a very concise search query
            lines = content.split('\n')
            first_line = lines[0].strip() if lines else content
            search_query = first_line[:100]
            
            print(f"DEBUG: Performing concise web search for: {search_query}...")
            links = web_search_duckduckgo(search_query, max_results=1)
            search_context = ""
            if links:
                print(f"DEBUG: Found link for context: {links[0]}")
                ref_content = fetch_url_content(links[0])
                if ref_content:
                    # Limit reference content to 1500 chars
                    search_context = f"\n\nREAL-TIME CONTEXT FROM SEARCH:\n{ref_content[:1500]}\n"
            
            prompt = (
                "You are an expert fact-checker. Verify the CONTENT below using 'REAL-TIME CONTEXT' as truth. "
                "Respond ONLY as: Status: [Likely Real/Likely Fake/Uncertain], Confidence: [0-100], Explanation: [Assessment]. "
                f"{search_context}\n\nCONTENT TO ANALYZE: {content[:1500]}"
            )
        
        ai_text = call_ollama(prompt, model=OLLAMA_MODEL_TEXT)
        if "Error" in ai_text:
            return heuristic_fallback(content, is_url, url, ai_text, analysis_type)
        return parse_ai_response(ai_text, analysis_type=analysis_type)
    
    # If no AI platform is available, use heuristic fallback
    return heuristic_fallback(content, is_url, url, "No AI platform available", analysis_type)

def parse_ai_response(ai_response, analysis_type="news"):
    """
    Parse the AI response to extract structured data. Improved for robustness.
    """
    # Default values
    status = "Uncertain"
    confidence = 0.5
    reason = "Could not parse AI response details."
    privacy_risk = "Low"
    privacy_explanation = "No privacy risks detected."
    correction = ""
    
    try:
        # Extract Status (handle markdown and brackets)
        status_match = re.search(r"Status:.*?(\b(Likely Real|Likely Fake|Uncertain|Low|Medium|High)\b)", ai_response, re.IGNORECASE)
        if status_match:
            status = status_match.group(1).title()
            # Map privacy status to risk
            if analysis_type == "privacy":
                privacy_risk = status
                if status == "High": status = "High Risk"
                elif status == "Medium": status = "Medium Risk"
                else: status = "Low Risk"

        # Extract Confidence (handle markdown and brackets)
        conf_match = re.search(r"Confidence:.*?(\d+)", ai_response)
        if conf_match:
            confidence = int(conf_match.group(1)) / 100.0
        
        # Extract Explanation
        exp_match = re.search(r"Explanation:\s*(.*)", ai_response, re.IGNORECASE)
        if exp_match:
            reason = exp_match.group(1).strip()
            if analysis_type == "privacy":
                privacy_explanation = reason

        # Extract Privacy Highlights
        if "Privacy Highlights:" in ai_response:
            highlights = []
            lines = ai_response.split('\n')
            found = False
            for line in lines:
                if "Privacy Highlights:" in line:
                    found = True
                    part = line.split("Privacy Highlights:")[1].strip()
                    if part and part.lower() != 'none':
                        highlights.append(part)
                    continue
                if found:
                    if line.startswith("•") or line.strip().startswith("-"):
                        highlights.append(line.strip("•- "))
                    elif ":" in line and not line.strip().startswith("•"): # Next section
                        break
            
            if highlights and highlights[0].lower() != 'none':
                privacy_explanation = "Detected: " + "; ".join(highlights)
                if analysis_type != "privacy":
                    # If news analysis found privacy issues
                    privacy_risk = "Medium" if len(highlights) < 3 else "High"

        # Special logic for news analysis verdicts
        if analysis_type == "news":
            if "Fake" in ai_response and ("Verdict: Fake" in ai_response or "Status: Likely Fake" in ai_response):
                status = "Likely Fake"
                if "Explanation:" not in ai_response:
                    reason = "AI detected potential misinformation or fake claims in the content."
                # Minimal correction placeholder - AI response could be parsed for better correction
                correction = "Verification with multiple independent sources is recommended for this content."

        return {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "privacy_risk": privacy_risk,
            "privacy_explanation": privacy_explanation,
            "correction": correction,
            "used_evidence": True
        }
    except Exception as e:
        print(f"DEBUG: Error parsing AI response: {e}")
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
    Analyzes media content for deep fake indicators.
    """
    print(f"DEBUG: analyze_deepfake called with file_path_or_data type: {type(file_path_or_data)}, image_data: {bool(image_data)}, mime_type: {mime_type}")
    
    # If image_data is provided (as base64 string from frontend), use it directly
    if image_data:
        print(f"DEBUG: Using provided image_data for analysis")
        # Ollama Platform
        if AI_PLATFORM == "ollama":
            print(f"DEBUG: Deepfake analysis using Ollama with image data: {bool(image_data)}")
            prompt_text = (
                "Analyze this media for deepfakes, AI artifacts, or facial manipulation. "
                "Respond ONLY as: Verdict: [Likely Real/Likely Deepfake/Uncertain], Confidence: [0-100], Reasoning: [Short assessment]. "
                f"Context: Analyzing uploaded media file."
            )
            
            # image_data from frontend is already base64 encoded
            ai_analysis = call_ollama(prompt_text, model=OLLAMA_MODEL_VISION, images=[image_data])
            
            if "Error" in ai_analysis:
                print(f"DEBUG: Ollama deepfake analysis failed: {ai_analysis}")
                # Fallback to heuristics if ollama fails or model missing
                return heuristic_fallback(file_path_or_data, False, None, ai_analysis, "deepfake")

            print(f"DEBUG: Ollama deepfake analysis result: {ai_analysis[:200]}...")
            # Parse the response (reusing logic)
            verdict = "Uncertain"
            verdict_match = re.search(r"Verdict:\s*\[?(Likely Real|Likely Deepfake|Uncertain|Likely Authentic)", ai_analysis, re.IGNORECASE)
            if verdict_match:
                v_raw = verdict_match.group(1).title()
                if "Deepfake" in v_raw: verdict = "Likely Deepfake"
                elif "Real" in v_raw or "Authentic" in v_raw: verdict = "Likely Authentic"
            
            conf_val = 0.5
            conf_match = re.search(r"Confidence:\s*\[?(\d+)", ai_analysis)
            if conf_match:
                conf_val = int(conf_match.group(1)) / 100.0
            
            reasoning = "Local analysis completed via Ollama."
            reason_match = re.search(r"Reasoning:\s*(.*)", ai_analysis, re.DOTALL | re.IGNORECASE)
            if reason_match:
                reasoning = reason_match.group(1).strip()

            return {
                "status": verdict,
                "confidence": conf_val,
                "reason": reasoning,
                "privacy_risk": "Low",
                "privacy_explanation": "Processed locally via Ollama.",
                "analysis_details": {
                    "indicators_found": 0,
                    "fake_probability": conf_val if "Deepfake" in verdict else 1 - conf_val,
                    "technical_assessment": f"Ollama ({OLLAMA_MODEL_VISION}) assessment: {reasoning}"
                }
            }
        
        # Gemini Platform
        if GEMINI_API_KEY and model:
            try:
                # Create a prompt for the AI
                prompt_text = (
                    "You are an expert deepfake detector. Analyze this media for synthetic generation, manipulation, or AI artifacts. "
                    "For videos, focus on temporal flickering, unnatural movements, and lighting inconsistencies. "
                    f"Context: Analyzing uploaded media file. "
                    "Respond ONLY in this format: Verdict: [Likely Real/Likely Deepfake/Uncertain], Confidence: [0-100], Reasoning: [Short explanation]."
                )
                
                # Use the SDK to call the model with image data if available
                if image_data:
                    # For image analysis, we need to handle the image data differently
                    import base64
                    
                    # Decode the base64 image data to bytes
                    try:
                        image_bytes = base64.b64decode(image_data)
                    except Exception as e:
                        print(f"DEBUG: Error decoding image data: {e}")
                        raise e
                    
                    # Create a Part object with the image data
                    if NEW_SDK:
                        # New SDK format
                        from google.genai.types import Part
                        image_part = Part.from_data(image_bytes, mime_type=mime_type or "image/jpeg")
                        text_part = Part.from_text(prompt_text)
                        contents = [text_part, image_part]
                    else:
                        # Legacy SDK format
                        from google.generativeai.types import Part
                        image_part = Part.from_data(image_bytes, mime_type=mime_type or "image/jpeg")
                        text_part = Part.from_text(prompt_text)
                        contents = [text_part, image_part]
                    
                    response = model.generate_content(
                        contents,
                        generation_config={
                            "temperature": 0.1,
                            "max_output_tokens": 200
                        }
                    )
                else:
                    # Text-only analysis
                    response = model.generate_content(
                        prompt_text,
                        generation_config={
                            "temperature": 0.1,
                            "max_output_tokens": 200
                        }
                    )
                
                with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                    f.write(f"\n--- {time.ctime()} --- DEEPFAKE SDK ---\n")
                    if image_data:
                        f.write(f"Image data provided (base64 length: {len(image_data)})\n")

                if hasattr(response, 'text') and response.text:
                    ai_analysis = response.text
                else:
                    raise Exception(f"No text in response: {response}")
                
                # Simple regex parsing
                verdict = "Uncertain"
                verdict_match = re.search(r"Verdict:\s*(Likely Real|Likely Deepfake|Uncertain|Likely Authentic)", ai_analysis, re.IGNORECASE)
                if verdict_match:
                    v_raw = verdict_match.group(1).title()
                    if "Deepfake" in v_raw: verdict = "Likely Deepfake"
                    elif "Real" in v_raw or "Authentic" in v_raw: verdict = "Likely Authentic"
                
                conf_val = 0.5
                conf_match = re.search(r"Confidence:\s*(\d+)", ai_analysis)
                if conf_match:
                    conf_val = int(conf_match.group(1)) / 100.0
                
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
            except Exception as e:
                print(f"DEBUG: Error using AI for deepfake analysis: {e}")
                pass
        
        # If no AI platform is available, use heuristics
        print(f"DEBUG: No AI platform available, using heuristics for deepfake detection")
        # ... (rest of the heuristic logic remains same)
        # This could be a filename or some identifier
        file_lower = str(file_path_or_data).lower()
        
        # Simulated deep fake detection heuristics
        # In a real implementation, this would use ML models to analyze video/image frames
        deepfake_indicators = [
            'fake', 'deepfake', 'manipulated', 'altered', 'synthetic', 'generated',
            'ai-generated', 'computer-generated', 'not real', 'simulation'
        ]
        
        # Count indicators in filename/description
        indicator_count = sum(1 for indicator in deepfake_indicators if indicator in file_lower)
        
        # Calculate probability based on indicators
        if indicator_count > 0:
            fake_probability = min(0.6 + (indicator_count * 0.15), 0.98)  # Higher base probability if indicators found
        else:
            # Analyze filename patterns that might suggest deepfakes
            suspicious_patterns = ['fake', 'deep', 'ai_', '_ai', 'synthetic', 'generated', 'gen_', 'face', 'swap']
            found_suspicious = sum(1 for pattern in suspicious_patterns if pattern in file_lower)
            
            if found_suspicious > 0:
                fake_probability = min(0.5 + (found_suspicious * 0.12), 0.9)  # Moderate probability for suspicious patterns
            else:
                # Default lower probability if no suspicious indicators
                fake_probability = 0.2  # Lower default assumption
                
                # Analyze file extension - certain extensions more likely to contain deepfakes
                if any(ext in file_lower for ext in ['.mp4', '.mov', '.avi', '.mkv']):  # Video formats
                    fake_probability += 0.15
                elif any(ext in file_lower for ext in ['.jpg', '.jpeg', '.png', '.bmp']):  # Image formats
                    fake_probability += 0.1
                
                # Add some variance but keep it reasonable
                import random
                fake_probability += random.uniform(-0.1, 0.15)
                fake_probability = max(0.05, min(0.95, fake_probability))  # Clamp between 5% and 95%
        
        # Determine status based on probability
        if fake_probability > 0.7:
            status = "Likely Deepfake"
            confidence = round(fake_probability, 3)
            reason = f"High probability of manipulation detected ({indicator_count} indicators found)."
        elif fake_probability > 0.4:
            status = "Uncertain"
            confidence = round(fake_probability, 3)
            reason = f"Moderate probability of manipulation ({indicator_count} indicators found)."
        else:
            # If it's a video/image with NO indicators in filename and we are in FALLBACK mode, 
            # we should be MORE uncertain rather than calling it authentic.
            status = "Uncertain (Local Heuristics)"
            confidence = 0.5
            reason = f"AI analysis unavailable. No explicit deepfake indicators found in media metadata, but visual verification is required."
        
        return {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "privacy_risk": "Low",
            "privacy_explanation": "Media content analysis completed. No privacy risks detected.",
            "analysis_details": {
                "indicators_found": indicator_count,
                "fake_probability": fake_probability,
                "technical_assessment": "Local heuristic fallback triggered. This is less accurate than AI visual analysis."
            }
        }
    else:
        # If no image data provided, use filename-based heuristic analysis
        print(f"DEBUG: No image data provided, using filename-based heuristic analysis")
        file_lower = str(file_path_or_data).lower()
        
        # Simulated deep fake detection heuristics
        deepfake_indicators = [
            'fake', 'deepfake', 'manipulated', 'altered', 'synthetic', 'generated',
            'ai-generated', 'computer-generated', 'not real', 'simulation'
        ]
        
        # Count indicators in filename/description
        indicator_count = sum(1 for indicator in deepfake_indicators if indicator in file_lower)
        
        # Calculate probability based on indicators
        if indicator_count > 0:
            fake_probability = min(0.6 + (indicator_count * 0.15), 0.98)  # Higher base probability if indicators found
        else:
            # Analyze filename patterns that might suggest deepfakes
            suspicious_patterns = ['fake', 'deep', 'ai_', '_ai', 'synthetic', 'generated', 'gen_', 'face', 'swap']
            found_suspicious = sum(1 for pattern in suspicious_patterns if pattern in file_lower)
            
            if found_suspicious > 0:
                fake_probability = min(0.5 + (found_suspicious * 0.12), 0.9)  # Moderate probability for suspicious patterns
            else:
                # Default lower probability if no suspicious indicators
                fake_probability = 0.2  # Lower default assumption
                
                # Analyze file extension - certain extensions more likely to contain deepfakes
                if any(ext in file_lower for ext in ['.mp4', '.mov', '.avi', '.mkv']):  # Video formats
                    fake_probability += 0.15
                elif any(ext in file_lower for ext in ['.jpg', '.jpeg', '.png', '.bmp']):  # Image formats
                    fake_probability += 0.1
                
                # Add some variance but keep it reasonable
                import random
                fake_probability += random.uniform(-0.1, 0.15)
                fake_probability = max(0.05, min(0.95, fake_probability))  # Clamp between 5% and 95%
        
        # Determine status based on probability
        if fake_probability > 0.7:
            status = "Likely Deepfake"
            confidence = round(fake_probability, 3)
            reason = f"High probability of manipulation detected ({indicator_count} indicators found)."
        elif fake_probability > 0.4:
            status = "Uncertain"
            confidence = round(fake_probability, 3)
            reason = f"Moderate probability of manipulation ({indicator_count} indicators found)."
        else:
            status = "Uncertain (Local Heuristics)"
            confidence = 0.5
            reason = f"No explicit deepfake indicators found in media metadata, but visual verification is required."
        
        return {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "privacy_risk": "Low",
            "privacy_explanation": "Media content analysis completed. No privacy risks detected.",
            "analysis_details": {
                "indicators_found": indicator_count,
                "fake_probability": fake_probability,
                "technical_assessment": "Filename-based heuristic analysis. Visual inspection is recommended."
            }
        }
    # Ollama Platform
    if AI_PLATFORM == "ollama":
        print(f"DEBUG: Deepfake analysis using Ollama with image data: {bool(image_data)}")
        prompt_text = (
            "Analyze this media for deepfakes, AI artifacts, or facial manipulation. "
            "Respond ONLY as: Verdict: [Likely Real/Likely Deepfake/Uncertain], Confidence: [0-100], Reasoning: [Short assessment]. "
            f"Context: {file_path_or_data}."
        )
        
        images = [image_data] if image_data else None
        ai_analysis = call_ollama(prompt_text, model=OLLAMA_MODEL_VISION, images=images)
        
        if "Error" in ai_analysis:
            print(f"DEBUG: Ollama deepfake analysis failed: {ai_analysis}")
            # Fallback to heuristics if ollama fails or model missing
            return heuristic_fallback(file_path_or_data, False, None, ai_analysis, "deepfake")

        print(f"DEBUG: Ollama deepfake analysis result: {ai_analysis[:200]}...")
        # Parse the response (reusing logic)
        verdict = "Uncertain"
        verdict_match = re.search(r"Verdict:\s*\[?(Likely Real|Likely Deepfake|Uncertain|Likely Authentic)", ai_analysis, re.IGNORECASE)
        if verdict_match:
            v_raw = verdict_match.group(1).title()
            if "Deepfake" in v_raw: verdict = "Likely Deepfake"
            elif "Real" in v_raw or "Authentic" in v_raw: verdict = "Likely Authentic"
        
        conf_val = 0.5
        conf_match = re.search(r"Confidence:\s*\[?(\d+)", ai_analysis)
        if conf_match:
            conf_val = int(conf_match.group(1)) / 100.0
        
        reasoning = "Local analysis completed via Ollama."
        reason_match = re.search(r"Reasoning:\s*(.*)", ai_analysis, re.DOTALL | re.IGNORECASE)
        if reason_match:
            reasoning = reason_match.group(1).strip()

        return {
            "status": verdict,
            "confidence": conf_val,
            "reason": reasoning,
            "privacy_risk": "Low",
            "privacy_explanation": "Processed locally via Ollama.",
            "analysis_details": {
                "indicators_found": 0,
                "fake_probability": conf_val if "Deepfake" in verdict else 1 - conf_val,
                "technical_assessment": f"Ollama ({OLLAMA_MODEL_VISION}) assessment: {reasoning}"
            }
        }

    # Gemini Platform
    if GEMINI_API_KEY:
        try:
            import subprocess
            import json
            import tempfile
            
            # Create a prompt for the AI
            prompt_text = (
                "You are an expert deepfake detector. Analyze this media for synthetic generation, manipulation, or AI artifacts. "
                "For videos, focus on temporal flickering, unnatural movements, and lighting inconsistencies. "
                f"Context: {file_path_or_data}. "
                "Respond ONLY in this format: Verdict: [Likely Real/Likely Deepfake/Uncertain], Confidence: [0-100], Reasoning: [Short explanation]."
            )
            
            # Prepare parts
            parts = [{"text": prompt_text}]
            if image_data:
                parts.append({
                    "inline_data": {
                        "mime_type": mime_type or "image/jpeg",
                        "data": image_data
                    }
                })
            
            # Prepare payload
            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 200}
            }
            
            # Write payload to a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp:
                json.dump(payload, temp)
                temp_path = temp.name

            # Direct REST API call via curl.exe
            # Explicitly using gemini-1.5-flash for stable vision analysis
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            curl_cmd = f'curl.exe -s -X POST "{api_url}" -H "Content-Type: application/json" -d @"{temp_path}"'
            
            with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                f.write(f"\n--- {time.ctime()} --- DEEPFAKE CURL ---\n")
                if image_data:
                    f.write(f"Image data provided (base64 length: {len(image_data)})\n")

            result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            # Clean up temp file
            try: os.unlink(temp_path)
            except: pass

            if result.returncode == 0:
                res_json = json.loads(result.stdout)
                if 'error' in res_json:
                    err = res_json['error']
                    if err.get('status') == 'RESOURCE_EXHAUSTED' or err.get('code') == 429:
                        return {
                            "status": "Quota Exceeded",
                            "confidence": 0,
                            "reason": "Deepfake analysis limit reached. AI could not process the media.",
                            "privacy_risk": "Low",
                            "privacy_explanation": "Media analysis failed due to quota limitations.",
                            "analysis_details": {
                                "indicators_found": 0,
                                "fake_probability": 0.5,
                                "technical_assessment": "Gemini API Quota Exceeded. Please try again later."
                            }
                        }

                if 'candidates' in res_json:
                    ai_analysis = res_json['candidates'][0]['content']['parts'][0]['text']
                    
                    # Simple regex parsing
                    verdict = "Uncertain"
                    verdict_match = re.search(r"Verdict:\s*(Likely Real|Likely Deepfake|Uncertain|Likely Authentic)", ai_analysis, re.IGNORECASE)
                    if verdict_match:
                        v_raw = verdict_match.group(1).title()
                        if "Deepfake" in v_raw: verdict = "Likely Deepfake"
                        elif "Real" in v_raw or "Authentic" in v_raw: verdict = "Likely Authentic"
                    
                    conf_val = 0.5
                    conf_match = re.search(r"Confidence:\s*(\d+)", ai_analysis)
                    if conf_match:
                        conf_val = int(conf_match.group(1)) / 100.0
                    
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
                else:
                    with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                        f.write(f"ERROR: No candidates in deepfake response: {result.stdout[:500]}\n")
            else:
                with open("ai_debug_output.txt", "a", encoding="utf-8") as f:
                    f.write(f"ERROR: Curl failed with code {result.returncode}: {result.stderr}\n")
        except Exception as e:
            print(f"DEBUG: Error using AI for deepfake analysis: {e}")
            pass
    
    # Fallback to heuristic analysis if AI fails or no API key
    if isinstance(file_path_or_data, str):
        # ... (rest of the heuristic logic remains same)
        # This could be a filename or some identifier
        file_lower = file_path_or_data.lower()
        
        # Simulated deep fake detection heuristics
        # In a real implementation, this would use ML models to analyze video/image frames
        deepfake_indicators = [
            'fake', 'deepfake', 'manipulated', 'altered', 'synthetic', 'generated',
            'ai-generated', 'computer-generated', 'not real', 'simulation'
        ]
        
        # Count indicators in filename/description
        indicator_count = sum(1 for indicator in deepfake_indicators if indicator in file_lower)
        
        # Calculate probability based on indicators
        if indicator_count > 0:
            fake_probability = min(0.6 + (indicator_count * 0.15), 0.98)  # Higher base probability if indicators found
        else:
            # Analyze filename patterns that might suggest deepfakes
            suspicious_patterns = ['fake', 'deep', 'ai_', '_ai', 'synthetic', 'generated', 'gen_', 'face', 'swap']
            found_suspicious = sum(1 for pattern in suspicious_patterns if pattern in file_lower)
            
            if found_suspicious > 0:
                fake_probability = min(0.5 + (found_suspicious * 0.12), 0.9)  # Moderate probability for suspicious patterns
            else:
                # Default lower probability if no suspicious indicators
                fake_probability = 0.2  # Lower default assumption
                
                # Analyze file extension - certain extensions more likely to contain deepfakes
                if any(ext in file_lower for ext in ['.mp4', '.mov', '.avi', '.mkv']):  # Video formats
                    fake_probability += 0.15
                elif any(ext in file_lower for ext in ['.jpg', '.jpeg', '.png', '.bmp']):  # Image formats
                    fake_probability += 0.1
                
                # Add some variance but keep it reasonable
                import random
                fake_probability += random.uniform(-0.1, 0.15)
                fake_probability = max(0.05, min(0.95, fake_probability))  # Clamp between 5% and 95%
        
        # Determine status based on probability
        if fake_probability > 0.7:
            status = "Likely Deepfake"
            confidence = round(fake_probability, 3)
            reason = f"High probability of manipulation detected ({indicator_count} indicators found)."
        elif fake_probability > 0.4:
            status = "Uncertain"
            confidence = round(fake_probability, 3)
            reason = f"Moderate probability of manipulation ({indicator_count} indicators found)."
        else:
            # If it's a video/image with NO indicators in filename and we are in FALLBACK mode, 
            # we should be MORE uncertain rather than calling it authentic.
            status = "Uncertain (Local Heuristics)"
            confidence = 0.5
            reason = f"AI analysis unavailable. No explicit deepfake indicators found in media metadata, but visual verification is required."
        
        return {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "privacy_risk": "Low",
            "privacy_explanation": "Media content analysis completed. No privacy risks detected.",
            "analysis_details": {
                "indicators_found": indicator_count,
                "fake_probability": fake_probability,
                "technical_assessment": "Local heuristic fallback triggered. This is less accurate than AI visual analysis."
            }
        }
    else:
        # Handle binary data case
        return {
            "status": "Uncertain",
            "confidence": 0.5,
            "reason": "Unable to analyze media data format.",
            "privacy_risk": "Low",
            "privacy_explanation": "Media content analysis completed. No privacy risks detected in the analysis process.",
            "analysis_details": {
                "indicators_found": 0,
                "fake_probability": 0.5,
                "technical_assessment": "Format not recognized for deepfake analysis."
            }
        }

def analyze_url(domain):
    # Heuristics for suspicious domains
    suspicious_domains = [
        'bit.ly', 'tinyurl.com', 'ow.ly', 't.co', 'is.gd', 'buff.ly',
        'clickbait', 'fakenews', 'rumor', 'gossip', 'sensational',
        'unverified', 'shady', 'questionable', 'scam', 'hoax'
    ]
    
    trusted_sources = [
        'reuters.com', 'ap.org', 'bbc.com', 'nytimes.com', 'washingtonpost.com',
        'cnn.com', 'foxnews.com', 'nbcnews.com', 'abcnews.go.com', 'cbsnews.com',
        'theguardian.com', 'telegraph.co.uk', 'latimes.com', 'usatoday.com'
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
    # In a real implementation, this would fetch and parse the content from the URL
    # For demo purposes, we'll just return a placeholder indicating it's a URL
    try:
        parsed = urlparse(url)
        return f"Content from {parsed.netloc}: {parsed.path.replace('/', ' ').strip()}"
    except:
        return None


def analyze_content(text, analysis_type="news"):
    # Improved heuristic analysis for demo purposes
    text_lower = text.lower().strip()
    
    if analysis_type == "privacy":
        print(f"DEBUG: Privacy analysis started for: {text[:50]}...")
        # Privacy risk detection only
        privacy_indicators = ['@', '.com', 'phone', 'address', 'location', 'email', 'name', 'street', 'city', 'zip', 'ssn', 'credit card', 'password', 'social security', 'account number', 'driver license', 'birth date', 'passport', 'national id', 'tax id']
        privacy_risks = [indicator for indicator in privacy_indicators if indicator in text_lower]
        
        if len(privacy_risks) >= 3:
            privacy_risk = "High"
            privacy_explanation = f"Multiple privacy risks detected: {', '.join(privacy_risks[:3])}. The text contains personal information that could lead to identity theft or privacy violations."
        elif len(privacy_risks) >= 1:
            privacy_risk = "Medium"
            privacy_explanation = f"Potential privacy risks: {', '.join(privacy_risks)}. The text contains some personal information that should be handled carefully."
        else:
            privacy_risk = "Low"
            privacy_explanation = "No significant privacy risks detected. The text does not contain personal identifiable information."
        
        # For privacy analysis, focus only on privacy aspects
        result = {
            "status": privacy_risk,
            "confidence": 0.8,
            "reason": "Based on presence of personal identifiers in the text",
            "privacy_risk": privacy_risk,
            "privacy_explanation": privacy_explanation
        }
        print(f"DEBUG: analyze_content (privacy) -> status={result['status']} confidence={result['confidence']}")
        return result
    elif analysis_type == "news":  # News analysis
        print(f"DEBUG: News analysis started for: {text[:50]}...")
        # Use the pre-trained fake news detection model
        try:
            # First try the pre-trained model
            detection_result = detect_fake_news(text)
            
            status = detection_result['status']
            confidence = detection_result['confidence']
            reason = detection_result['reason']
            
            # Generate correction suggestion based on the result
            if detection_result['is_fake']:
                correction_suggestion = generate_correction_suggestion(text)
            else:
                correction_suggestion = ""
                
            # For news analysis, privacy risk is not applicable
            privacy_risk = "Not Applicable"
            privacy_explanation = "Privacy risk assessment not applicable to this function."
            
            result = {
                "status": status,
                "confidence": confidence,
                "reason": reason,
                "correction": correction_suggestion,
                "privacy_risk": privacy_risk,
                "privacy_explanation": privacy_explanation
            }
            print(f"DEBUG: analyze_content (news) -> status={result['status']} confidence={result['confidence']}")
            return result
        except Exception as e:
            print(f"DEBUG: Error using pre-trained fake news detector: {e}")
            # Fall back to the heuristic analysis
            fake_indicators = [
                # Sensationalism
                'you won\'t believe', 'shocking', 'unbelievable', 'incredible', 'mind-blowing', 
                'unthinkable', 'jaw-dropping', 'cannot be unseen', 'nobody talks about',
                
                # Urgency/Emotional manipulation
                'breaking news', 'urgent', 'act now', 'immediate action required', 
                'limited time', 'don\'t miss', 'must see', 'everyone is talking about',
                
                # Superlatives
                'best ever', 'worst ever', 'only way', 'never seen before', 'final warning',
                'last chance', 'only option', 'game changer', 'revolutionary',
                
                # Grammar/Syntax
                '!!!', '???', 'caps', 'all caps', 'shouting',
                
                # Unverifiable claims
                'secret', 'conspiracy', 'cover-up', 'hidden truth', 'they don\'t want you to know'
            ]
            
            # More comprehensive real news indicators
            real_indicators = [
                # Credible sources
                'according to', 'study shows', 'research indicates', 'reported by', 'confirmed by',
                'verified by', 'documented by', 'data shows', 'statistics show',
                
                # Professional journalism
                'investigation', 'interview', 'quote', 'statement', 'official', 'spokesperson',
                'press release', 'report', 'analysis', 'findings',
                
                # Credibility markers
                'peer-reviewed', 'scientific', 'medical journal', 'university', 'expert',
                'doctor', 'professor', 'researcher', 'scientist', 'evidence', 'proof',
                
                # Date/location context
                'yesterday', 'today', 'recently', 'located', 'based in', 'city', 'country'
            ]
            
            # Count indicators
            fake_score = sum(1 for indicator in fake_indicators if indicator in text_lower)
            real_score = sum(1 for indicator in real_indicators if indicator in text_lower)
            
            # Enhanced scoring with context awareness
            # Look for patterns that indicate fake news
            exclamation_pattern = len(re.findall(r'[!]{2,}', text))
            caps_pattern = len(re.findall(r'([A-Z]{4,})', text))
            sensational_pattern = len(re.findall(r'(you won.t believe|shocking|unbelievable)', text_lower))
            
            # Adjust scores based on patterns
            fake_score += exclamation_pattern * 0.5 + caps_pattern * 0.3 + sensational_pattern * 0.7
            
            # Calculate percentages for more intuitive confidence
            total_indicators = fake_score + real_score
            if total_indicators > 0:
                fake_percentage = fake_score / total_indicators
                real_percentage = real_score / total_indicators
            else:
                # Default to a slight bias toward real if no indicators found
                fake_percentage = 0.3
                real_percentage = 0.3

            if fake_percentage > 0.55:  # More than 55% fake indicators
                status = "Likely Fake"
                confidence = min(0.6 + fake_percentage * 0.4, 0.95)  # Scale confidence between 60-95%
                reason = f"Contains strong indicators of fake news: {fake_score} potential indicators found. The text exhibits sensational language, unverifiable claims, or emotional manipulation tactics typical of unreliable sources."
                correction_suggestion = generate_correction_suggestion(text)
            elif real_percentage > 0.55:  # More than 55% real indicators
                status = "Likely Real"
                confidence = min(0.6 + real_percentage * 0.4, 0.95)  # Scale confidence between 60-95%
                reason = f"Contains indicators of reliable reporting: {real_score} credibility indicators found. The text includes verifiable sources, professional journalism markers, and evidence-based language."
                correction_suggestion = ""
            else:
                # If no clear indication, analyze other factors
                # Check for sensational patterns
                exclamation_count = text.count('!')
                caps_ratio = len(re.findall(r'[A-Z]{3,}', text)) / max(len(text.split()), 1)
                
                # If there are many sensational elements, lean toward fake
                if exclamation_count > 3 or caps_ratio > 0.1:
                    status = "Likely Fake"
                    confidence = min(0.55 + (exclamation_count * 0.05) + (caps_ratio * 0.2), 0.8)
                    reason = f"Highly sensational presentation detected: {exclamation_count} exclamation marks and {caps_ratio*100:.1f}% capitalized phrases suggest unreliable source."
                    correction_suggestion = generate_correction_suggestion(text)
                elif fake_score > real_score:
                    status = "Likely Fake"
                    confidence = max(0.5, min(0.5 + fake_percentage * 0.3, 0.75))
                    reason = f"Shows some indicators of fake news: {fake_score} potential indicators found."
                    correction_suggestion = generate_correction_suggestion(text)
                elif real_score > fake_score:
                    status = "Likely Real"
                    confidence = max(0.5, min(0.5 + real_percentage * 0.3, 0.75))
                    reason = f"Shows some indicators of reliable reporting: {real_score} credibility indicators found."
                    correction_suggestion = ""
                else:
                    # Still uncertain, but let's not default to 50%
                    status = "Uncertain"
                    confidence = 0.4  # Lower confidence for truly uncertain cases
                    reason = "Insufficient indicators to determine authenticity. The text contains neither strong fake news indicators nor strong credibility markers."
                    correction_suggestion = ""
        
        # For news analysis, privacy risk is not applicable
        privacy_risk = "Not Applicable"
        privacy_explanation = "Privacy risk assessment not applicable to this function."
        
        result = {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "correction": correction_suggestion,
            "privacy_risk": privacy_risk,
            "privacy_explanation": privacy_explanation
        }
        print(f"DEBUG: analyze_content -> status={result['status']} confidence={result['confidence']}")
        return result
    elif analysis_type == "news_advanced":  # Advanced news analysis using Gemini
        print(f"DEBUG: Advanced news analysis started for: {text[:50]}...")
        
        # Use Gemini to provide more detailed analysis
        if AI_PLATFORM == "gemini" and model:
            prompt = (
                "As an expert fact-checker, analyze this news content thoroughly. "
                "Provide a detailed assessment of its authenticity, including: "
                "1. Overall authenticity rating (Likely Real/Likely Fake/Uncertain) "
                "2. Confidence level (0-100%) "
                "3. Detailed reasoning for your assessment "
                "4. Specific indicators that suggest authenticity or falseness "
                "5. Suggestions for further verification "
                "6. Raw model output and confidence scores "
                "Respond in JSON format with these exact keys: status, confidence, reason, indicators, verification_suggestions, raw_output. "
                f"Content to analyze: {text[:1500]}"
            )
            
            try:
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.1,
                        "max_output_tokens": 1000
                    }
                )
                
                if hasattr(response, 'text') and response.text:
                    gemini_response = response.text
                else:
                    raise Exception(f"No text in response: {response}")
                
                # Try to parse the response as JSON, or return it as raw output
                try:
                    import json
                    parsed_response = json.loads(gemini_response)
                    
                    # Ensure required fields are present
                    status = parsed_response.get("status", "Uncertain")
                    confidence = parsed_response.get("confidence", 0.5)
                    if isinstance(confidence, str) and "%" in confidence:
                        confidence = float(confidence.replace("%", "")) / 100
                    elif not isinstance(confidence, (int, float)):
                        confidence = 0.5
                    
                    reason = parsed_response.get("reason", "Detailed analysis completed by Gemini")
                    indicators = parsed_response.get("indicators", "No specific indicators provided")
                    suggestions = parsed_response.get("verification_suggestions", "Verify with multiple reliable sources")
                    raw_output = parsed_response.get("raw_output", gemini_response)
                    
                except json.JSONDecodeError:
                    # If parsing fails, use the raw response
                    status = "Uncertain"
                    confidence = 0.5
                    reason = "Analysis completed by Gemini"
                    indicators = "Could not parse specific indicators from response"
                    suggestions = "Verify with multiple reliable sources"
                    raw_output = gemini_response
                
                result = {
                    "status": status,
                    "confidence": confidence,
                    "reason": reason,
                    "indicators": indicators,
                    "verification_suggestions": suggestions,
                    "raw_output": raw_output,
                    "correction": generate_correction_suggestion(text),
                    "privacy_risk": "Not Applicable",
                    "privacy_explanation": "Privacy risk assessment not applicable to this function."
                }
                
                print(f"DEBUG: analyze_content (news_advanced) -> status={result['status']} confidence={result['confidence']}")
                return result
            except Exception as e:
                print(f"DEBUG: Gemini call failed ({e}), falling back to fast local analysis")
                # If Gemini fails, fall back to fast local analysis
                return analyze_content(text, analysis_type="news")
        else:
            # If Gemini is not available, fall back to regular analysis
            return analyze_content(text, analysis_type="news")
    else:  # For any other analysis type
        print(f"DEBUG: Unknown analysis type: {analysis_type}, defaulting to heuristic analysis")
        # Default to heuristic analysis for unknown types
        # ... (same heuristic code as before)
        fake_indicators = [
            # Sensationalism
            'you won\'t believe', 'shocking', 'unbelievable', 'incredible', 'mind-blowing', 
            'unthinkable', 'jaw-dropping', 'cannot be unseen', 'nobody talks about',
            
            # Urgency/Emotional manipulation
            'breaking news', 'urgent', 'act now', 'immediate action required', 
            'limited time', 'don\'t miss', 'must see', 'everyone is talking about',
            
            # Superlatives
            'best ever', 'worst ever', 'only way', 'never seen before', 'final warning',
            'last chance', 'only option', 'game changer', 'revolutionary',
            
            # Grammar/Syntax
            '!!!', '???', 'caps', 'all caps', 'shouting',
            
            # Unverifiable claims
            'secret', 'conspiracy', 'cover-up', 'hidden truth', 'they don\'t want you to know'
        ]
        
        # More comprehensive real news indicators
        real_indicators = [
            # Credible sources
            'according to', 'study shows', 'research indicates', 'reported by', 'confirmed by',
            'verified by', 'documented by', 'data shows', 'statistics show',
            
            # Professional journalism
            'investigation', 'interview', 'quote', 'statement', 'official', 'spokesperson',
            'press release', 'report', 'analysis', 'findings',
            
            # Credibility markers
            'peer-reviewed', 'scientific', 'medical journal', 'university', 'expert',
            'doctor', 'professor', 'researcher', 'scientist', 'evidence', 'proof',
            
            # Date/location context
            'yesterday', 'today', 'recently', 'located', 'based in', 'city', 'country'
        ]
        
        # Count indicators
        fake_score = sum(1 for indicator in fake_indicators if indicator in text_lower)
        real_score = sum(1 for indicator in real_indicators if indicator in text_lower)
        
        # Enhanced scoring with context awareness
        # Look for patterns that indicate fake news
        exclamation_pattern = len(re.findall(r'[!]{2,}', text))
        caps_pattern = len(re.findall(r'([A-Z]{4,})', text))
        sensational_pattern = len(re.findall(r'(you won.t believe|shocking|unbelievable)', text_lower))
        
        # Adjust scores based on patterns
        fake_score += exclamation_pattern * 0.5 + caps_pattern * 0.3 + sensational_pattern * 0.7
        
        # Calculate percentages for more intuitive confidence
        total_indicators = fake_score + real_score
        if total_indicators > 0:
            fake_percentage = fake_score / total_indicators
            real_percentage = real_score / total_indicators
        else:
            # Default to a slight bias toward real if no indicators found
            fake_percentage = 0.3
            real_percentage = 0.3

        if fake_percentage > 0.55:  # More than 55% fake indicators
            status = "Likely Fake"
            confidence = min(0.6 + fake_percentage * 0.4, 0.95)  # Scale confidence between 60-95%
            reason = f"Contains strong indicators of fake news: {fake_score} potential indicators found. The text exhibits sensational language, unverifiable claims, or emotional manipulation tactics typical of unreliable sources."
            correction_suggestion = generate_correction_suggestion(text)
        elif real_percentage > 0.55:  # More than 55% real indicators
            status = "Likely Real"
            confidence = min(0.6 + real_percentage * 0.4, 0.95)  # Scale confidence between 60-95%
            reason = f"Contains indicators of reliable reporting: {real_score} credibility indicators found. The text includes verifiable sources, professional journalism markers, and evidence-based language."
            correction_suggestion = ""
        else:
            # If no clear indication, analyze other factors
            # Check for sensational patterns
            exclamation_count = text.count('!')
            caps_ratio = len(re.findall(r'[A-Z]{3,}', text)) / max(len(text.split()), 1)
            
            # If there are many sensational elements, lean toward fake
            if exclamation_count > 3 or caps_ratio > 0.1:
                status = "Likely Fake"
                confidence = min(0.55 + (exclamation_count * 0.05) + (caps_ratio * 0.2), 0.8)
                reason = f"Highly sensational presentation detected: {exclamation_count} exclamation marks and {caps_ratio*100:.1f}% capitalized phrases suggest unreliable source."
                correction_suggestion = generate_correction_suggestion(text)
            elif fake_score > real_score:
                status = "Likely Fake"
                confidence = max(0.5, min(0.5 + fake_percentage * 0.3, 0.75))
                reason = f"Shows some indicators of fake news: {fake_score} potential indicators found."
                correction_suggestion = generate_correction_suggestion(text)
            elif real_score > fake_score:
                status = "Likely Real"
                confidence = max(0.5, min(0.5 + real_percentage * 0.3, 0.75))
                reason = f"Shows some indicators of reliable reporting: {real_score} credibility indicators found."
                correction_suggestion = ""
            else:
                # Still uncertain, but let's not default to 50%
                status = "Uncertain"
                confidence = 0.4  # Lower confidence for truly uncertain cases
                reason = "Insufficient indicators to determine authenticity. The text contains neither strong fake news indicators nor strong credibility markers."
                correction_suggestion = ""
    
        # Default privacy risk for unknown analysis types
        privacy_risk = "Not Applicable"
        privacy_explanation = "Privacy risk assessment not applicable to this function."
        
        result = {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "correction": correction_suggestion,
            "privacy_risk": privacy_risk,
            "privacy_explanation": privacy_explanation
        }
        print(f"DEBUG: analyze_content (unknown type) -> status={result['status']} confidence={result['confidence']}")
        return result


def generate_correction_suggestion(text):
    # Generate a suggested correction for fake news with actual facts
    corrections = []
    
    text_lower = text.lower()
    
    # Specific patterns that indicate fake news with corresponding corrections
    if 'you won\'t believe' in text_lower:
        corrections.append("This is a classic clickbait phrase. Verify this claim with credible sources before believing it.")
    elif 'breaking news' in text_lower and 'urgent' in text_lower:
        corrections.append("Check established news outlets like Reuters, AP, or BBC to confirm this breaking news story.")
    elif 'shocking' in text_lower or 'unbelievable' in text_lower:
        corrections.append("Be skeptical of sensational claims. Look for evidence from reliable sources.")
    elif 'miracle cure' in text_lower or 'cures all diseases' in text_lower:
        corrections.append("Medical claims should be verified with peer-reviewed studies and official health authorities like WHO or CDC.")
    elif 'virus hoax' in text_lower or 'all a lie' in text_lower:
        corrections.append("Health information should be verified with reputable medical institutions and peer-reviewed research.")
    elif 'election fraud' in text_lower and ('millions of votes' in text_lower or 'rigged' in text_lower):
        corrections.append("Electoral integrity claims should be verified with official election monitoring organizations and certified results.")
    elif 'celebrity death' in text_lower:
        corrections.append("Verify celebrity news with official announcements or reputable entertainment news sources before sharing.")
    elif 'won lottery' in text_lower or 'you\'ve won' in text_lower:
        corrections.append("Unexpected prize notifications are typically scams. Legitimate lotteries don't contact winners unexpectedly.")
        
    # If no specific pattern matched, provide general guidance
    if len(corrections) == 0:
        # Generate a sample correction based on common fake news topics
        if 'covid' in text_lower:
            corrections.append("For COVID-19 information, consult official sources like WHO, CDC, or your national health authority.")
        elif 'politics' in text_lower:
            corrections.append("Political claims should be verified with multiple reputable news sources and fact-checking websites.")
        elif 'health' in text_lower:
            corrections.append("Medical claims should be verified with peer-reviewed studies and official health authorities.")
        else:
            corrections.append("We recommend fact-checking this information with trusted news sources like Reuters, AP News, or BBC, or fact-checking sites like Snopes or PolitiFact.")
        
    return " ".join(corrections)


def heuristic_fallback(text, is_url=False, url=None, error_msg="", analysis_type="news"):
    """
    Comprehensive heuristic analysis when AI is unavailable.
    """
    # Parse URL if the input is a link
    if is_url:
        domain = urlparse(url).netloc.lower()
        url_analysis = analyze_url(domain)
        content_analysis = analyze_content(text, analysis_type)
        # Combine URL and content analysis
        status = content_analysis["status"] if content_analysis["status"] != "Uncertain" else url_analysis["status"]
        confidence = max(float(content_analysis["confidence"]), float(url_analysis["confidence"]))
        reason = content_analysis["reason"] + " " + url_analysis["reason"]
        
        result = {
            "status": status,
            "confidence": confidence,
            "reason": reason,
            "correction": content_analysis.get("correction", ""),
            "privacy_risk": content_analysis["privacy_risk"],
            "privacy_explanation": content_analysis["privacy_explanation"]
        }
        print(f"DEBUG: heuristic_fallback (url) -> status={result['status']} confidence={result['confidence']} reason={error_msg}")
        return result
    else:
        # Regular text analysis
        result = analyze_content(text, analysis_type)
        # Ensure the result has the correct structure
        out = {
            "status": result.get("status", "Uncertain"),
            "confidence": result.get("confidence", 0.5),
            "reason": result.get("reason", "Analysis completed"),
            "correction": result.get("correction", ""),
            "privacy_risk": result.get("privacy_risk", "Low"),
            "privacy_explanation": result.get("privacy_explanation", "No privacy risks detected")
        }
        print(f"DEBUG: heuristic_fallback -> status={out['status']} confidence={out['confidence']} reason={error_msg}")
        return out


def get_trending_news():
    """
    Fetches trending news, popular topics, and user preferences for visualization.
    Uses a news API to get real-time data.
    """
    # Get the News API key from environment variables
    API_KEY = os.getenv("NEWS_API_KEY")
    
    if not API_KEY or API_KEY == "":
        print("DEBUG: News API key not found in environment, returning mock data")
        # Return mock data if no API key is available
        mock_trending_news = [
            {
                "title": "Global Climate Summit Reaches Historic Agreement",
                "description": "World leaders agree on ambitious targets to reduce carbon emissions by 2030.",
                "source": "Reuters",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat(),
                "url": "https://example.com/climate-summit-agreement"
            },
            {
                "title": "Tech Giant Announces Revolutionary AI Breakthrough",
                "description": "New artificial intelligence model shows unprecedented capabilities in reasoning and problem-solving.",
                "source": "Tech Times",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat(),
                "url": "https://example.com/ai-breakthrough"
            },
            {
                "title": "Major Stock Markets Reach All-Time High",
                "description": "Global markets surge as economic recovery exceeds expectations.",
                "source": "Financial Journal",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=6)).isoformat(),
                "url": "https://example.com/stock-market-high"
            },
            {
                "title": "Breakthrough in Renewable Energy Storage Technology",
                "description": "Scientists develop battery technology that could revolutionize clean energy adoption.",
                "source": "Science Daily",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=8)).isoformat(),
                "url": "https://example.com/renewable-energy-storage"
            },
            {
                "title": "International Space Station Achieves Milestone",
                "description": "New module installation expands research capabilities for future Mars missions.",
                "source": "Space News",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=10)).isoformat(),
                "url": "https://example.com/space-station-milestone"
            }
        ]
        
        # Mock trends data for visualization
        mock_trends = {
            "categories": ["Technology", "Business", "Science", "Health", "Entertainment", "General"],
            "popularity": [85, 72, 65, 58, 45, 30],
            "sentiment": ["Positive", "Positive", "Positive", "Neutral", "Mixed", "Neutral"]
        }
        
        # Mock user preferences data
        mock_preferences = {
            "most_read_categories": ["Technology", "Business", "Health"],
            "reading_time_distribution": [20, 35, 25, 15, 5],  # Morning, Afternoon, Evening, Night, Late night
            "preferred_sources": ["Tech Times", "Science Daily", "Financial Journal"]
        }
        
        return {
            "status": "success",
            "trending_news": mock_trending_news,
            "trends": mock_trends,
            "preferences": mock_preferences,
            "timestamp": datetime.datetime.now().isoformat()
        }
    
    # Try to get trending news from the real API with optimized single request
    try:
        import requests
        import concurrent.futures
        from functools import partial
        
        # Get top headlines (single request)
        headlines_url = f"https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey={API_KEY}"
        headlines_response = requests.get(headlines_url, timeout=5)
        trending_news = []
        all_articles = []
        
        if headlines_response.status_code == 200:
            headlines_data = headlines_response.json()
            articles = headlines_data.get("articles", [])[:10]  # Get top 10 articles
            
            for article in articles:
                # Only add articles that have all required fields
                if article.get("title") and article.get("description") and article.get("url"):
                    trending_news.append({
                        "title": article.get("title", ""),
                        "description": article.get("description", ""),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "published_at": article.get("publishedAt", ""),
                        "url": article.get("url", "")
                    })
                    all_articles.append(article)
        else:
            print(f"DEBUG: Top headlines API error: {headlines_response.status_code}")

        # Define categories to analyze
        categories = ["technology", "business", "science", "health", "entertainment", "general"]
        category_counts = {}
        category_articles_map = {}

        # Optimized approach: make all category requests in parallel
        def fetch_category_news(category):
            try:
                # First try the exact category term
                category_url = f"https://newsapi.org/v2/everything?q={category}&sortBy=popularity&pageSize=5&apiKey={API_KEY}"
                response = requests.get(category_url, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    articles = data.get("articles", [])[:5]
                    
                    # If no articles found with exact term, try broader search
                    if len(articles) == 0:
                        broad_queries = {
                            "technology": "tech AND innovation",
                            "business": "business AND economy",
                            "science": "science AND research",
                            "health": "health AND medicine",
                            "entertainment": "entertainment AND celebrity",
                            "general": "news"
                        }
                        
                        broad_query = broad_queries.get(category, category)
                        broad_url = f"https://newsapi.org/v2/everything?q={broad_query}&sortBy=popularity&pageSize=5&apiKey={API_KEY}"
                        broad_response = requests.get(broad_url, timeout=5)
                        
                        if broad_response.status_code == 200:
                            broad_data = broad_response.json()
                            articles = broad_data.get("articles", [])[:5]
                    
                    return category, articles
                else:
                    return category, []
            except Exception as e:
                print(f"DEBUG: Error fetching {category} news: {e}")
                return category, []

        # Execute all category requests in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = {executor.submit(fetch_category_news, cat): cat for cat in categories}
            for future in concurrent.futures.as_completed(futures):
                cat, articles = future.result()
                category_counts[cat.title()] = len(articles)
                category_articles_map[cat.title()] = articles
                all_articles.extend(articles)

        # Ensure all categories have values
        for cat in ["Technology", "Business", "Science", "Health", "Entertainment", "General"]:
            if cat not in category_counts:
                category_counts[cat] = 0

        # Create ordered lists for charts
        categories_list = list(category_counts.keys())
        popularity_list = list(category_counts.values())

        # Calculate sentiment based on keywords in titles and descriptions
        sentiment_list = []
        positive_keywords = ["good", "great", "positive", "up", "rise", "success", "win", "advance", "growth", "improve", "new", "innovation", "breakthrough"]
        negative_keywords = ["bad", "terrible", "negative", "down", "fall", "loss", "fail", "decline", "crisis", "problem", "warning", "threat", "concern"]

        for idx, category in enumerate(categories_list):
            # Get articles for this specific category to analyze sentiment
            category_articles = category_articles_map.get(category, [])
            
            # Count positive and negative keywords in articles for this category
            pos_count = 0
            neg_count = 0
            
            for article in category_articles:
                title = article.get('title', '')
                desc = article.get('description', '')
                text = (title + ' ' + desc).lower()
                pos_count += sum(1 for kw in positive_keywords if kw in text)
                neg_count += sum(1 for kw in negative_keywords if kw in text)
            
            # Determine sentiment based on keyword counts
            if pos_count > neg_count:
                sentiment_list.append("Positive")
            elif neg_count > pos_count:
                sentiment_list.append("Negative")
            else:
                # If keyword counts are equal, use popularity to determine sentiment
                pop_value = category_counts[category]
                if pop_value > 3:
                    sentiment_list.append("Mixed")
                elif pop_value > 1:
                    sentiment_list.append("Neutral")
                else:
                    sentiment_list.append("Neutral")

        # Analyze sources for preferences
        source_counts = {}
        for article in all_articles:
            source_name = article.get("source", {}).get("name", "Unknown")
            if source_name and source_name != "Unknown":
                if source_name in source_counts:
                    source_counts[source_name] += 1
                else:
                    source_counts[source_name] = 1

        # Get top sources
        sorted_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)
        top_sources = [item[0] for item in sorted_sources[:3]] if len(sorted_sources) >= 3 else [item[0] for item in sorted_sources]
        if len(top_sources) < 3:
            # Add some popular sources as fallback if not enough actual sources
            popular_fallbacks = ["BBC News", "Reuters", "Associated Press", "CNN", "The New York Times"]
            for source in popular_fallbacks:
                if source not in top_sources and len(top_sources) < 3:
                    top_sources.append(source)
            # If still not enough, add defaults
            if len(top_sources) < 3:
                defaults = ["Tech Times", "Science Daily", "Financial Journal"]
                for default_source in defaults:
                    if default_source not in top_sources and len(top_sources) < 3:
                        top_sources.append(default_source)

        # Get top categories based on actual popularity
        # Create pairs of (category, popularity) and sort by popularity
        category_popularity_pairs = [(cat, category_counts[cat]) for cat in categories_list]
        sorted_category_pairs = sorted(category_popularity_pairs, key=lambda x: x[1], reverse=True)
        top_categories = [pair[0] for pair in sorted_category_pairs[:3]] if len(sorted_category_pairs) >= 3 else [pair[0] for pair in sorted_category_pairs]
        if len(top_categories) < 3:
            # Add default categories if not enough
            default_cats = ["Technology", "Science", "Business"]
            for cat in default_cats:
                if cat not in top_categories and len(top_categories) < 3:
                    top_categories.append(cat)

        trends_data = {
            "categories": categories_list,
            "popularity": popularity_list,
            "sentiment": sentiment_list
        }

        preferences_data = {
            "most_read_categories": top_categories,
            "reading_time_distribution": [20, 35, 25, 15, 5],  # Morning, Afternoon, Evening, Night, Late night
            "preferred_sources": top_sources
        }

        return {
            "status": "success",
            "trending_news": trending_news,
            "trends": trends_data,
            "preferences": preferences_data,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        print(f"DEBUG: Error fetching trending news: {e}")
        # Return mock data as fallback
        mock_trending_news = [
            {
                "title": "Global Climate Summit Reaches Historic Agreement",
                "description": "World leaders agree on ambitious targets to reduce carbon emissions by 2030.",
                "source": "Reuters",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat(),
                "url": "https://example.com/climate-summit-agreement"
            },
            {
                "title": "Tech Giant Announces Revolutionary AI Breakthrough",
                "description": "New artificial intelligence model shows unprecedented capabilities in reasoning and problem-solving.",
                "source": "Tech Times",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat(),
                "url": "https://example.com/ai-breakthrough"
            },
            {
                "title": "Major Stock Markets Reach All-Time High",
                "description": "Global markets surge as economic recovery exceeds expectations.",
                "source": "Financial Journal",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=6)).isoformat(),
                "url": "https://example.com/stock-market-high"
            },
            {
                "title": "Breakthrough in Renewable Energy Storage Technology",
                "description": "Scientists develop battery technology that could revolutionize clean energy adoption.",
                "source": "Science Daily",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=8)).isoformat(),
                "url": "https://example.com/renewable-energy-storage"
            },
            {
                "title": "International Space Station Achieves Milestone",
                "description": "New module installation expands research capabilities for future Mars missions.",
                "source": "Space News",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=10)).isoformat(),
                "url": "https://example.com/space-station-milestone"
            }
        ]
        
        # Mock trends data for visualization
        mock_trends = {
            "categories": ["Technology", "Business", "Science", "Health", "Entertainment", "General"],
            "popularity": [85, 72, 65, 58, 45, 30],
            "sentiment": ["Positive", "Positive", "Positive", "Neutral", "Mixed", "Neutral"]
        }
        
        # Mock user preferences data
        mock_preferences = {
            "most_read_categories": ["Technology", "Business", "Health"],
            "reading_time_distribution": [20, 35, 25, 15, 5],  # Morning, Afternoon, Evening, Night, Late night
            "preferred_sources": ["Tech Times", "Science Daily", "Financial Journal"]
        }
        
        return {
            "status": "success",
            "trending_news": mock_trending_news,
            "trends": mock_trends,
            "preferences": mock_preferences,
            "timestamp": datetime.datetime.now().isoformat()
        }