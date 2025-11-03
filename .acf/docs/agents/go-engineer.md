# go-engineer Documentation Manifest

## Agent Identity

**Role**: Backend service implementation specialist for ODP platform Go services

**Technology Focus**:
- Go 1.21+ with Gin framework
- REST API design and implementation
- YAML processing and validation
- Redis integration (event bus, caching)
- Temporal Go client SDK
- PostgreSQL client libraries
- Microservice patterns

**Scope**: This agent IS responsible for implementing, testing, and maintaining all Go-based backend services in the ODP platform (user-api, yaml-processor, catalog-stub).

**Out of Scope**:
- Python services → python-ml-engineer
- Frontend applications → react-engineer
- Temporal workflow implementation (Python) → python-ml-engineer
- Kubernetes deployment → k8s-engineer
- Database schema design → database-engineer

---

## Priority 1: MUST READ (Core Domain)

**Load these docs immediately when receiving a task**:

1. **`docs/architecture/system-architecture.md`** → Backend Services section
   - Service boundaries and responsibilities
   - Communication patterns (REST, events)
   - Multi-tenancy architecture (workspace → project → pipeline)

2. **`docs/architecture/execution-platform.md`**
   - YAML DSL specification (critical for user-api and yaml-processor)
   - Pipeline execution flow (YAML → Temporal workflow conversion)
   - Method Registry integration pattern
   - Template resolution system (`{{step.field}}` syntax for data flow)

3. **`docs/architecture/identity-and-api.md`** → API Design section
   - REST API conventions and patterns
   - Authentication/authorization patterns (Keycloak in production, none in local dev)
   - Multi-tenant request context propagation

4. **`docs/architecture/local-vs-production.md`** → Backend Services
   - Environment-specific configurations
   - Local dev simplifications (no Keycloak, no Pulsar)
   - Feature flags for environment switching

5. **`docs/development/quality-gates.md`** → Go section
   - Mandatory quality commands (golangci-lint, go test, go build)
   - Coverage requirements (≥80% overall, 100% critical paths)
   - Pre-commit hook integration

---

## Priority 2: SHOULD READ (Supporting Context)

**Reference these docs regularly during development**:

1. **`docs/architecture/infrastructure.md`** → Service Infrastructure
   - Service discovery patterns
   - Health check implementation
   - Graceful shutdown patterns

2. **`docs/development/testing.md`** → Go Testing
   - Unit test patterns (table-driven tests)
   - Integration test setup (testcontainers for PostgreSQL, Redis)
   - Mock patterns (interfaces for external dependencies)

3. **`docs/development/workflow.md`** → Go Service Development
   - Local development setup (Docker Compose dev profile)
   - Service startup sequence
   - Debugging Go services in containers

4. **`docs/operations/troubleshooting.md`** → Go Services
   - Common errors and solutions
   - Debugging techniques (delve, logs, metrics)
   - Performance profiling (pprof)

5. **`docs/acf/backlog/task-template.md`**
   - Task structure and acceptance criteria format
   - Evidence requirements for completed tasks

---

## Priority 3: REFERENCE (Lookup as Needed)

**Lookup only when needed**:

1. **`docs/operations/deployment.md`** → Docker Compose
   - Service containerization (Dockerfile patterns)
   - Compose service definitions
   - Port mappings and network configuration

2. **`docs/operations/monitoring.md`** → Metrics Collection
   - Prometheus metrics instrumentation (for production)
   - Structured logging patterns (zerolog)
   - Distributed tracing (OpenTelemetry, production only)

3. **`docs/architecture/infrastructure.md`** → Event Bus
   - Redis pub/sub patterns (local dev)
   - Event schema design (for event publishing)

---

## Navigation Guidance

### For user-api Implementation
1. Read P1: `system-architecture.md` → user-api service
2. Read P1: `execution-platform.md` → YAML DSL validation flow
3. Read P1: `identity-and-api.md` → REST API patterns
4. Implement endpoints following Gin patterns
5. Add integration with catalog-stub (method validation)
6. Add Redis event publishing (pipeline submitted events)
7. Test with P2: `testing.md` → Integration tests
8. Verify with P1: `quality-gates.md` → Go commands

### For yaml-processor Implementation
1. Read P1: `execution-platform.md` → YAML to Temporal workflow mapping
2. Read P1: `system-architecture.md` → yaml-processor service
3. Implement YAML parsing (gopkg.in/yaml.v3)
4. Generate Temporal workflow specifications
5. Add validation against Method Registry
6. Test transformation logic (unit tests with fixtures)
7. Verify with P1: `quality-gates.md`

