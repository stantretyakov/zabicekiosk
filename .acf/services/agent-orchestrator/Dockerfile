# Temporary minimal Dockerfile for agent-orchestrator
# This service is not yet implemented but required for full profile startup

FROM python:3.11-slim

WORKDIR /app

# Create minimal health endpoint
RUN echo 'from http.server import HTTPServer, BaseHTTPRequestHandler\n\
class HealthHandler(BaseHTTPRequestHandler):\n\
    def do_GET(self):\n\
        if self.path == "/health":\n\
            self.send_response(200)\n\
            self.send_header("Content-type", "text/plain")\n\
            self.end_headers()\n\
            self.wfile.write(b"OK")\n\
        else:\n\
            self.send_response(404)\n\
            self.end_headers()\n\
\n\
if __name__ == "__main__":\n\
    server = HTTPServer(("0.0.0.0", 8000), HealthHandler)\n\
    print("Agent orchestrator stub running on port 8000")\n\
    server.serve_forever()\n\
' > /app/main.py

EXPOSE 8000

CMD ["python", "/app/main.py"]
