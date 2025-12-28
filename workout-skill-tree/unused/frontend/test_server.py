import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class TestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Handle API endpoints
        if path == '/backend/data/skill_tree.json':
            self.send_json_response('backend/data/skill_tree.json')
            return
        elif path == '/backend/data/user_progress.json':
            self.send_json_response('backend/data/user_progress.json')
            return
        
        # Default behavior for static files
        return super().do_GET()
    
    def do_POST(self):
        # Handle POST requests for updating user progress
        if self.path == '/backend/data/user_progress.json':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse and validate the JSON data
                progress_data = json.loads(post_data.decode('utf-8'))
                
                # Save the updated progress
                with open(os.path.join(DIRECTORY, 'backend/data/user_progress.json'), 'w') as f:
                    json.dump(progress_data, f, indent=2)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
                
            except Exception as e:
                # Send error response
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            
            return
        
        # Default behavior for other POST requests
        self.send_response(404)
        self.end_headers()
    
    def send_json_response(self, file_path):
        try:
            with open(os.path.join(DIRECTORY, file_path), 'r') as f:
                data = json.load(f)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

# Create and start the server
with socketserver.TCPServer(("", PORT), TestHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print(f"Test page available at http://localhost:{PORT}/frontend/test.html")
    print(f"Main page available at http://localhost:{PORT}/frontend/index.html")
    print("Press Ctrl+C to stop the server")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")