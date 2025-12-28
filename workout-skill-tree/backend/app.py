from flask import Flask, jsonify, request, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='../frontend')

# Data file paths
SKILL_TREE_FILE = os.path.join(os.path.dirname(__file__), 'data', 'skill_tree.json')
USER_PROGRESS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'user_progress.json')

# Ensure data directory exists
os.makedirs(os.path.dirname(SKILL_TREE_FILE), exist_ok=True)

# Load skill tree data
def load_skill_tree():
    try:
        with open(SKILL_TREE_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Return empty skill tree if file doesn't exist or is invalid
        return {"nodes": [], "categories": []}

# Load user progress data
def load_user_progress():
    try:
        with open(USER_PROGRESS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Return default progress if file doesn't exist or is invalid
        return {
            "completed_skills": [],
            "current_xp": 0,
            "last_updated": datetime.now().isoformat()
        }

# Save user progress data
def save_user_progress(progress_data):
    with open(USER_PROGRESS_FILE, 'w') as f:
        json.dump(progress_data, f, indent=2)

# Serve frontend files
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# API endpoints
@app.route('/api/skill-tree')
def get_skill_tree():
    return jsonify(load_skill_tree())

@app.route('/api/progress', methods=['GET'])
def get_user_progress():
    return jsonify(load_user_progress())

@app.route('/api/progress', methods=['POST'])
def update_user_progress():
    progress_data = request.json
    
    # Validate the data structure
    if not isinstance(progress_data, dict):
        return jsonify({"error": "Invalid data format"}), 400
    
    if "completed_skills" not in progress_data or not isinstance(progress_data["completed_skills"], list):
        return jsonify({"error": "Missing or invalid completed_skills"}), 400
    
    if "current_xp" not in progress_data or not isinstance(progress_data["current_xp"], (int, float)):
        return jsonify({"error": "Missing or invalid current_xp"}), 400
    
    # Update the last_updated timestamp
    progress_data["last_updated"] = datetime.now().isoformat()
    
    # Save the updated progress
    save_user_progress(progress_data)
    
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)