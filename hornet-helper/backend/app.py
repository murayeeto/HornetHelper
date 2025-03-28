from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

@app.route('/api/home', methods=['GET'])
def get_home():
    return jsonify(data["home"])

@app.route('/api/category/<category_name>', methods=['GET'])
def get_category(category_name):
    if category_name in data:
        return jsonify(data[category_name])
    return jsonify({"error": "Category not found"}), 404

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

if __name__ == '__main__':
    app.run(debug=True)