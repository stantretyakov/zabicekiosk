"""
Event Activities
Publish events to Redis for real-time status updates
"""

from temporalio import activity
import redis
import json
import os
from datetime import datetime


@activity.defn
async def publish_event(event_data: dict) -> dict:
    """Publish event to Redis"""
    redis_url = os.getenv("REDIS_URL", "localhost:16379")

    # Parse Redis URL
    host, port = redis_url.split(":")

    # Connect to Redis
    r = redis.Redis(host=host, port=int(port), decode_responses=True)

    # Add timestamp
    event_data["timestamp"] = datetime.now().isoformat()

    # Get event type for channel
    event_type = event_data.get("event_type", "pipeline.event")

    # Publish to specific channel
    event_json = json.dumps(event_data)
    r.publish(event_type, event_json)

    activity.logger.info(f"Published event: {event_type}")

    return {"status": "published"}
