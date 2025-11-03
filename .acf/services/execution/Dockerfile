# Temporal Worker - Executes workflows and activities

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY workflows/ ./workflows/
COPY activities/ ./activities/
COPY worker.py .

# No exposed port (worker, not HTTP server)

CMD ["python", "worker.py"]
