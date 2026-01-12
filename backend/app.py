import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# --------------------
# App Initialization
# --------------------
app = Flask(__name__)

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
        # Lazy import (prevents boot crash)
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
# Trending News (REAL NewsAPI)
# --------------------
def fetch_trending_news():
    if not NEWS_API_KEY:
        return {
            "status": "error",
            "message": "NEWS_API_KEY missing"
        }

    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "country": "in",
        "pageSize": 10,
        "apiKey": NEWS_API_KEY
    }

    try:
        r = requests.get(url, params=params, timeout=5)
        data = r.json()

        if data.get("status") != "ok":
            return {
                "status": "error",
                "message": data.get("message", "NewsAPI error")
            }

        articles = []
        for a in data.get("articles", []):
            articles.append({
                "title": a.get("title"),
                "description": a.get("description"),
                "source": a.get("source", {}).get("name"),
                "url": a.get("url"),
                "published_at": a.get("publishedAt")
            })

        return {
            "status": "success",
            "trending_news": articles
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.route("/trending-news", methods=["GET"])
def trending_news():
    result = fetch_trending_news()
    return jsonify(result), 200


# --------------------
# Health Checks
# --------------------
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route("/ready", methods=["GET"])
def readiness_check():
    return jsonify({"status": "ready"}), 200


# --------------------
# Error Handlers
# --------------------
@app.errorhandler(404)
def not_found(_):
    return jsonify({
        "error": "Not Found",
        "message": "Endpoint does not exist"
    }), 404


# --------------------
# Entry Point (Local only)
# --------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