### For catalog-stub Maintenance
1. Read P1: `architecture/execution-platform.md` → Method Registry spec
2. Check existing implementation in `services/catalog-stub/`
3. Add new methods to stub data (`data/catalog-metadata/stub-catalog.json`)
4. Update API handlers if schema changes
5. Test with integration tests (user-api calling catalog-stub)

### For REST API Endpoint
1. Read P1: `identity-and-api.md` → REST conventions
2. Define request/response structs with JSON tags
3. Implement handler with Gin context
4. Add input validation (go-playground/validator)
5. Add error handling (standardized error responses)
6. Add unit tests (httptest for handlers)
7. Add integration tests (testcontainers for dependencies)
8. Document with OpenAPI comments (swag)

---

## Scope Boundaries

### This agent IS responsible for:
- Implementing user-api service (YAML submission, validation, routing)
- Implementing yaml-processor service (YAML → Temporal workflow generation)
- Maintaining catalog-stub service (Method Registry + Ontology API)
- Writing Go unit tests and integration tests
- Go service configuration (env vars, config files)
- REST API endpoint implementation
- Redis client integration (event publishing, caching)
- PostgreSQL client integration (metadata storage)
- Temporal Go client integration (workflow submission)
- Error handling and logging (zerolog)
- Service health checks and readiness probes

### This agent is NOT responsible for:
- Temporal workflow implementation (Python) → **python-ml-engineer**
- Dagster asset implementation → **data-engineer**
- Database schema design → **database-engineer**
- Kubernetes deployment configuration → **k8s-engineer**
- Frontend applications → **react-engineer**
- ML model integration → **ml-ops-engineer**
- Event bus infrastructure setup → **event-engineer**
- Docker Compose orchestration → **devops**

---

## Common Workflows

### Workflow 1: Implement New REST API Endpoint

1. **Read**:
   - P1: `identity-and-api.md` → REST API patterns
   - P1: `system-architecture.md` → Service responsibilities
   - P2: `testing.md` → Go testing patterns

2. **Implement**:
   ```go
   // Define request/response types
   type CreatePipelineRequest struct {
       Name        string `json:"name" binding:"required"`
       Description string `json:"description"`
       YAML        string `json:"yaml" binding:"required"`
   }

   type CreatePipelineResponse struct {
       PipelineID string `json:"pipeline_id"`
       Status     string `json:"status"`
   }

   // Implement handler
   func (h *Handler) CreatePipeline(c *gin.Context) {
       var req CreatePipelineRequest
       if err := c.ShouldBindJSON(&req); err != nil {
           c.JSON(400, gin.H{"error": err.Error()})
           return
       }

       // Business logic...

       c.JSON(201, CreatePipelineResponse{
           PipelineID: id,
           Status: "submitted",
       })
   }

   // Register route
   router.POST("/pipelines", h.CreatePipeline)
   ```

3. **Test**:
   ```go
   func TestCreatePipeline(t *testing.T) {
       // Table-driven test
       tests := []struct {
           name       string
           request    CreatePipelineRequest
           wantStatus int
           wantError  string
       }{
           {
               name: "valid pipeline",
               request: CreatePipelineRequest{
                   Name: "test",
                   YAML: validYAML,
               },
               wantStatus: 201,
           },
           {
               name: "missing name",
               request: CreatePipelineRequest{
                   YAML: validYAML,
               },
               wantStatus: 400,
               wantError: "Name is required",
           },
       }

       for _, tt := range tests {
           t.Run(tt.name, func(t *testing.T) {
               // Test implementation...
           })
       }
   }
   ```

4. **Verify**:
   ```bash
   golangci-lint run ./...
   go test ./... -v -race -cover
   go build ./...
   ```

### Workflow 2: Integrate with External Service (Redis, PostgreSQL, Temporal)

1. **Read**:
   - P1: `system-architecture.md` → Service communication patterns
   - P1: `local-vs-production.md` → Environment configuration
   - P2: `testing.md` → Integration testing with testcontainers

2. **Implement**:
   ```go
   // Define interface for dependency injection
   type EventBus interface {
       Publish(ctx context.Context, topic string, event interface{}) error
   }

   // Redis implementation
   type RedisEventBus struct {
       client *redis.Client
   }

   func (r *RedisEventBus) Publish(ctx context.Context, topic string, event interface{}) error {
       data, err := json.Marshal(event)
       if err != nil {
           return err
       }
       return r.client.Publish(ctx, topic, data).Err()
   }

   // Constructor with config
   func NewRedisEventBus(cfg *Config) (*RedisEventBus, error) {
       client := redis.NewClient(&redis.Options{
           Addr: cfg.RedisAddr,
       })
       return &RedisEventBus{client: client}, nil
   }
   ```

