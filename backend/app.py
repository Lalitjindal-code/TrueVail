import os
import requests
import random
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
import base64
import json
from datetime import datetime, timedelta

# --------------------
# App Initialization
# --------------------
app = Flask(__name__)

# Initialize Firebase Admin
try:
    # 1. Try Base64 Env Var (Best for Render/Vercel)
    firebase_creds_b64 = os.environ.get("FIREBASE_CREDENTIALS_BASE64")
    if firebase_creds_b64:
        print("🔐 Loading Firebase creds from Base64 Env Var...")
        cred_json = json.loads(base64.b64decode(firebase_creds_b64))
        cred = credentials.Certificate(cred_json)
    
    # 2. Try Local File (Best for Localhost)
    elif os.path.exists('firebase-service-account.json'):
        print("📂 Loading Firebase creds from local file...")
        cred = credentials.Certificate('firebase-service-account.json')
        
    else:
        raise FileNotFoundError("firebase-service-account.json not found and FIREBASE_CREDENTIALS_BASE64 not set.")

    firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin Initialized")
except Exception as e:
    print(f"⚠️ Firebase Admin Init Failed: {e}")

# Debug: Print loaded key status
print(f"DEBUG: NEWS_API_KEY Loaded? {bool(os.environ.get('NEWS_API_KEY'))}")

# --------------------
# Middleware: Verify Firebase Token
# --------------------
def verify_firebase_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized", "message": "Missing or invalid token"}), 401
        
        token = auth_header.split("Bearer ")[1]
        try:
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token # Attach user info to request
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Unauthorized", "message": f"Invalid token: {str(e)}"}), 401
    return decorated_function

# --------------------
# CORS Configuration
# --------------------
frontend_url = os.environ.get("FRONTEND_URL")

if frontend_url:
    CORS(app, resources={r"/*": {"origins": [frontend_url]}})
else:
    CORS(app, resources={r"/*": {"origins": "*"}})

# --------------------
# Environment Variables
# --------------------
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")

# --------------------
# Root Route
# --------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "ok",
        "service": "TrueVail Backend",
        "message": "Backend is running"
    }), 200


# --------------------
# Analyze Route
# --------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    if not request.is_json:
        return jsonify({
            "error": "Invalid request",
            "message": "Content-Type must be application/json"
        }), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    text = data.get("text")
    analysis_type = data.get("type", "news")
    image_data = data.get("image_data")
    mime_type = data.get("mime_type")

    if not text and not image_data:
        return jsonify({
            "error": "No input provided",
            "message": "Either 'text' or 'image_data' is required"
        }), 400

    try:
        from analyzer import analyze_news

        result = analyze_news(
            text=text,
            analysis_type=analysis_type,
            image_data=image_data,
            mime_type=mime_type
        )
        return jsonify(result), 200

    except Exception as e:
        print("ANALYZE ERROR:", str(e))
        return jsonify({
            "error": "Internal server error",
            "message": "Analysis failed"
        }), 500


