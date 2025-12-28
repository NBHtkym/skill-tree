#!/usr/bin/env python3
"""
Workout Skill Tree Application Runner

This script starts both the backend and frontend servers for the Workout Skill Tree application.
"""

import os
import sys
import time
import subprocess
import signal
import webbrowser
import threading
import argparse

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

def start_backend():
    """Start the backend server."""
    print_header("Starting Backend Server")
    
    # Change to the backend directory
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workout-skill-tree", "backend")
    os.chdir(backend_dir)
    
    # Start the Flask app
    process = subprocess.Popen(
        [sys.executable, "app.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the server to start
    print(f"Backend server starting at http://{BACKEND_HOST}:{BACKEND_PORT}...")
    time.sleep(2)
    
    return process

def start_frontend():
    """Start the frontend server."""
    print_header("Starting Frontend Server")
    
    # Change to the project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)
    
    # Start the frontend server
    process = subprocess.Popen(
        [sys.executable, "serve.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the server to start
    print(f"Frontend server starting at http://{FRONTEND_HOST}:{FRONTEND_PORT}...")
    time.sleep(2)
    
    return process

def open_browser():
    """Open the browser to the frontend."""
    url = f"http://{FRONTEND_HOST}:{FRONTEND_PORT}"
    print(f"Opening {url} in your default browser...")
    webbrowser.open(url)

def log_output(process, name):
    """Log the output of a process."""
    for line in process.stdout:
        print(f"[{name}] {line.strip()}")
    for line in process.stderr:
        print(f"[{name} ERROR] {line.strip()}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Run the Workout Skill Tree application")
    parser.add_argument("--no-browser", action="store_true", help="Don't open the browser automatically")
    args = parser.parse_args()
    
    print_header("Workout Skill Tree Application")
    
    # Start the backend server
    backend_process = start_backend()
    backend_logger = threading.Thread(target=log_output, args=(backend_process, "Backend"), daemon=True)
    backend_logger.start()
    
    # Start the frontend server
    frontend_process = start_frontend()
    frontend_logger = threading.Thread(target=log_output, args=(frontend_process, "Frontend"), daemon=True)
    frontend_logger.start()
    
    # Open the browser if not disabled
    if not args.no_browser:
        time.sleep(1)  # Give servers a moment to fully initialize
        open_browser()
    
    print_header("Application Running")
    print("\nThe Workout Skill Tree application is now running.")
    print(f"- Frontend: http://{FRONTEND_HOST}:{FRONTEND_PORT}")
    print(f"- Backend API: http://{BACKEND_HOST}:{BACKEND_PORT}")
    print("\nPress Ctrl+C to stop the application.")
    
    try:
        # Keep the script running until interrupted
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping application...")
    finally:
        # Stop the servers
        print("Stopping frontend server...")
        frontend_process.terminate()
        frontend_process.wait()
        
        print("Stopping backend server...")
        backend_process.terminate()
        backend_process.wait()
        
        print("Application stopped.")

if __name__ == "__main__":
    main()