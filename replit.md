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
- `GET /api/skill-tree` - Returns base skill tree data
- `GET /api/exercises` - Returns all exercises including user's custom ones (authenticated)
- `GET /api/progress` - Returns user progress (requires authentication for saved progress)
- `POST /api/progress` - Update user progress (requires authentication)
- `GET /api/available-exercises` - Returns available exercises based on current progress
- `POST /api/exercises/create` - Create a custom exercise (requires authentication)
- `DELETE /api/exercises/<id>` - Delete a custom exercise (requires authentication)
- `POST /api/auth/signup` - Create new user account (email/password)
- `POST /api/auth/login` - Log in with email/password
- `POST /api/auth/logout` - Log out current user
- `GET /api/auth/status` - Check authentication status

## Running the Application
The application runs on port 5000 using Flask. Execute:
```
python main.py
```

## Recent Changes
- December 2025: Added custom exercise creation
  - Logged-in users can create their own exercises
  - Set prerequisites and next exercises for custom nodes
  - Custom exercises appear in the skill tree
  - Barycenter algorithm to minimize edge crossings
- December 2025: Added user authentication
  - Email/password signup and login
  - Separate progress tracking per user account
  - PostgreSQL database for persistent user data
  - Session-based authentication with Flask-Login
- December 2025: Major UI/UX overhaul
  - Implemented hierarchical top-to-bottom layout (easier exercises at top, advanced at bottom)
  - Full-screen skill tree visualization with dark gradient background
  - Hover-based tooltips for exercise details (replaces sidebar)
  - Stats moved to header (Completed, Available, Locked counts)
  - Legend overlay at top of skill tree
- Consolidated duplicate project structure, removed legacy files
- Migrated to combined Flask server for Replit environment

## Database
- PostgreSQL database stores user accounts and progress
- Tables: `users` (id, email, password_hash, created_at), `user_progress` (id, user_id, completed_exercises, last_updated)
- Connection via DATABASE_URL environment variable

## Notes
- Nodes are automatically organized by difficulty/prerequisites (top-to-bottom)
- Hover over any node to see exercise details and mark as complete
- Use zoom buttons (+/-) or mouse wheel to zoom
- Drag to pan around the skill tree
- Progress is saved to backend JSON files with localStorage fallback