# --------------------
# ✅ TRENDING NEWS (FIXED – WORKS ON FREE TIER)
# --------------------
# --------------------
# ✅ TRENDING NEWS (FIXED – WORKS ON FREE TIER)
# --------------------
def fetch_trending_news(topic="All", time_range="24h"):
    """
    Fetches trending threat news using NewsAPI with dynamic topic and time filtering.
    """
    api_key = os.environ.get("NEWS_API_KEY")
    if not api_key:
        print("❌ NEWS_API_KEY not set. Returning empty list.")
        return {"status": "error", "message": "API Key missing"}

    try:
        # 1. Construct Query
        # Base keywords for security threats
        base_query = "misinformation OR deepfake OR fake news OR cyberattack"
        
        # Topic Filtering
        topic_query = ""
        if topic and topic != "All":
            if topic == "Politics":
                topic_query = " AND (politics OR election OR democracy)"
            elif topic == "Finance":
                topic_query = " AND (finance OR crypto OR stock OR scam)"
            elif topic == "Technology": # 'Tech' or 'Technology' depending on frontend value
                topic_query = " AND (technology OR ai OR software)"
            elif topic == "Tech": # Handle both variations if needed
                topic_query = " AND (technology OR ai OR software)"
        
        final_query = f"({base_query}){topic_query}"
        
        # 2. Calculate Time Filter
        from_date = None
        now = datetime.utcnow()
        
        if time_range == "24h":
            from_date = (now - timedelta(days=1)).strftime('%Y-%m-%d')
        elif time_range == "7d":
            from_date = (now - timedelta(days=7)).strftime('%Y-%m-%d')
        elif time_range == "30d":
            from_date = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # 3. Request Parameters
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": final_query,
            "sortBy": "publishedAt",
            "language": "en",
            "pageSize": 10,
            "apiKey": api_key
        }
        
        if from_date:
            params["from"] = from_date

        print(f"🔍 Fetching NewsAPI: q='{final_query}' from='{from_date}'")

        r = requests.get(url, params=params, timeout=10)
        data = r.json()

        if data.get("status") == "ok":
            articles = []
            for a in data.get("articles", []):
                # Basic validation to skip removed content
                if a.get("title") == "[Removed]": continue
                
                articles.append({
                    "title": a.get("title"),
                    "description": a.get("description"),
                    "source": a.get("source", {}).get("name"),
                    "url": a.get("url"),
                    "published_at": a.get("publishedAt")
                })
            return {"status": "success", "trending_news": articles}
        
        print(f"❌ NewsAPI Error: {data.get('message')}")
        return {"status": "error", "message": data.get('message', 'Unknown error')}
        
    except Exception as e:
        print(f"❌ NewsAPI Connection Error: {e}")
        return {"status": "error", "message": str(e)}


@app.route("/trending-news", methods=["GET"])
def trending_news():
    result = fetch_trending_news()
    return jsonify(result), 200


@app.route("/api/news/trending", methods=["GET"])
def api_news_trending():
    # 1. Fetch raw news
    time_range = request.args.get("time", "24h")
    topic = request.args.get("topic", "All")
    print(f"DEBUG: api_news_trending received time={time_range}, topic={topic}")
    result = fetch_trending_news(topic=topic, time_range=time_range)
    
    if result.get("status") != "success":
        # Return empty list or error status causing frontend fallback
        return jsonify([]), 200

    raw_articles = result.get("trending_news", [])
    mapped_articles = []

    # 2. Map to Frontend Structure
    for article in raw_articles:
        # Mock logic for risk/trend since API doesn't provide it
        risk_score = random.randint(10, 95)
        risk_level = "High" if risk_score > 75 else ("Medium" if risk_score > 40 else "Low")
        
        mapped_articles.append({
            "id": str(uuid.uuid4()),
            "title": article.get("title", "Unknown Title"),
            "source": article.get("source", "Unknown Source"),
            "publishedAt": article.get("published_at", ""),
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "trendData": [random.randint(20, 100) for _ in range(7)],
            "url": article.get("url", "#")
        })

    return jsonify(mapped_articles), 200


# --------------------
# Health Checks
# --------------------
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route("/ready", methods=["GET"])
def readiness_check():
    return jsonify({"status": "ready"}), 200


@app.route("/api/history", methods=["GET"])
def api_history():
    # Return mock history for demo purposes since no DB is attached
    mock_history = [
        {"id": "1", "date": "2024-01-25T14:30:00", "type": "Fake News", "source": "article_draft_v2.txt", "score": 88, "status": "Malicious"},
        {"id": "2", "date": "2024-01-24T09:15:00", "type": "Deepfake", "source": "video_clip_01.mp4", "score": 15, "status": "Safe"},
        {"id": "3", "date": "2024-01-23T18:45:00", "type": "Phishing Link", "source": "http://suspicious-link.com", "score": 92, "status": "Malicious"},
        {"id": "4", "date": "2024-01-22T12:00:00", "type": "Privacy Scan", "source": "emails_export.csv", "score": 45, "status": "Misleading"},
        {"id": "5", "date": "2024-01-21T10:00:00", "type": "Fake News", "source": "rumor_mill.docx", "score": 72, "status": "Malicious"}
    ]
    return jsonify(mock_history), 200


# --------------------
# Error Handlers
# --------------------
@app.errorhandler(404)
def not_found(e):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"status": "error", "message": f"Internal server error: {str(e)}"}), 500


# --------------------
# Entry Point (Local only)
# --------------------
if __name__ == "__main__":
    # Use PORT env variable if present (for Render), else 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port,
        debug=False
    )
