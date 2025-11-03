"""
Function Activities
Call stub services for utility functions
"""

from temporalio import activity
import httpx
import os


STUBS_URL = os.getenv("STUBS_URL", "http://localhost:18086")


@activity.defn
async def lookup_breach_db(inputs: dict) -> dict:
    """Lookup email in breach database"""
    email = inputs.get("email", "test@example.com")

    activity.logger.info(f"Looking up breach data for: {email}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{STUBS_URL}/breach/lookup",
            json={"email": email},
            timeout=20.0,
        )
        response.raise_for_status()
        return response.json()
