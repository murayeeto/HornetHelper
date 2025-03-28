from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import firebase_service

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
#test
# Authentication middleware
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split('Bearer ')[1]
        try:
            decoded_token = firebase_service.verify_id_token(token)
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
            
            # Get user data from Firestore
            user_data = firebase_service.get_user_data(decoded_token['uid'])
            if not user_data or 'major' not in user_data:
                return jsonify({"error": "Major not set"}), 403
            
            # Add user info to request
            request.user = {
                'uid': decoded_token['uid'],
                'email': decoded_token['email'],
                'major': user_data['major']
            }
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    return decorated_function

# Sample data for each category
data = {
    "home": {
        "title": "Welcome to Hornet Helper",
        "description": "Your one-stop solution for all your needs"
    },
    "category1": {
        "title": "Category 1",
        "items": ["Item 1", "Item 2", "Item 3"]
    },
    "category2": {
        "title": "Category 2",
        "items": ["Item A", "Item B", "Item C"]
    },
    "category3": {
        "title": "Category 3",
        "items": ["Product X", "Product Y", "Product Z"]
    },
    "category4": {
        "title": "Category 4",
        "items": ["Service 1", "Service 2", "Service 3"]
    },
    "ai": {
        "title": "AI Solutions",
        "items": ["Machine Learning", "Natural Language Processing", "Computer Vision"]
    }
}

# User-related endpoints
@app.route('/api/user/profile', methods=['GET'])
@require_auth
def get_user_profile():
    return jsonify(request.user)

@app.route('/api/user/major', methods=['PUT'])
@require_auth
def update_major():
    data = request.get_json()
    if not data or 'major' not in data:
        return jsonify({"error": "Major is required"}), 400
    
    success = firebase_service.update_user_major(request.user['uid'], data['major'])
    if success:
        return jsonify({"message": "Major updated successfully"})
    return jsonify({"error": "Failed to update major"}), 500

# Protected routes
@app.route('/api/home', methods=['GET'])
@require_auth
def get_home():
    return jsonify(data["home"])

@app.route('/api/category/<category_name>', methods=['GET'])
@require_auth
def get_category(category_name):
    if category_name in data:
        return jsonify(data[category_name])
    return jsonify({"error": "Category not found"}), 404

# Public routes
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = [
        {"id": "category1", "name": "Category 1"},
        {"id": "category2", "name": "Category 2"},
        {"id": "category3", "name": "Category 3"},
        {"id": "category4", "name": "Category 4"},
        {"id": "ai", "name": "AI Solutions"}
    ]
    return jsonify(categories)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)  # Changed port to 8000