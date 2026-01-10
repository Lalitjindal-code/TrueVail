from flask import Flask, request, jsonify
from analyzer import analyze_news, get_trending_news
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

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
        return jsonify({"error": "JSON body required"}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    text = data.get("text")
    analysis_type = data.get("type", "news")
    image_data = data.get("image_data")
    mime_type = data.get("mime_type")

    if not text and not image_data:
        return jsonify({
            "error": "No input provided",
            "message": "text or image_data required"
        }), 400

    try:
        result = analyze_news(
            text,
            analysis_type=analysis_type,
            image_data=image_data,
            mime_type=mime_type
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


@app.route('/trending-news', methods=['GET'])
def trending_news():
    try:
        return jsonify(get_trending_news()), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route('/ready')
def readiness_check():
    return jsonify({"status": "ready"}), 200


@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(_):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