3. **Test** (with testcontainers):
   ```go
   func TestRedisEventBus(t *testing.T) {
       ctx := context.Background()

       // Start Redis container
       redisC, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
           ContainerRequest: testcontainers.ContainerRequest{
               Image: "redis:7-alpine",
               ExposedPorts: []string{"6379/tcp"},
           },
           Started: true,
       })
       require.NoError(t, err)
       defer redisC.Terminate(ctx)

       // Get connection details
       host, _ := redisC.Host(ctx)
       port, _ := redisC.MappedPort(ctx, "6379")

       // Test event bus
       bus := NewRedisEventBus(&Config{
           RedisAddr: fmt.Sprintf("%s:%s", host, port.Port()),
       })

       err = bus.Publish(ctx, "test-topic", map[string]string{"key": "value"})
       assert.NoError(t, err)
   }
   ```

### Workflow 3: YAML Processing and Validation

1. **Read**:
   - P1: `execution-platform.md` → YAML DSL specification
   - P1: `system-architecture.md` → Method Registry integration
   - P2: `testing.md` → YAML fixture patterns

2. **Implement**:
   ```go
   type Pipeline struct {
       Name        string   `yaml:"name"`
       Description string   `yaml:"description"`
       Sources     []Source `yaml:"sources"`
       Transforms  []Transform `yaml:"transforms"`
       Outputs     []Output `yaml:"outputs"`
   }

   func ParseYAML(yamlContent string) (*Pipeline, error) {
       var pipeline Pipeline
       if err := yaml.Unmarshal([]byte(yamlContent), &pipeline); err != nil {
           return nil, fmt.Errorf("invalid YAML: %w", err)
       }
       return &pipeline, nil
   }

   func ValidatePipeline(ctx context.Context, pipeline *Pipeline, catalogClient *CatalogClient) error {
       // Validate all methods exist in Method Registry
       for _, source := range pipeline.Sources {
           if exists, err := catalogClient.MethodExists(ctx, source.Method); err != nil {
               return err
           } else if !exists {
               return fmt.Errorf("unknown method: %s", source.Method)
           }
       }

       // Validate inputs reference existing sources/transforms
       // ... more validation ...

       return nil
   }
   ```

3. **Test**:
   ```go
   func TestYAMLParsing(t *testing.T) {
       yamlContent := `
   pipeline:
     name: "test-pipeline"
     sources:
       - name: "twitter-search"
         method: "social.twitter.search"
         params:
           query: "test"
   `

       pipeline, err := ParseYAML(yamlContent)
       require.NoError(t, err)
       assert.Equal(t, "test-pipeline", pipeline.Name)
       assert.Len(t, pipeline.Sources, 1)
   }
   ```

---

## Integration Points

### Receives work from:
- **task-engineer**: Task specifications for Go service implementation
- **lean-architect**: API contracts and service specifications

### Hands off work to:
- **python-ml-engineer**: Temporal workflow execution (after YAML → workflow conversion)
- **test-engineer**: Integration test implementation (after service implementation)
- **quality-reviewer**: Completed Go services for acceptance testing

### Collaborates with:
- **database-engineer**: PostgreSQL schema usage, query optimization
- **event-engineer**: Event schema design, Redis/Pulsar integration patterns
- **devops**: Service containerization, health check implementation

---

## Quality Gates

### Before marking task complete:
- [ ] All acceptance criteria met with evidence
- [ ] Go quality gates passed (see commands below)
- [ ] Unit tests written and passing (≥80% coverage)
- [ ] Integration tests written and passing (if external dependencies)
- [ ] Documentation updated (OpenAPI comments, README)
- [ ] Committed with conventional commit message (feat/fix/refactor)

### Go-Specific Quality Commands:
```bash
# Linting (zero errors, zero warnings)
golangci-lint run ./...

# Testing (all tests pass, race detection, coverage)
go test ./... -v -race -cover

# Build (successful compilation)
go build ./...

# Module tidiness
go mod tidy
go mod verify

# Optional: Vulnerability check
govulncheck ./...
```

### Coverage Requirements:
- **Overall**: ≥80% across statements, branches, functions
- **Critical paths**: 100% (API handlers, YAML processing, validation logic)
- **Integration tests**: Cover external dependencies (Redis, PostgreSQL, Temporal client)

---

## Quick Reference

### Common Commands

```bash
# Start local development (dev profile with Go services)
make start PROFILE=dev

# Check service health
make health

# Run specific service
cd services/user-api && go run main.go

# Run tests with coverage report
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out

# Lint with auto-fix
golangci-lint run --fix ./...

# Build all services
for svc in user-api yaml-processor catalog-stub; do
  cd services/$svc && go build -o bin/$svc
done

# Generate OpenAPI spec (if using swag)
swag init -g main.go
```

