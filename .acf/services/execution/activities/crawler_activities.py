"""
Crawler Activities
Call stub services to fetch social media data
"""

from temporalio import activity
import httpx
import os


STUBS_URL = os.getenv("STUBS_URL", "http://localhost:18086")


@activity.defn
async def crawl_twitter(inputs: dict) -> dict:
    """Crawl Twitter profile"""
    username = inputs.get("username", "test_user")

    activity.logger.info(f"Crawling Twitter profile: {username}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{STUBS_URL}/crawlers/twitter/profile",
            json={"username": username},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()


@activity.defn
async def crawl_facebook(inputs: dict) -> dict:
    """Crawl Facebook profile"""
    user_id = inputs.get("user_id", "test_user_id")

    activity.logger.info(f"Crawling Facebook profile: {user_id}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{STUBS_URL}/crawlers/facebook/profile",
            json={"user_id": user_id},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()


@activity.defn
async def crawl_linkedin(inputs: dict) -> dict:
    """Crawl LinkedIn profile"""
    profile_url = inputs.get("profile_url", "https://linkedin.com/in/test")

    activity.logger.info(f"Crawling LinkedIn profile: {profile_url}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{STUBS_URL}/crawlers/linkedin/profile",
            params={"profile_url": profile_url},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()
