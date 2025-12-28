from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# File paths
SKILL_TREE_PATH = os.path.join('data', 'skill_tree.json')
USER_PROGRESS_PATH = os.path.join('data', 'user_progress.json')

# Helper functions
def load_skill_tree():
    """Load skill tree data from JSON file"""
    try:
        with open(SKILL_TREE_PATH, 'r') as file:
            return json.load(file)
    except Exception as e:
        app.logger.error(f"Error loading skill tree data: {e}")
        return None

def load_user_progress():
    """Load user progress data from JSON file"""
    try:
        with open(USER_PROGRESS_PATH, 'r') as file:
            return json.load(file)
    except Exception as e:
        app.logger.error(f"Error loading user progress data: {e}")
        return None

def save_user_progress(progress_data):
    """Save user progress data to JSON file"""
    try:
        # Update the last_updated timestamp
        progress_data['last_updated'] = datetime.now().isoformat()
        
        with open(USER_PROGRESS_PATH, 'w') as file:
            json.dump(progress_data, file, indent=2)
        return True
    except Exception as e:
        app.logger.error(f"Error saving user progress data: {e}")
        return False

def is_exercise_available(exercise_id, completed_exercises, dependencies):
    """Check if an exercise is available based on its prerequisites"""
    # Get prerequisites for the exercise
    prerequisites = []
    for dep in dependencies:
        if dep.get('target') == exercise_id:
            prerequisites.append(dep.get('source'))
    
    # If no prerequisites, exercise is available
    if not prerequisites:
        return True
    
    # Check if all prerequisites are completed
    return all(prereq in completed_exercises for prereq in prerequisites)

# API Routes
@app.route('/api/skill-tree', methods=['GET'])
def get_skill_tree():
    """Get the skill tree data"""
    skill_tree = load_skill_tree()
    if skill_tree:
        return jsonify(skill_tree)
    else:
        abort(500, description="Failed to load skill tree data")

@app.route('/api/progress', methods=['GET'])
def get_progress():
    """Get the user progress data"""
    progress = load_user_progress()
    if progress:
        return jsonify(progress)
    else:
        abort(500, description="Failed to load user progress data")

@app.route('/api/progress', methods=['POST'])
def update_progress():
    """Update user progress"""
    if not request.is_json:
        abort(400, description="Request must be JSON")
    
    data = request.get_json()
    exercise_id = data.get('exercise_id')
    completed = data.get('completed', True)
    
    if not exercise_id:
        abort(400, description="Exercise ID is required")
    
    # Load current progress and skill tree
    progress = load_user_progress()
    skill_tree = load_skill_tree()
    
    if not progress or not skill_tree:
        abort(500, description="Failed to load required data")
    
    # Update completed exercises
    completed_exercises = progress['completed_exercises']
    
    if completed and exercise_id not in completed_exercises:
        # Check if the exercise exists in the skill tree
        exercise_exists = any(ex['id'] == exercise_id for ex in skill_tree['exercises'])
        if not exercise_exists:
            abort(404, description=f"Exercise with ID {exercise_id} not found")
        
        # Check if the exercise is available (prerequisites are met)
        if not is_exercise_available(exercise_id, completed_exercises, skill_tree.get('dependencies', [])):
            abort(400, description="Prerequisites for this exercise are not completed")
        
        completed_exercises.append(exercise_id)
    elif not completed and exercise_id in completed_exercises:
        # Check if removing this exercise would break dependencies for other completed exercises
        dependent_exercises = []
        for ex_id in completed_exercises:
            if ex_id != exercise_id and not is_exercise_available(ex_id, [e for e in completed_exercises if e != exercise_id], skill_tree.get('dependencies', [])):
                dependent_exercises.append(ex_id)
        
        if dependent_exercises:
            abort(400, description=f"Cannot uncomplete this exercise as other completed exercises depend on it")
        
        completed_exercises.remove(exercise_id)
    
    # Save updated progress
    if save_user_progress(progress):
        return jsonify({
            'success': True,
            'progress': progress
        })
    else:
        abort(500, description="Failed to save progress")

@app.route('/api/available-exercises', methods=['GET'])
def get_available_exercises():
    """Get list of available exercises based on current progress"""
    # Load current progress and skill tree
    progress = load_user_progress()
    skill_tree = load_skill_tree()
    
    if not progress or not skill_tree:
        abort(500, description="Failed to load required data")
    
    completed_exercises = progress['completed_exercises']
    available_exercises = []
    
    for exercise in skill_tree['exercises']:
        exercise_id = exercise['id']
        if exercise_id not in completed_exercises and is_exercise_available(exercise_id, completed_exercises, skill_tree.get('dependencies', [])):
            available_exercises.append(exercise)
    
    return jsonify({
        'available_exercises': available_exercises,
        'completed_exercises': completed_exercises
    })

@app.errorhandler(400)
@app.errorhandler(404)
@app.errorhandler(500)
def handle_error(error):
    """Handle errors with JSON responses"""
    return jsonify({
        'success': False,
        'error': error.code,
        'message': error.description
    }), error.code

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)  # Changed port to 5050