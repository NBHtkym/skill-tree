# Workout Skill Tree

A full-stack web application that visualizes workout exercises as an interactive skill tree, allowing users to track their progress through exercise skills with dependencies.

## Features

- Interactive skill tree visualization with nodes representing exercises
- Visual indicators for completed, available, and locked exercises
- Confetti animation effect when skills are mastered
- Progress tracking with backend persistence and localStorage fallback
- Responsive design that works on desktop and mobile devices

## Project Structure

```
workout-skill-tree/
├── backend/                     # Python backend
│   ├── app.py                   # Main Flask application
│   └── data/                    # Data storage
│       ├── skill_tree.json      # Processed skill tree data
│       └── user_progress.json   # User progress data
├── frontend/                    # Frontend code
│   ├── index.html               # Main HTML file
│   ├── css/                     # Stylesheets
│   │   └── style.css            # Main stylesheet
│   ├── js/                      # JavaScript files
│   │   ├── skill-tree.js        # Skill tree visualization
│   │   ├── progress-tracker.js  # Progress tracking functionality
│   │   └── animations.js        # Confetti animation
│   └── assets/                  # Images and other assets
```

## Setup Instructions

### Prerequisites

- Python 3.6 or higher
- Flask
- Flask-CORS

### Backend Setup

1. Install the required Python packages:

```bash
pip install flask flask-cors
```

2. Navigate to the backend directory:

```bash
cd backend
```

3. Run the Flask application:

```bash
python app.py
```

The backend API will be available at http://localhost:5050.

### Frontend Setup

There are two ways to run the frontend:

#### Option 1: Using the included Python server

1. From the project root directory, run:

```bash
python serve.py
```

The frontend will be available at http://localhost:8000.

#### Option 2: Using any HTTP server

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Start an HTTP server. For example, with Python:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

The frontend will be available at http://localhost:8000.

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/skill-tree` - Get the skill tree data
- `GET /api/progress` - Get the user progress data
- `POST /api/progress` - Update user progress
- `GET /api/available-exercises` - Get list of available exercises based on current progress

## Usage

1. Open the application in your web browser.
2. The skill tree will be displayed with nodes representing exercises.
3. Click on a node to view exercise details.
4. If an exercise is available (all prerequisites are completed), you can mark it as complete.
5. When an exercise is completed, a confetti animation will be displayed.
6. Your progress is automatically saved to the backend and localStorage.

## Offline Mode

The application supports offline mode by falling back to localStorage when the backend API is not available. When you reconnect, the application will attempt to sync your progress with the backend.

## Development

### Adding New Exercises

To add new exercises, edit the `skill_tree.json` file in the `backend/data` directory. Each exercise should have the following properties:

- `id`: A unique identifier for the exercise
- `name`: The name of the exercise
- `description`: A description of the exercise
- `difficulty`: The difficulty level (beginner, intermediate, advanced)
- `category`: The category of the exercise (Strength, Cardio, Flexibility, etc.)
- `position`: The position of the node in the skill tree (x, y coordinates)
- `prerequisites`: An array of exercise IDs that must be completed before this exercise

### Customizing the UI

The UI can be customized by editing the CSS files in the `frontend/css` directory. The main stylesheet is `style.css`.

## Troubleshooting

### Backend API Not Available

If the backend API is not available, the application will fall back to using localStorage for progress tracking. You will see a warning in the browser console.

### Exercises Not Loading

If the exercises are not loading, check that the `skill_tree.json` file is properly formatted and accessible to the backend.

### Progress Not Saving

If progress is not saving, check that the `user_progress.json` file is writable by the backend application.

## License

This project is licensed under the MIT License - see the LICENSE file for details.