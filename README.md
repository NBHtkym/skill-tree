# Workout Skill Tree

A full-stack web application that visualizes workout exercises as an interactive skill tree, allowing users to track their progress through exercise skills with dependencies.

## Features

- **Hierarchical skill tree visualization** - Exercises organized top-to-bottom by difficulty (beginner at top, advanced at bottom)
- **Full-screen interactive view** with zoom and pan controls
- **Hover-based tooltips** - Hover over any node to see exercise details
- **Visual indicators** for completed (green), available (blue), and locked (gray) exercises
- **Confetti animation** when skills are mastered
- **Progress tracking** with backend persistence and localStorage fallback
- **Responsive design** that works on desktop and mobile devices

## Project Structure

```
workout-skill-tree/
├── main.py                      # Combined Flask server (frontend + API)
├── frontend/                    # Frontend code
│   ├── index.html               # Main HTML file
│   ├── css/                     # Stylesheets
│   │   └── style.css            # Main stylesheet
│   └── js/                      # JavaScript files
│       ├── skill-tree.js        # Skill tree visualization
│       ├── progress-tracker.js  # Progress tracking functionality
│       └── animations.js        # Confetti animation
├── backend/                     # Backend data
│   └── data/                    # Data storage
│       ├── skill_tree.json      # Exercise skill tree data
│       └── user_progress.json   # User progress data
└── replit.md                    # Project documentation
```

## Running the Application

### On Replit

Simply run the project - it will start the Flask server on port 5000:

```bash
python main.py
```

### Local Development

1. Install the required Python packages:

```bash
pip install flask flask-cors gunicorn
```

2. Run the application:

```bash
python main.py
```

The application will be available at http://localhost:5000.

## API Endpoints

- `GET /api/skill-tree` - Get the skill tree data
- `GET /api/progress` - Get the user progress data
- `POST /api/progress` - Update user progress
- `GET /api/available-exercises` - Get list of available exercises based on current progress

## Usage

1. Open the application in your web browser
2. The skill tree displays exercises organized by difficulty (easier at top, harder at bottom)
3. **Hover** over any node to view exercise details and the "Mark Complete" button
4. Blue nodes are **available** - you can complete them now
5. Gray nodes are **locked** - complete their prerequisites first
6. Green nodes are **completed**
7. Use **+/-** buttons or mouse wheel to zoom
8. **Drag** to pan around the skill tree
9. Progress is automatically saved

## Offline Mode

The application supports offline mode by falling back to localStorage when the backend API is not available. When you reconnect, the application will attempt to sync your progress with the backend.

## Customization

### Adding New Exercises

Edit `backend/data/skill_tree.json`. Each exercise should have:

- `id`: Unique identifier
- `name`: Exercise name
- `description`: Exercise description
- `difficulty`: Difficulty level (beginner, intermediate, advanced)
- `category`: Category (Strength, Cardio, Flexibility, etc.)
- `prerequisites`: Array of exercise IDs that must be completed first

### Customizing the UI

Edit `frontend/css/style.css` to customize colors, fonts, and layout.

## Recent Updates

- **December 2025**: Major UI/UX overhaul
  - Hierarchical top-to-bottom layout based on exercise prerequisites
  - Full-screen skill tree with dark gradient background
  - Hover-based tooltips (replaced click-to-select)
  - Stats displayed in header (Completed, Available, Locked)
  - Legend overlay at top of skill tree

## License

This project is licensed under the MIT License - see the LICENSE file for details.
