# Testing Strategy

## Test Pyramid

```
      /\
     /E2E\      (Few - critical user journeys)
    /------\
   /Integ. \    (Some - service boundaries)
  /----------\
 /Unit Tests  \  (Many - business logic)
/==============\
```

## Go Testing

**Unit Tests** (table-driven):
```go
func TestValidatePipeline(t *testing.T) {
    tests := []struct {
        name    string
        input   *Pipeline
        wantErr bool
    }{
        {"valid", validPipeline, false},
        {"invalid method", invalidPipeline, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidatePipeline(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("got error %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

**Integration Tests** (testcontainers):
```go
func TestRedisIntegration(t *testing.T) {
    ctx := context.Background()
    redisC, _ := testcontainers.GenericContainer(ctx, ...)
    defer redisC.Terminate(ctx)
    // Test with real Redis
}
```

## Python Testing

**Unit Tests** (pytest):
```python
@pytest.mark.asyncio
async def test_workflow():
    result = await execute_workflow(pipeline_spec)
    assert result.status == "completed"
```

### Template Resolution Testing

**Unit Tests** (`tests/unit/workflows/test_template_resolution.py`):

```python
def test_basic_field_resolution():
    """Test {{step.field}} resolves to step's field value"""
    inputs = {"text": {"from": "{{twitter.username}}"}}
    previous_results = {"twitter": {"username": "alice"}}

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"text": "alice"}

def test_array_splat_operator():
    """Test {{step.items[*].field}} extracts field from all array items"""
    inputs = {"texts": {"from": "{{twitter.posts[*].text}}"}}
    previous_results = {
        "twitter": {
            "posts": [
                {"text": "First post", "id": 1},
                {"text": "Second post", "id": 2}
            ]
        }
    }

    resolved = workflow.resolve_inputs(inputs, previous_results)

    assert resolved == {"texts": ["First post", "Second post"]}

def test_missing_step_error():
    """Test clear error when referenced step doesn't exist"""
    inputs = {"text": {"from": "{{nonexistent.field}}"}}
    previous_results = {"other": {}}

    with pytest.raises(ValueError, match="Step 'nonexistent' not found"):
        workflow.resolve_inputs(inputs, previous_results)
```

**Integration Tests** (workflow + template resolution):

```python
@pytest.mark.asyncio
async def test_workflow_with_templates():
    """Test full workflow execution with template resolution"""
    pipeline = {
        "steps": [
            {
                "id": "collect_twitter",
                "type": "crawler",
                "method": "crawler_twitter_profile",
                "inputs": {"username": {"from": "alice"}}
            },
            {
                "id": "analyze_sentiment",
                "type": "ml_model",
                "model": "sentiment_analysis_v1",
                "inputs": {
                    "texts": {"from": "{{collect_twitter.recent_posts[*].text}}"}
                },
                "depends_on": ["collect_twitter"]
            }
        ]
    }

    result = await execute_workflow(pipeline)

    assert result.steps["analyze_sentiment"].inputs["texts"] == [
        "First tweet", "Second tweet"
    ]
```

**Test Coverage**: 46 unit tests covering:
- Basic/nested/array template resolution
- Error handling (missing steps, invalid paths, type mismatches)
- Edge cases (null values, empty lists, deep nesting)
- Recursive resolution in lists/dicts

**See**: Complete test suite in `tests/unit/workflows/test_template_resolution.py`

---

**Mocking** (pytest-mock, httpx-mock):
```python
@pytest.mark.asyncio
async def test_api_client(httpx_mock):
    httpx_mock.add_response(json={"result": "success"})
    client = CrawlerClient()
    result = await client.search("query")
    assert result == "success"
```

## Coverage Requirements

- ≥80% overall
- 100% for critical paths (handlers, workflows, business logic)

---

**Last Updated**: 2025-10-27
