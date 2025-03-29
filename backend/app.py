from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
from ai_utils import get_ai_response, get_video_recommendation

app = Flask(__name__)
# Enable CORS for all routes with specific configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:4000"],  # Only allow the frontend port
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# AI endpoints
@app.route('/api/ask-ai', methods=['POST'])
def ask_ai():
    try:
        print("Received ask-ai request")
        data = request.get_json()
        print("Request data:", data)
        
        if not data or 'message' not in data:
            print("Error: Message is missing from request")
            return jsonify({"error": "Message is required"}), 400
        
        print("Getting AI response for message:", data['message'])
        response = get_ai_response(data['message'])
        print("AI response:", response)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommend-video', methods=['POST'])
def recommend_video():
    try:
        data = request.get_json()
        if not data or 'major' not in data:
            return jsonify({"error": "Major is required"}), 400
        major = data['major']
        recommendation = get_video_recommendation(major)
        
        if recommendation:
            return jsonify(recommendation)
        return jsonify({"error": "No video recommendations found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8888)