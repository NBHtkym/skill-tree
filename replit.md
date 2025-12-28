# Workout Skill Tree

## Overview
A web application for visualizing and tracking workout progression through a skill tree interface. Users can see exercises organized in a tree structure with dependencies, track their progress, and mark exercises as completed.

## Project Structure
- `main.py` - Combined Flask server serving both frontend and backend API on port 5000
- `frontend/` - Static HTML/CSS/JS frontend files
  - `index.html` - Main HTML page
  - `css/style.css` - Styling
  - `js/skill-tree.js` - Skill tree visualization logic
  - `js/progress-tracker.js` - Progress tracking functionality
  - `js/animations.js` - Animation effects
- `backend/` - Backend data files
  - `data/skill_tree.json` - Exercise skill tree data
  - `data/user_progress.json` - User progress persistence

## API Endpoints
- `GET /api/skill-tree` - Returns skill tree data (exercises and their relationships)
- `GET /api/progress` - Returns user progress
- `POST /api/progress` - Update user progress (mark exercise complete/incomplete)
- `GET /api/available-exercises` - Returns available exercises based on current progress

## Running the Application
The application runs on port 5000 using Flask. Execute:
```
python main.py
```

## Recent Changes
- December 2025: Migrated to combined Flask server for Replit environment
- API base URL set to same-origin for unified server deployment
- Added cache control headers to prevent stale content

## Notes
- The skill tree visualization uses large coordinate positions; use zoom controls to navigate
- Progress is saved both to backend JSON files and localStorage as fallback
