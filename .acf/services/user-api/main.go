package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gopkg.in/yaml.v3"
)

var (
	redisClient *redis.Client
	ctx         = context.Background()
)

// PipelineSubmission represents a submitted pipeline
type PipelineSubmission struct {
	PipelineID   string    `json:"pipeline_id"`
	WorkspaceID  string    `json:"workspace_id"`
	ProjectID    string    `json:"project_id"`
	YAMLContent  string    `json:"yaml_content"`
	Status       string    `json:"status"`
	SubmittedAt  time.Time `json:"submitted_at"`
}

// PipelineEvent represents an event published to Redis
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

	// Test Redis connection
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	} else {
		log.Println("✓ Connected to Redis")
	}

	// Setup Gin
	r := gin.Default()

	// Health check
	r.GET("/health", healthCheck)

	// Pipeline endpoints
	r.POST("/api/v1/pipelines", submitPipeline)
	r.GET("/api/v1/pipelines/:pipeline_id", getPipelineStatus)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("User API starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func healthCheck(c *gin.Context) {
	// Check Redis connection
	redisHealthy := false
	if redisClient != nil {
		if err := redisClient.Ping(ctx).Err(); err == nil {
			redisHealthy = true
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"service": "user-api",
		"redis_connected": redisHealthy,
	})
}

func submitPipeline(c *gin.Context) {
	// Read YAML from request body
	yamlContent, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// Parse YAML to validate it's valid
	var yamlSpec map[string]interface{}
	if err := yaml.Unmarshal(yamlContent, &yamlSpec); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid YAML format",
			"details": err.Error(),
		})
		return
	}

	// Extract metadata from YAML
	pipelineID, ok := yamlSpec["pipeline_id"].(string)
	if !ok {
		pipelineID = uuid.New().String()
	}

	workspaceID, ok := yamlSpec["workspace_id"].(string)
	if !ok {
		workspaceID = "workspace-test-001" // Default for local dev
	}

	projectID, ok := yamlSpec["project_id"].(string)
	if !ok {
		projectID = "project-test-001" // Default for local dev
	}

	// Publish event to Redis
	event := PipelineEvent{
		EventType:   "pipeline.submitted",
		PipelineID:  pipelineID,
		WorkspaceID: workspaceID,
		ProjectID:   projectID,
		YAMLSpec:    yamlSpec,
		Timestamp:   time.Now(),
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	// Publish to Redis (pipeline.submitted channel)
	if redisClient != nil {
		if err := redisClient.Publish(ctx, "pipeline.submitted", eventJSON).Err(); err != nil {
			log.Printf("Error publishing to Redis: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish event"})
			return
		}
		log.Printf("✓ Published pipeline.submitted event for pipeline: %s", pipelineID)
	} else {
		log.Println("Warning: Redis not connected, event not published")
	}

	// Return submission confirmation
	c.JSON(http.StatusCreated, gin.H{
		"pipeline_id": pipelineID,
		"workspace_id": workspaceID,
		"project_id": projectID,
		"status": "submitted",
		"message": "Pipeline submitted successfully",
		"temporal_ui": fmt.Sprintf("http://localhost:18088/namespaces/default/workflows/%s", pipelineID),
	})
}

func getPipelineStatus(c *gin.Context) {
	pipelineID := c.Param("pipeline_id")

	// TODO: Query Temporal for actual status
	// For now, return mock status
	c.JSON(http.StatusOK, gin.H{
		"pipeline_id": pipelineID,
		"status": "running",
		"message": "TODO: Query Temporal for actual status",
	})
}
