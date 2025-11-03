"""
Temporal Worker
Registers workflows and activities, polls for tasks
"""

import asyncio
import os
from temporalio.client import Client
from temporalio.worker import Worker

# Import workflow
from workflows.pipeline_workflow import PipelineWorkflow

# Import activities
from activities.crawler_activities import crawl_twitter, crawl_facebook, crawl_linkedin
from activities.ml_activities import run_face_recognition, run_sentiment_analysis, run_ner
from activities.function_activities import lookup_breach_db
from activities.event_activities import publish_event


async def main():
    # Get Temporal host
    temporal_host = os.getenv("TEMPORAL_HOST", "localhost:17233")

    # Connect to Temporal
    client = await Client.connect(temporal_host)

    print(f"✓ Connected to Temporal: {temporal_host}")

    # Create worker
    worker = Worker(
        client,
        task_queue="odp-tasks",
        workflows=[PipelineWorkflow],
        activities=[
            # Crawler activities
            crawl_twitter,
            crawl_facebook,
            crawl_linkedin,
            # ML activities
            run_face_recognition,
            run_sentiment_analysis,
            run_ner,
            # Function activities
            lookup_breach_db,
            # Event activities
            publish_event,
        ],
    )

    print("✓ Worker started, polling for tasks...")
    print("   Task Queue: odp-tasks")
    print("   Workflows: PipelineWorkflow")
    print("   Activities: 8 registered")

    # Run worker
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