### Code Patterns

**Standard Gin handler with error handling:**
```go
func (h *Handler) GetPipeline(c *gin.Context) {
    pipelineID := c.Param("id")

    pipeline, err := h.service.GetPipeline(c.Request.Context(), pipelineID)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            c.JSON(404, gin.H{"error": "pipeline not found"})
            return
        }
        log.Error().Err(err).Str("pipeline_id", pipelineID).Msg("failed to get pipeline")
        c.JSON(500, gin.H{"error": "internal server error"})
        return
    }

    c.JSON(200, pipeline)
}
```

**Dependency injection pattern:**
```go
type Service struct {
    db       *sql.DB
    redis    *redis.Client
    temporal temporal.Client
    catalog  *CatalogClient
}

func NewService(db *sql.DB, redis *redis.Client, temporal temporal.Client, catalog *CatalogClient) *Service {
    return &Service{
        db:       db,
        redis:    redis,
        temporal: temporal,
        catalog:  catalog,
    }
}
```

**Table-driven tests:**
```go
func TestValidatePipeline(t *testing.T) {
    tests := []struct {
        name       string
        pipeline   *Pipeline
        wantErr    bool
        errMessage string
    }{
        {
            name: "valid pipeline",
            pipeline: &Pipeline{
                Name: "test",
                Sources: []Source{{Name: "s1", Method: "valid.method"}},
            },
            wantErr: false,
        },
        {
            name: "invalid method",
            pipeline: &Pipeline{
                Name: "test",
                Sources: []Source{{Name: "s1", Method: "invalid.method"}},
            },
            wantErr: true,
            errMessage: "unknown method",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidatePipeline(context.Background(), tt.pipeline, mockCatalog)
            if tt.wantErr {
                require.Error(t, err)
                assert.Contains(t, err.Error(), tt.errMessage)
            } else {
                require.NoError(t, err)
            }
        })
    }
}
```

---

## Anti-Patterns

### DON'T:

❌ **Use `panic()` in production code**
- Why: Crashes the entire service, affects all users
- Instead: Return errors, handle gracefully, log with context

❌ **Ignore context cancellation**
```go
// WRONG
func SlowOperation(ctx context.Context) error {
    time.Sleep(10 * time.Second)  // Ignores ctx.Done()
    return nil
}

// RIGHT
func SlowOperation(ctx context.Context) error {
    select {
    case <-time.After(10 * time.Second):
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

❌ **Hard-code environment-specific values**
```go
// WRONG
redisClient := redis.NewClient(&redis.Options{
    Addr: "localhost:6379",  // Breaks in production
})

// RIGHT
redisClient := redis.NewClient(&redis.Options{
    Addr: cfg.RedisAddr,  // From config/env
})
```

❌ **Use global variables for state**
- Why: Not thread-safe, hard to test, breaks dependency injection
- Instead: Use struct fields, dependency injection

❌ **Skip error checking**
```go
// WRONG
data, _ := json.Marshal(obj)

// RIGHT
data, err := json.Marshal(obj)
if err != nil {
    return fmt.Errorf("marshal failed: %w", err)
}
```

❌ **Log sensitive data (API keys, user data)**
```go
// WRONG
log.Info().Str("api_key", apiKey).Msg("processing")

// RIGHT
log.Info().Str("api_key", maskKey(apiKey)).Msg("processing")
```

### DO:

✅ **Use structured logging (zerolog)**
```go
log.Info().
    Str("pipeline_id", id).
    Str("workspace_id", workspaceID).
    Int("source_count", len(sources)).
    Msg("pipeline submitted")
```

✅ **Validate inputs at API boundary**
```go
type CreateRequest struct {
    Name string `json:"name" binding:"required,min=3,max=100"`
    YAML string `json:"yaml" binding:"required"`
}

if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": err.Error()})
    return
}
```

✅ **Use interfaces for testability**
```go
type CatalogClient interface {
    MethodExists(ctx context.Context, method string) (bool, error)
}

// Easy to mock in tests
type MockCatalogClient struct {
    MethodExistsFn func(ctx context.Context, method string) (bool, error)
}
```

✅ **Propagate context through call chain**
```go
func (s *Service) ProcessPipeline(ctx context.Context, pipeline *Pipeline) error {
    // Pass ctx to all downstream calls
    if err := s.validate(ctx, pipeline); err != nil {
        return err
    }
    return s.submit(ctx, pipeline)
}
```

---

**Last Updated**: 2025-10-27
**Document Owner**: go-engineer
