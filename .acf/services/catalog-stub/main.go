package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// Catalog represents the complete catalog structure
type Catalog struct {
	Methods  []Method `json:"methods"`
	Ontology Ontology `json:"ontology"`
}

// Method represents a crawler, ML model, or function
type Method struct {
	MethodID    string                 `json:"method_id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"` // crawler, ml_model, function
	Description string                 `json:"description"`
	Inputs      map[string]interface{} `json:"inputs"`
	Outputs     map[string]interface{} `json:"outputs"`
	Tags        []string               `json:"tags"`
}

// Ontology represents the data ontology
type Ontology struct {
	Entities []Entity `json:"entities"`
}

// Entity represents a data entity in the ontology
type Entity struct {
	EntityID    string                 `json:"entity_id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Schema      map[string]interface{} `json:"schema"`
}

var catalog Catalog

func main() {
	// Load catalog from file
	catalogFile := os.Getenv("CATALOG_FILE")
	if catalogFile == "" {
		catalogFile = "/data/stub-catalog.json"
	}

	data, err := os.ReadFile(catalogFile)
	if err != nil {
		log.Printf("Warning: Could not read catalog file %s: %v", catalogFile, err)
		log.Println("Using empty catalog")
		catalog = Catalog{
			Methods:  []Method{},
			Ontology: Ontology{Entities: []Entity{}},
		}
	} else {
		if err := json.Unmarshal(data, &catalog); err != nil {
			log.Fatalf("Failed to parse catalog JSON: %v", err)
		}
		log.Printf("Loaded %d methods and %d entities from catalog", len(catalog.Methods), len(catalog.Ontology.Entities))
	}

	// Setup Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "catalog-stub",
			"methods": len(catalog.Methods),
			"entities": len(catalog.Ontology.Entities),
		})
	})

	// Method Registry API
	r.GET("/api/v1/methods", listMethods)
	r.GET("/api/v1/methods/:method_id", getMethod)

	// Ontology API
	r.GET("/api/v1/ontology", getOntology)
	r.GET("/api/v1/ontology/entities/:entity_id", getEntity)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Catalog Stub starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func listMethods(c *gin.Context) {
	// Filter by type if provided
	methodType := c.Query("type")

	if methodType == "" {
		c.JSON(http.StatusOK, gin.H{
			"methods": catalog.Methods,
			"count":   len(catalog.Methods),
		})
		return
	}

	// Filter by type
	filtered := []Method{}
	for _, m := range catalog.Methods {
		if m.Type == methodType {
			filtered = append(filtered, m)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"methods": filtered,
		"count":   len(filtered),
		"filter":  methodType,
	})
}

func getMethod(c *gin.Context) {
	methodID := c.Param("method_id")

	for _, m := range catalog.Methods {
		if m.MethodID == methodID {
			c.JSON(http.StatusOK, m)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{
		"error": "Method not found",
		"method_id": methodID,
	})
}

func getOntology(c *gin.Context) {
	c.JSON(http.StatusOK, catalog.Ontology)
}

func getEntity(c *gin.Context) {
	entityID := c.Param("entity_id")

	for _, e := range catalog.Ontology.Entities {
		if e.EntityID == entityID {
			c.JSON(http.StatusOK, e)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{
		"error": "Entity not found",
		"entity_id": entityID,
	})
}
