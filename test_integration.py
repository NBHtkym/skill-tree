#!/usr/bin/env python3
"""
Integration test script for the Workout Skill Tree application.
This script tests the connection between the frontend and backend.
"""

import http.client
import json
import os
import sys
import time
import webbrowser
from urllib.parse import urlparse
import subprocess
import signal
import threading

# Configuration
BACKEND_HOST = "localhost"
BACKEND_PORT = 5050
FRONTEND_HOST = "localhost"
FRONTEND_PORT = 8000

def print_header(message):
    """Print a header message."""
    print("\n" + "=" * 80)
    print(f" {message}")
    print("=" * 80)

def test_backend_api():
    """Test the backend API endpoints."""
    print_header("Testing Backend API")
    
    conn = http.client.HTTPConnection(BACKEND_HOST, BACKEND_PORT)
    
    # Test GET /api/skill-tree
    print("\nTesting GET /api/skill-tree...")
    try:
        conn.request("GET", "/api/skill-tree")
        response = conn.getresponse()
        data = response.read().decode()
        
        if response.status == 200:
            skill_tree = json.loads(data)
            print(f"✅ Success! Received skill tree with {len(skill_tree.get('exercises', []))} exercises.")
        else:
            print(f"❌ Failed with status {response.status}: {response.reason}")
            print(f"Response: {data}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /api/progress
    print("\nTesting GET /api/progress...")
    try:
        conn.request("GET", "/api/progress")
        response = conn.getresponse()
        data = response.read().decode()j
        
        if response.status == 200:
            progress = json.loads(data)
            print(f"✅ Success! Received progress with {len(progress.get('completed_exercises', []))} completed exercises.")
        else:
            print(f"❌ Failed with status {response.status}: {response.reason}")
            print(f"Response: {data}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test POST /api/progress
    print("\nTesting POST /api/progress...")
    try:
        # Get the first exercise ID from the skill tree
        conn.request("GET", "/api/skill-tree")
        response = conn.getresponse()
        skill_tree = json.loads(response.read().decode())
        
        if skill_tree and 'exercises' in skill_tree and skill_tree['exercises']:
            exercise_id = skill_tree['exercises'][0]['id']
            
            # Mark the exercise as completed
            headers = {'Content-type': 'application/json'}
            body = json.dumps({
                'exercise_id': exercise_id,
                'completed': True
            })
            
            conn.request("POST", "/api/progress", body, headers)
            response = conn.getresponse()
            data = response.read().decode()
            
            if response.status == 200:
                result = json.loads(data)
                if result.get('success'):
                    print(f"✅ Success! Marked exercise {exercise_id} as completed.")
                else:
                    print(f"❌ Failed: {result.get('message', 'Unknown error')}")
            else:
                print(f"❌ Failed with status {response.status}: {response.reason}")
                print(f"Response: {data}")
        else:
            print("❌ Could not get exercise ID from skill tree.")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test GET /api/available-exercises
    print("\nTesting GET /api/available-exercises...")
    try:
        conn.request("GET", "/api/available-exercises")
        response = conn.getresponse()
        data = response.read().decode()
        
        if response.status == 200:
            result = json.loads(data)
            print(f"✅ Success! Received {len(result.get('available_exercises', []))} available exercises.")
        else:
            print(f"❌ Failed with status {response.status}: {response.reason}")
            print(f"Response: {data}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    conn.close()

def start_backend():
    """Start the backend server."""
    print_header("Starting Backend Server")
    
    # Change to the backend directory
    os.chdir("backend")
    
    # Start the Flask app
    process = subprocess.Popen(
        [sys.executable, "app.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the server to start
    print("Waiting for backend server to start...")
    time.sleep(2)
    
    return process

def start_frontend():
    """Start the frontend server."""
    print_header("Starting Frontend Server")
    
    # Change back to the project root
    os.chdir("..")
    
    # Start the frontend server
    process = subprocess.Popen(
        [sys.executable, "serve.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the server to start
    print("Waiting for frontend server to start...")
    time.sleep(2)
    
    return process

def open_browser():
    """Open the browser to the frontend."""
    print_header("Opening Browser")
    
    url = f"http://{FRONTEND_HOST}:{FRONTEND_PORT}"
    print(f"Opening {url} in your default browser...")
    webbrowser.open(url)

def main():
    """Main function."""
    print_header("Workout Skill Tree Integration Test")
    
    # Start the backend server
    backend_process = start_backend()
    
    try:
        # Test the backend API
        test_backend_api()
        
        # Start the frontend server
        frontend_process = start_frontend()
        
        try:
            # Open the browser
            open_browser()
            
            print_header("Test Complete")
            print("\nThe application should now be running in your browser.")
            print("Please verify that:")
            print("1. The skill tree is displayed correctly")
            print("2. You can click on nodes to view exercise details")
            print("3. You can mark exercises as completed")
            print("4. The confetti animation appears when completing an exercise")
            print("5. Your progress is saved when you refresh the page")
            
            print("\nPress Ctrl+C to stop the servers and exit.")
            
            # Keep the script running until interrupted
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\nStopping servers...")
        finally:
            # Stop the frontend server
            frontend_process.terminate()
            frontend_process.wait()
    
    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        # Stop the backend server
        backend_process.terminate()
        backend_process.wait()
    
    print("Done!")

if __name__ == "__main__":
    main()