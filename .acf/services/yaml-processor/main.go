package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.temporal.io/sdk/client"
)

var (
	redisClient   *redis.Client
	temporalClient client.Client
	ctx           = context.Background()
)

// PipelineEvent from Redis
type PipelineEvent struct {
	EventType   string                 `json:"event_type"`
	PipelineID  string                 `json:"pipeline_id"`
	WorkspaceID string                 `json:"workspace_id"`
	ProjectID   string                 `json:"project_id"`
	YAMLSpec    map[string]interface{} `json:"yaml_spec"`
	Timestamp   time.Time              `json:"timestamp"`
}

func main() {
	// Initialize Redis client
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:16379"
	}

	redisClient = redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("✓ Connected to Redis")

	// Initialize Temporal client
	temporalHost := os.Getenv("TEMPORAL_HOST")
	if temporalHost == "" {
		temporalHost = "localhost:17233"
	}

	var err error
	temporalClient, err = client.Dial(client.Options{
		HostPort: temporalHost,
	})
	if err != nil {
		log.Fatalf("Failed to connect to Temporal: %v", err)
	}
	defer temporalClient.Close()
	log.Println("✓ Connected to Temporal")

	// Start health check server in background
	go startHealthServer()

	// Subscribe to Redis pipeline.submitted events
	log.Println("Subscribing to pipeline.submitted events...")
	pubsub := redisClient.Subscribe(ctx, "pipeline.submitted")
	defer pubsub.Close()

	// Process events
	ch := pubsub.Channel()
	for msg := range ch {
		log.Printf("Received event from Redis: %s", msg.Payload)

		var event PipelineEvent
		if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
			log.Printf("Error parsing event: %v", err)
			continue
		}

		// Process event
		if err := processEvent(event); err != nil {
			log.Printf("Error processing event: %v", err)
			continue
		}
	}
}

func startHealthServer() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"service": "yaml-processor",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Health check server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Printf("Health server error: %v", err)
	}
}

func processEvent(event PipelineEvent) error {
	log.Printf("Processing pipeline: %s", event.PipelineID)

	// Submit workflow to Temporal
	workflowOptions := client.StartWorkflowOptions{
		ID:        event.PipelineID,
		TaskQueue: "odp-tasks",
	}

	// Execute workflow
	workflowRun, err := temporalClient.ExecuteWorkflow(
		ctx,
		workflowOptions,
		"PipelineWorkflow",  // Workflow name
		event.YAMLSpec,      // Workflow input
	)
	if err != nil {
		log.Printf("Error starting Temporal workflow: %v", err)
		return err
	}

	log.Printf("✓ Started Temporal workflow: %s (RunID: %s)", workflowRun.GetID(), workflowRun.GetRunID())

	// Publish confirmation event to Redis
	confirmEvent := map[string]interface{}{
		"event_type":   "pipeline.started",
		"pipeline_id":  event.PipelineID,
		"workspace_id": event.WorkspaceID,
		"project_id":   event.ProjectID,
		"workflow_id":  workflowRun.GetID(),
		"run_id":       workflowRun.GetRunID(),
		"timestamp":    time.Now(),
	}

	confirmJSON, _ := json.Marshal(confirmEvent)
	if err := redisClient.Publish(ctx, "pipeline.started", confirmJSON).Err(); err != nil {
		log.Printf("Warning: Failed to publish confirmation event: %v", err)
	}

	return nil
}
