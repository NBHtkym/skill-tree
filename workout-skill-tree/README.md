# Workout Skill Tree

An interactive skill tree visualization for tracking workout progress.

## Project Overview

This project implements an interactive skill tree visualization for workout exercises, where users can track their progress through different exercise skills with dependencies. The visualization shows exercises as nodes with proper dependencies and implements a confetti animation effect when skills are mastered.

## Features

- Interactive skill tree visualization with nodes representing exercises
- Visual indicators for completed/locked/available exercises
- Dependency visualization between exercises
- Confetti animation when skills are mastered
- Responsive design that works on desktop and mobile devices
- Progress tracking with XP accumulation

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
│   ├── test.html                # Test page for development
│   ├── css/                     # Stylesheets
│   │   └── style.css            # Main stylesheet
│   ├── js/                      # JavaScript files
│   │   ├── skill-tree.js        # Skill tree visualization
│   │   ├── progress-tracker.js  # Progress tracking functionality
│   │   └── animations.js        # Confetti animation
│   └── assets/                  # Images and other assets
└── test_server.py               # Simple test server for development
```

## Implementation Details

### Skill Tree Visualization (skill-tree.js)

The skill tree visualization is implemented using vanilla JavaScript and DOM manipulation. The main features include:

- Parsing the skill tree JSON data
- Calculating node positions based on their dependencies
- Rendering nodes and connections with appropriate styling
- Handling user interactions (clicking on nodes, panning the tree)
- Showing visual indicators for completed, available, and locked exercises

### Confetti Animation (animations.js)

The confetti animation is implemented using two approaches:

1. DOM-based animation: Creates and animates DOM elements for the confetti particles
2. Canvas-based animation: Uses HTML5 Canvas for better performance

The animation is triggered when a skill is marked as complete.

### Progress Tracking (progress-tracker.js)

The progress tracking functionality handles:

- Loading and saving user progress
- Tracking completed skills and XP
- Updating the UI to reflect current progress
- Providing fallback storage using localStorage

## How to Test

1. Start the test server:
   ```
   python test_server.py
   ```

2. Open the test page in your browser:
   ```
   http://localhost:8000/frontend/test.html
   ```

3. Use the test controls to:
   - Render the skill tree
   - Complete skills
   - Trigger the confetti animation
   - Reset progress

4. To view the main application:
   ```
   http://localhost:8000/frontend/index.html
   ```

## Future Improvements

- Add user authentication
- Implement more advanced skill tree layouts
- Add exercise details with images and videos
- Create a more sophisticated progress system with levels and achievements
- Add sound effects for completing skills