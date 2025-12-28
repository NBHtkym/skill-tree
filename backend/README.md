# Workout Skill Tree Backend

This is the backend server for the Workout Skill Tree application. It provides API endpoints to serve skill tree data and handle user progress updates.

## Setup and Running

1. Make sure you have Python and Flask installed:
   ```
   pip install flask flask-cors
   ```

2. Navigate to the backend directory:
   ```
   cd backend
   ```

3. Run the Flask application:
   ```
   python app.py
   ```

The server will start on `http://localhost:5050`.

## API Endpoints

### Get Skill Tree Data
- **URL**: `/api/skill-tree`
- **Method**: `GET`
- **Description**: Retrieves the complete skill tree data including exercises, dependencies, categories, and difficulties.
- **Response**: JSON object containing the skill tree data.

### Get User Progress
- **URL**: `/api/progress`
- **Method**: `GET`
- **Description**: Retrieves the current user progress data.
- **Response**: JSON object containing completed exercises and last updated timestamp.

### Update User Progress
- **URL**: `/api/progress`
- **Method**: `POST`
- **Description**: Updates the user progress by marking exercises as completed or uncompleted.
- **Request Body**:
  ```json
  {
    "exercise_id": "exercise-id-here",
    "completed": true  // or false to mark as uncompleted
  }
  ```
- **Response**: JSON object containing success status and updated progress data.
- **Error Handling**:
  - Returns 400 if prerequisites for an exercise are not completed
  - Returns 400 if uncompleting an exercise would break dependencies
  - Returns 404 if the exercise ID is not found

### Get Available Exercises
- **URL**: `/api/available-exercises`
- **Method**: `GET`
- **Description**: Retrieves a list of exercises that are available to be completed based on current progress.
- **Response**: JSON object containing available exercises and completed exercises.

## Testing

You can test the API endpoints using the provided `test_api.py` script:

```
python test_api.py
```

Make sure the Flask server is running before executing the test script.

## Data Structure

### Skill Tree Data (`data/skill_tree.json`)
Contains the complete skill tree structure including:
- Exercises with IDs, names, descriptions, difficulties, categories, and prerequisites
- Category and difficulty definitions
- Metadata about the skill tree

### User Progress Data (`data/user_progress.json`)
Stores the user's progress:
- List of completed exercise IDs
- Timestamp of the last update

## Error Handling

All API endpoints include proper error handling with appropriate HTTP status codes and descriptive error messages.