"""
Backend Server for HornetHelper
Provides AI-powered endpoints for chat assistance and video recommendations.
Uses OpenAI for natural language processing and YouTube API for video search.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
from ai_utils import get_ai_response, get_video_recommendation

app = Flask(__name__)

# Configure CORS to only allow requests from our frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:4000"],  # Only allow the frontend port
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# API Endpoints

@app.route('/api/ask-ai', methods=['POST'])
def ask_ai():
    """
    AI Q&A Endpoint
    Accepts a user's question and returns an AI-generated response.
    
    Request body:
    {
        "message": "User's question string"
    }
    
    Returns:
    - 200: JSON with AI response
    - 400: If message is missing
    - 500: For server errors
    """
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
    """
    Video Recommendation Endpoint
    Returns educational videos based on the provided course/major.
    
    Request body:
    {
        "major": "Course or major name"
    }
    
    Returns:
    - 200: JSON array of video recommendations
    - 400: If major is missing
    - 404: If no videos found
    - 500: For server errors
    """
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

# Global Error Handlers

@app.errorhandler(404)
def not_found(error):
    """Handle 404 Not Found errors"""
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 Internal Server errors"""
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8888)