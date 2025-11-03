"""
ODP Stubs Service - Consolidated Mock Endpoints
Provides realistic mock responses for all external APIs
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
from datetime import datetime, timedelta

app = FastAPI(title="ODP Stubs Service", version="1.0.0")

# ============================================================================
# Request/Response Models
# ============================================================================

class TwitterProfileRequest(BaseModel):
    username: str

class FacebookProfileRequest(BaseModel):
    user_id: str

class FaceRecognitionRequest(BaseModel):
    images: List[str]

class SentimentAnalysisRequest(BaseModel):
    texts: List[str]

class BreachLookupRequest(BaseModel):
    email: str

# ============================================================================
# Mock Data Generators
# ============================================================================

SAMPLE_USERNAMES = ["alice_crypto", "bob_security", "charlie_osint", "diana_threat", "eve_analyst"]
SAMPLE_POSTS = [
    "Excited to share our latest threat intelligence findings!",
    "Interesting patterns emerging in social media activity...",
    "New research on OSINT techniques published",
    "Great conference on cybersecurity today",
    "Working on some cool projects, stay tuned!"
]
SAMPLE_BREACHES = ["LinkedIn2021", "Facebook2019", "Yahoo2014", "Adobe2013", "Collection1"]

def generate_mock_face_embedding():
    """Generate random 512-dimensional face embedding"""
    return [random.uniform(-1.0, 1.0) for _ in range(512)]

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "stubs",
        "endpoints": {
            "crawlers": 3,
            "ml_models": 3,
            "functions": 1
        }
    }

# ============================================================================
# Crawler Stubs
# ============================================================================

@app.post("/crawlers/twitter/profile")
async def crawler_twitter_profile(request: TwitterProfileRequest):
    """Mock Twitter profile crawler"""
    return {
        "username": request.username,
        "display_name": f"{request.username.title()} (Test)",
        "bio": "OSINT researcher and threat analyst. Mock data from ODP stubs.",
        "followers_count": random.randint(100, 10000),
        "following_count": random.randint(50, 5000),
        "profile_picture": f"https://example.com/avatars/{request.username}.jpg",
        "verified": random.choice([True, False]),
        "created_at": (datetime.now() - timedelta(days=random.randint(365, 3650))).isoformat(),
        "recent_posts": [
            {
                "post_id": f"post_{i}",
                "text": random.choice(SAMPLE_POSTS),
                "created_at": (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat(),
                "likes": random.randint(0, 500),
                "retweets": random.randint(0, 100)
            }
            for i in range(5)
        ]
    }

@app.post("/crawlers/facebook/profile")
async def crawler_facebook_profile(request: FacebookProfileRequest):
    """Mock Facebook profile crawler"""
    return {
        "user_id": request.user_id,
        "name": f"User {request.user_id}",
        "about": "Security professional and OSINT enthusiast. Mock data.",
        "friends_count": random.randint(50, 2000),
        "profile_picture": f"https://example.com/fb/{request.user_id}.jpg",
        "location": random.choice(["San Francisco, CA", "New York, NY", "London, UK", "Berlin, Germany"]),
        "recent_posts": [
            {
                "post_id": f"fb_post_{i}",
                "text": random.choice(SAMPLE_POSTS),
                "timestamp": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                "likes": random.randint(0, 200),
                "comments": random.randint(0, 50)
            }
            for i in range(3)
        ]
    }

@app.post("/crawlers/linkedin/profile")
async def crawler_linkedin_profile(profile_url: str):
    """Mock LinkedIn profile crawler"""
    return {
        "profile_url": profile_url,
        "full_name": "Jane Doe",
        "headline": "Cybersecurity Analyst | Threat Intelligence | OSINT",
        "company": "TechCorp Security",
        "location": "San Francisco Bay Area",
        "connections": random.randint(500, 3000),
        "experience": [
            {
                "title": "Senior Security Analyst",
                "company": "TechCorp Security",
                "duration": "2021 - Present",
                "description": "Threat intelligence and OSINT research"
            },
            {
                "title": "Security Researcher",
                "company": "Previous Company",
                "duration": "2018 - 2021",
                "description": "Vulnerability research and analysis"
            }
        ],
        "skills": ["Threat Intelligence", "OSINT", "Cybersecurity", "Python", "Data Analysis"]
    }

# ============================================================================
# ML Model Stubs
# ============================================================================

@app.post("/ml/face_recognition")
async def ml_face_recognition(request: FaceRecognitionRequest):
    """Mock face recognition model"""
    return {
        "face_embeddings": [
            {
                "image_index": idx,
                "face_id": f"face_{idx}_{i}",
                "embedding": generate_mock_face_embedding(),
                "confidence": random.uniform(0.85, 0.99),
                "bbox": {
                    "x": random.randint(50, 200),
                    "y": random.randint(50, 200),
                    "width": random.randint(100, 300),
                    "height": random.randint(100, 300)
                }
            }
            for idx, img_url in enumerate(request.images)
            for i in range(random.randint(0, 2))  # 0-2 faces per image
        ]
    }

@app.post("/ml/sentiment_analysis")
async def ml_sentiment_analysis(request: SentimentAnalysisRequest):
    """Mock sentiment analysis model"""
    return {
        "sentiment_scores": [
            {
                "text_index": idx,
                "text": text[:50] + "..." if len(text) > 50 else text,
                "sentiment": random.choice(["positive", "negative", "neutral"]),
                "positive_score": random.uniform(0.0, 1.0),
                "negative_score": random.uniform(0.0, 1.0),
                "neutral_score": random.uniform(0.0, 1.0)
            }
            for idx, text in enumerate(request.texts)
        ]
    }

@app.post("/ml/ner")
async def ml_ner(texts: List[str]):
    """Mock named entity recognition model"""
    entity_types = ["PERSON", "ORG", "LOC", "DATE"]
    sample_entities = {
        "PERSON": ["John Smith", "Jane Doe", "Alice Johnson"],
        "ORG": ["TechCorp", "SecureNet", "CyberDefense Inc"],
        "LOC": ["San Francisco", "New York", "London"],
        "DATE": ["2024", "January 2025", "Q4 2024"]
    }

    return {
        "entities": [
            {
                "text_index": idx,
                "entity_text": random.choice(sample_entities[ent_type]),
                "entity_type": ent_type,
                "start_pos": random.randint(0, 50),
                "end_pos": random.randint(55, 100),
                "confidence": random.uniform(0.8, 0.99)
            }
            for idx, text in enumerate(texts)
            for ent_type in random.sample(entity_types, k=random.randint(1, 3))
        ]
    }

# ============================================================================
# Function Stubs
# ============================================================================

@app.post("/breach/lookup")
async def breach_db_lookup(request: BreachLookupRequest):
    """Mock breach database lookup"""
    # Simulate some emails having breaches
    has_breach = random.random() > 0.5

    if not has_breach:
        return {"email": request.email, "breaches": []}

    num_breaches = random.randint(1, 3)
    return {
        "email": request.email,
        "breaches": [
            {
                "breach_name": random.choice(SAMPLE_BREACHES),
                "breach_date": (datetime.now() - timedelta(days=random.randint(365, 3650))).strftime("%Y-%m-%d"),
                "data_classes": random.sample(
                    ["Emails", "Passwords", "Names", "Phone numbers", "Addresses"],
                    k=random.randint(2, 4)
                ),
                "password_leaked": random.choice([True, False]),
                "description": "Mock breach data from ODP stubs"
            }
            for _ in range(num_breaches)
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
