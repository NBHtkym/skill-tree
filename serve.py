import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs

PORT = 8000

class WorkoutSkillTreeHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Handle backend API requests
        if path.startswith('/backend/data/'):
            # Map to the actual file path
            file_path = '.' + path
            
            if os.path.exists(file_path):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                with open(file_path, 'rb') as file:
                    self.wfile.write(file.read())
            else:
                self.send_error(404, 'File not found')
            return
        
        # For all other requests, use the default handler
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def end_headers(self):
        # Add CORS headers for all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

if __name__ == "__main__":
    # Change to the directory containing the frontend files
    os.chdir('./frontend')
    
    handler = WorkoutSkillTreeHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()