import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# --------------------
# App Initialization
# --------------------
app = Flask(__name__)

# --------------------
# CORS Configuration
# --------------------
# Production-safe default:
# If FRONTEND_URL is provided → restrict
# Else → allow all (safe for APIs)
frontend_url = os.environ.get("FRONTEND_URL")

if frontend_url:
    CORS(app, resources={r"/*": {"origins": [frontend_url]}})
else:
    CORS(app, resources={r"/*": {"origins": "*"}})

# --------------------
# Routes
# --------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "ok",
        "service": "TrueVail Backend",
        "message": "Backend is running"
    }), 200


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
        # ✅ LAZY IMPORT — prevents boot-time crashes
        from analyzer import analyze_news

        result = analyze_news(
            text=text,
            analysis_type=analysis_type,
            image_data=image_data,
            mime_type=mime_type
        )
        return jsonify(result), 200

    except Exception as e:
        # Fail loud + visible in Render logs
        print("ANALYZE ERROR:", str(e))
        return jsonify({
            "error": "Internal server error",
            "message": "Analysis failed"
        }), 500


@app.route("/trending-news", methods=["GET"])
def trending_news():
    try:
        # ✅ LAZY IMPORT
        from analyzer import get_trending_news

        result = get_trending_news()
        return jsonify(result), 200

    except Exception as e:
        print("TRENDING NEWS ERROR:", str(e))
        return jsonify({
            "error": "Failed to fetch trending news"
        }), 500


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


# ⚠️ NOTE:
# Intentionally NOT overriding 500 handler
# → Let Flask/Gunicorn expose real errors in logs


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
