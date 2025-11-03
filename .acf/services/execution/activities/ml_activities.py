"""
ML Model Activities
Call stub services for ML inference
"""

from temporalio import activity
import httpx
import os


STUBS_URL = os.getenv("STUBS_URL", "http://localhost:18086")


@activity.defn
async def run_face_recognition(inputs: dict) -> dict:
    """Run face recognition model"""
    images = inputs.get("images", [])

    activity.logger.info(f"Running face recognition on {len(images)} images")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{STUBS_URL}/ml/face_recognition",
            json={"images": images},
            timeout=60.0,
        )
        response.raise_for_status()
        return response.json()


@activity.defn
async def run_sentiment_analysis(inputs: dict) -> dict:
    """Run sentiment analysis model"""
    texts = inputs.get("texts", [])

    activity.logger.info(f"Running sentiment analysis on {len(texts)} texts")
    activity.logger.info(f"Input payload: {inputs}")
    activity.logger.info(f"Extracted texts type: {type(texts)}, value: {texts}")

    async with httpx.AsyncClient() as client:
        payload = {"texts": texts}
        activity.logger.info(f"Sending payload to stub: {payload}")

        response = await client.post(
            f"{STUBS_URL}/ml/sentiment_analysis",
            json=payload,
            timeout=30.0,
        )
        activity.logger.info(f"Response status: {response.status_code}")
        if response.status_code != 200:
            activity.logger.error(f"Response body: {response.text}")
        response.raise_for_status()
        return response.json()


@activity.defn
async def run_ner(inputs: dict) -> dict:
    """Run named entity recognition"""
    texts = inputs.get("texts", [])

    activity.logger.info(f"Running NER on {len(texts)} texts")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{STUBS_URL}/ml/ner",
            json=texts,
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()
