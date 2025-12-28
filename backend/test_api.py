import requests
import json
from pprint import pprint

# Base URL for the API
BASE_URL = "http://localhost:5050/api"  # Updated port to 5050

def test_get_skill_tree():
    """Test the GET /api/skill-tree endpoint"""
    print("\n=== Testing GET /api/skill-tree ===")
    response = requests.get(f"{BASE_URL}/skill-tree")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Received skill tree data.")
        print(f"Number of exercises: {len(data.get('exercises', []))}")
        print(f"Number of dependencies: {len(data.get('dependencies', []))}")
        print(f"Categories: {data.get('categories', [])}")
    else:
        print(f"Error: {response.text}")

def test_get_progress():
    """Test the GET /api/progress endpoint"""
    print("\n=== Testing GET /api/progress ===")
    response = requests.get(f"{BASE_URL}/progress")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Received user progress data.")
        print(f"Completed exercises: {len(data.get('completed_exercises', []))}")
        print(f"Last updated: {data.get('last_updated')}")
    else:
        print(f"Error: {response.text}")

def test_update_progress():
    """Test the POST /api/progress endpoint"""
    print("\n=== Testing POST /api/progress ===")
    
    # First, get the skill tree to find an exercise ID
    skill_tree_response = requests.get(f"{BASE_URL}/skill-tree")
    if skill_tree_response.status_code != 200:
        print("Failed to get skill tree data for testing")
        return
    
    skill_tree = skill_tree_response.json()
    exercises = skill_tree.get('exercises', [])
    
    if not exercises:
        print("No exercises found in skill tree")
        return
    
    # Find an exercise with no prerequisites
    test_exercise = None
    for exercise in exercises:
        if not exercise.get('prerequisites', []):
            test_exercise = exercise
            break
    
    if not test_exercise:
        test_exercise = exercises  # Fallback to first exercise
    
    exercise_id = test_exercise['id']
    print(f"Testing with exercise: {test_exercise['name']} (ID: {exercise_id})")
    
    # Mark exercise as completed
    print("\nMarking exercise as completed...")
    response = requests.post(
        f"{BASE_URL}/progress",
        json={"exercise_id": exercise_id, "completed": True}
    )
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Progress updated.")
        print(f"Updated progress: {data.get('progress', {}).get('completed_exercises')}")
    else:
        print(f"Error: {response.text}")
    
    # Mark exercise as uncompleted
    print("\nMarking exercise as uncompleted...")
    response = requests.post(
        f"{BASE_URL}/progress",
        json={"exercise_id": exercise_id, "completed": False}
    )
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Progress updated.")
        print(f"Updated progress: {data.get('progress', {}).get('completed_exercises')}")
    else:
        print(f"Error: {response.text}")

def test_available_exercises():
    """Test the GET /api/available-exercises endpoint"""
    print("\n=== Testing GET /api/available-exercises ===")
    response = requests.get(f"{BASE_URL}/available-exercises")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Received available exercises data.")
        print(f"Number of available exercises: {len(data.get('available_exercises', []))}")
        print(f"Number of completed exercises: {len(data.get('completed_exercises', []))}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("Starting API tests...")
    print("Make sure the Flask server is running on port 5050!")
    
    test_get_skill_tree()
    # try:
    #     test_get_skill_tree()
    #     test_get_progress()
    #     test_update_progress()
    #     test_available_exercises()
    #     print("\nAll tests completed!")
    # except requests.exceptions.ConnectionError:
    #     print("\nError: Could not connect to the server. Make sure the Flask server is running on port 5050.")
    # except Exception as e:
    #     print(f"\nError during testing: {e}")