import os
from flask import Flask, jsonify, request, abort, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import json
from datetime import datetime
from models import db, User, UserProgress

app = Flask(__name__, static_folder='frontend', static_url_path='')
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

BACKEND_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'data')
SKILL_TREE_PATH = os.path.join(BACKEND_DATA_DIR, 'skill_tree.json')

def load_skill_tree():
    try:
        with open(SKILL_TREE_PATH, 'r') as file:
            return json.load(file)
    except Exception as e:
        app.logger.error(f"Error loading skill tree data: {e}")
        return None

def is_exercise_available(exercise_id, completed_exercises, dependencies):
    prerequisites = []
    for dep in dependencies:
        if dep.get('target') == exercise_id:
            prerequisites.append(dep.get('source'))
    if not prerequisites:
        return True
    return all(prereq in completed_exercises for prereq in prerequisites)

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/backend/data/<path:filename>')
def serve_backend_data(filename):
    return send_from_directory(BACKEND_DATA_DIR, filename)

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Request must be JSON'}), 400
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'An account with this email already exists'}), 400
    
    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    progress = UserProgress(user_id=user.id, completed_exercises=[])
    db.session.add(progress)
    db.session.commit()
    
    login_user(user)
    
    return jsonify({
        'success': True,
        'user': {'id': user.id, 'email': user.email}
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Request must be JSON'}), 400
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    login_user(user)
    
    return jsonify({
        'success': True,
        'user': {'id': user.id, 'email': user.email}
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'success': True})

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {'id': current_user.id, 'email': current_user.email}
        })
    return jsonify({'authenticated': False})

@app.route('/api/skill-tree', methods=['GET'])
def get_skill_tree():
    skill_tree = load_skill_tree()
    if skill_tree:
        return jsonify(skill_tree)
    else:
        abort(500, description="Failed to load skill tree data")

@app.route('/api/progress', methods=['GET'])
def get_progress():
    if not current_user.is_authenticated:
        return jsonify({
            'completed_exercises': [],
            'last_updated': None
        })
    
    progress = UserProgress.query.filter_by(user_id=current_user.id).first()
    if not progress:
        progress = UserProgress(user_id=current_user.id, completed_exercises=[])
        db.session.add(progress)
        db.session.commit()
    
    return jsonify({
        'completed_exercises': progress.completed_exercises or [],
        'last_updated': progress.last_updated.isoformat() if progress.last_updated else None
    })

@app.route('/api/progress', methods=['POST'])
def update_progress():
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Please log in to save progress'}), 401
    
    if not request.is_json:
        abort(400, description="Request must be JSON")
    
    data = request.get_json()
    exercise_id = data.get('exercise_id')
    completed = data.get('completed', True)
    
    if not exercise_id:
        abort(400, description="Exercise ID is required")
    
    skill_tree = load_skill_tree()
    if not skill_tree:
        abort(500, description="Failed to load skill tree data")
    
    progress = UserProgress.query.filter_by(user_id=current_user.id).first()
    if not progress:
        progress = UserProgress(user_id=current_user.id, completed_exercises=[])
        db.session.add(progress)
    
    completed_exercises = progress.completed_exercises or []
    
    if completed and exercise_id not in completed_exercises:
        exercise_exists = any(ex['id'] == exercise_id for ex in skill_tree['exercises'])
        if not exercise_exists:
            abort(404, description=f"Exercise with ID {exercise_id} not found")
        
        if not is_exercise_available(exercise_id, completed_exercises, skill_tree.get('dependencies', [])):
            abort(400, description="Prerequisites for this exercise are not completed")
        
        completed_exercises.append(exercise_id)
    elif not completed and exercise_id in completed_exercises:
        dependent_exercises = []
        for ex_id in completed_exercises:
            if ex_id != exercise_id and not is_exercise_available(ex_id, [e for e in completed_exercises if e != exercise_id], skill_tree.get('dependencies', [])):
                dependent_exercises.append(ex_id)
        
        if dependent_exercises:
            abort(400, description="Cannot uncomplete this exercise as other completed exercises depend on it")
        
        completed_exercises.remove(exercise_id)
    
    progress.completed_exercises = completed_exercises
    progress.last_updated = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'progress': {
            'completed_exercises': completed_exercises,
            'last_updated': progress.last_updated.isoformat()
        }
    })

@app.route('/api/available-exercises', methods=['GET'])
def get_available_exercises():
    skill_tree = load_skill_tree()
    if not skill_tree:
        abort(500, description="Failed to load skill tree data")
    
    completed_exercises = []
    if current_user.is_authenticated:
        progress = UserProgress.query.filter_by(user_id=current_user.id).first()
        if progress:
            completed_exercises = progress.completed_exercises or []
    
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
@app.errorhandler(401)
@app.errorhandler(404)
@app.errorhandler(500)
def handle_error(error):
    return jsonify({
        'success': False,
        'error': error.code,
        'message': error.description
    }), error.code

@app.after_request
def add_cache_control(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
