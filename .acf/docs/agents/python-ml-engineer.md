# python-ml-engineer Documentation Manifest

## Agent Identity

**Role**: Python ML services and Temporal workflow implementation specialist

**Technology Focus**:
- Python 3.11+ with FastAPI and LangGraph
- Temporal Python SDK (workflows and activities)
- LangGraph for agent orchestration
- Async/await patterns
- ML model integration (API clients for crawlers, models)
- Event-driven architecture (Redis pub/sub)

**Scope**: This agent IS responsible for implementing Python-based ML services (agent-orchestrator), Temporal workflows/activities for pipeline execution, and integration with external ML/crawler APIs.

**Out of Scope**:
- Go backend services → go-engineer
- Model training and serving → ml-ops-engineer
- Data pipeline orchestration (Dagster) → data-engineer
- Frontend applications → react-engineer
- Kubernetes deployment → k8s-engineer

---

## Priority 1: MUST READ (Core Domain)

**Load these docs immediately when receiving a task**:

1. **`docs/architecture/ml-platform.md`**
   - LangGraph agent architecture
   - Agent workflows (ReAct, planning, tool use)
   - Natural language → YAML pipeline generation
   - LLM integration patterns

2. **`docs/architecture/execution-platform.md`**
   - Temporal workflow patterns
   - Pipeline execution flow (YAML → workflow → activities)
   - Activity design (API calls, event publishing)
   - Error handling and retry policies
   - Template resolution in workflows (`{{step.field}}` syntax processing)

3. **`docs/architecture/system-architecture.md`** → ML & Execution layers
   - agent-orchestrator service responsibilities
   - Temporal workflow service architecture
   - Event-driven communication patterns

4. **`docs/development/quality-gates.md`** → Python section
   - Mandatory quality commands (ruff, mypy, pytest)
   - Coverage requirements (≥80% overall, 100% critical paths)
   - Type hint requirements (strict mypy)

5. **`docs/architecture/local-vs-production.md`** → Python Services
   - Environment-specific configurations
   - LLM API endpoint configuration (local stub vs production)
   - Event bus differences (Redis local, Pulsar production)

---

## Priority 2: SHOULD READ (Supporting Context)

**Reference these docs regularly during development**:

1. **`docs/development/testing.md`** → Python Testing
   - pytest patterns (fixtures, parametrize, async tests)
   - Mocking external APIs (LLM, crawlers, models)
   - Temporal workflow testing (test environments)

2. **`docs/architecture/infrastructure.md`** → Event Bus
   - Redis pub/sub patterns (local dev)
   - Pulsar multi-consumer patterns (production)
   - Event schema design (Avro)

3. **`docs/development/workflow.md`** → Python Development
   - Local development setup (Poetry, virtual environments)
   - Service startup sequence
   - Debugging Python services (debugpy, logs)

4. **`docs/operations/troubleshooting.md`** → Python Services
   - Common errors (async, LangGraph, Temporal)
   - Debugging techniques
   - Performance profiling (cProfile, py-spy)

5. **`docs/acf/backlog/task-template.md`**
   - Task structure and acceptance criteria
   - Evidence requirements

---

## Priority 3: REFERENCE (Lookup as Needed)

**Lookup only when needed**:

1. **`docs/operations/deployment.md`** → Docker
   - Python service containerization
   - Multi-stage Dockerfile patterns
   - Dependency management in containers

2. **`docs/operations/monitoring.md`** → Metrics & Logging
   - Structured logging (structlog)
   - Prometheus metrics (for production)
   - Distributed tracing (OpenTelemetry)

3. **`docs/architecture/ml-platform.md`** → Advanced Patterns
   - Multi-agent collaboration
   - Agent memory and state management
   - Prompt engineering techniques

---

## Navigation Guidance

### For agent-orchestrator Implementation (LangGraph)
1. Read P1: `ml-platform.md` → LangGraph architecture
2. Read P1: `ml-platform.md` → Natural language → YAML generation
3. Implement LangGraph graph with nodes:
   - User input parser
   - Method Registry query (tool use)
   - YAML generator
   - Validator
4. Add LLM integration (OpenAI/Anthropic client)
5. Test with P2: `testing.md` → Mocking LLM responses
6. Verify with P1: `quality-gates.md` → Python commands

### For Temporal Workflow Implementation
1. Read P1: `execution-platform.md` → Workflow patterns
2. Read P1: `execution-platform.md` → Activity design
3. Define workflow class with `@workflow.defn`
4. Define activity functions with `@activity.defn`
5. Implement error handling (retry policies, timeouts)
6. Add event publishing (pipeline state changes)
7. Test with Temporal test environment
8. Verify with P1: `quality-gates.md`

### For External API Integration (Crawlers, ML Models)
1. Read P1: `system-architecture.md` → External integration layer
2. Read P1: `local-vs-production.md` → Stub vs real APIs
3. Define async client class (httpx)
4. Implement retry logic (tenacity)
5. Add circuit breaker pattern (for production)
6. Test with P2: `testing.md` → Mock HTTP responses
7. Use stubs service for local dev

### For Event Publishing
1. Read P2: `infrastructure.md` → Event bus patterns
2. Implement Redis publisher (local dev)
3. Define event schemas (Pydantic models)
4. Publish lifecycle events (submitted, started, completed, failed)
5. Test event delivery with Redis subscriber

---

## Scope Boundaries

### This agent IS responsible for:
- Implementing agent-orchestrator service (LangGraph workflows)
- Implementing Temporal workflows (pipeline execution)
- Implementing Temporal activities (API calls, event publishing)
- Writing Python unit tests and async integration tests
- LangGraph graph design and tool integration
- LLM client integration (OpenAI, Anthropic)
- External API client implementation (crawlers, ML models)
- Redis event publishing (pipeline lifecycle)
- Async/await patterns and concurrency
- Error handling and retry logic
- Structured logging (structlog)

### This agent is NOT responsible for:
- Go backend services → **go-engineer**
- Model training and serving (BentoML) → **ml-ops-engineer**
- Data pipeline orchestration (Dagster) → **data-engineer**
- Database schema design → **database-engineer**
- Kubernetes deployment → **k8s-engineer**
- Frontend applications → **react-engineer**
- Event bus infrastructure setup → **event-engineer**

---

## Common Workflows

### Workflow 1: Implement Temporal Workflow for Pipeline Execution

1. **Read**:
   - P1: `execution-platform.md` → Workflow design patterns
   - P1: `system-architecture.md` → Pipeline execution flow
   - P2: `testing.md` → Temporal workflow testing

2. **Implement**:
   ```python
   from temporalio import workflow, activity
   from datetime import timedelta
   from typing import List

   @workflow.defn
   class PipelineExecutionWorkflow:
       @workflow.run
       async def run(self, pipeline_spec: PipelineSpec) -> PipelineResult:
           # Execute sources in parallel
           source_results = await workflow.execute_activity(
               execute_sources,
               pipeline_spec.sources,
               start_to_close_timeout=timedelta(minutes=10),
               retry_policy=RetryPolicy(
                   maximum_attempts=3,
                   backoff_coefficient=2.0,
               ),
           )

           # Execute transforms sequentially
           transform_results = []
           for transform in pipeline_spec.transforms:
               result = await workflow.execute_activity(
                   execute_transform,
                   transform,
                   start_to_close_timeout=timedelta(minutes=5),
               )
               transform_results.append(result)

           # Publish completion event
           await workflow.execute_activity(
               publish_event,
               PipelineCompletedEvent(
                   pipeline_id=pipeline_spec.id,
                   status="completed",
               ),
               start_to_close_timeout=timedelta(seconds=30),
           )

           return PipelineResult(
               sources=source_results,
               transforms=transform_results,
           )

   @activity.defn
   async def execute_sources(sources: List[Source]) -> List[SourceResult]:
       results = []
       async with httpx.AsyncClient() as client:
           for source in sources:
               # Call crawler API
               response = await client.post(
                   f"{CRAWLER_API_URL}/{source.method}",
                   json=source.params,
               )
               results.append(SourceResult.from_response(response))
       return results
   ```

3. **Test**:
   ```python
   import pytest
   from temporalio.testing import WorkflowEnvironment

   @pytest.mark.asyncio
   async def test_pipeline_execution_workflow():
       async with WorkflowEnvironment() as env:
           # Register workflow and activities
           await env.worker.register_workflow(PipelineExecutionWorkflow)
           await env.worker.register_activity(execute_sources)

           # Run workflow
           result = await env.client.execute_workflow(
               PipelineExecutionWorkflow.run,
               pipeline_spec,
               id="test-workflow-1",
               task_queue="test-queue",
           )

           assert result.sources is not None
           assert len(result.sources) == 2
   ```

4. **Verify**:
   ```bash
   ruff check .
   mypy .
   pytest --cov=services/execution/workflows
   ```

### Workflow 2: Implement LangGraph Agent for YAML Generation

1. **Read**:
   - P1: `ml-platform.md` → LangGraph architecture
   - P1: `ml-platform.md` → Natural language → YAML
   - P2: `testing.md` → Mocking LLM

2. **Implement**:
   ```python
   from langgraph.graph import StateGraph
   from langchain_core.messages import HumanMessage, AIMessage
   from pydantic import BaseModel
   from typing import TypedDict, Annotated, Sequence

   class AgentState(TypedDict):
       messages: Annotated[Sequence[BaseModel], "The conversation messages"]
       yaml_draft: str | None
       validation_errors: list[str] | None

   def parse_user_input(state: AgentState) -> AgentState:
       """Parse user's natural language request"""
       user_message = state["messages"][-1].content

       # Call LLM to extract intent
       response = llm.invoke([
           SystemMessage("Extract pipeline intent from user request"),
           HumanMessage(user_message),
       ])

       state["messages"].append(AIMessage(response.content))
       return state

   def query_method_registry(state: AgentState) -> AgentState:
       """Query catalog for available methods"""
       # Use LangGraph tool calling
       methods = catalog_tool.invoke({"query": "social media search"})
       state["messages"].append(AIMessage(f"Found methods: {methods}"))
       return state

   def generate_yaml(state: AgentState) -> AgentState:
       """Generate YAML pipeline from conversation"""
       conversation_context = "\n".join([msg.content for msg in state["messages"]])

       yaml_prompt = f"""
       Generate ODP YAML pipeline from this conversation:
       {conversation_context}

       Use only methods from the catalog.
       """

       yaml_response = llm.invoke([HumanMessage(yaml_prompt)])
       state["yaml_draft"] = yaml_response.content
       return state

   def validate_yaml(state: AgentState) -> AgentState:
       """Validate generated YAML"""
       try:
           pipeline = parse_yaml(state["yaml_draft"])
           errors = validate_pipeline(pipeline)
           state["validation_errors"] = errors
       except Exception as e:
           state["validation_errors"] = [str(e)]
       return state

   # Build graph
   graph = StateGraph(AgentState)
   graph.add_node("parse_input", parse_user_input)
   graph.add_node("query_registry", query_method_registry)
   graph.add_node("generate_yaml", generate_yaml)
   graph.add_node("validate", validate_yaml)

   graph.add_edge("parse_input", "query_registry")
   graph.add_edge("query_registry", "generate_yaml")
   graph.add_edge("generate_yaml", "validate")

   graph.set_entry_point("parse_input")

   agent = graph.compile()
   ```

3. **Test**:
   ```python
   @pytest.mark.asyncio
   async def test_yaml_generation_agent(mock_llm):
       initial_state = {
           "messages": [HumanMessage("Find Twitter posts about AI")],
           "yaml_draft": None,
           "validation_errors": None,
       }

       result = await agent.ainvoke(initial_state)

       assert result["yaml_draft"] is not None
       assert "twitter.search" in result["yaml_draft"]
       assert result["validation_errors"] == []
   ```

### Workflow 3: Implement Async External API Client

1. **Read**:
   - P1: `system-architecture.md` → External integration
   - P2: `testing.md` → Mocking HTTP
   - P1: `local-vs-production.md` → Stub vs real

2. **Implement**:
   ```python
   import httpx
   from tenacity import retry, stop_after_attempt, wait_exponential
   from pydantic import BaseModel

   class CrawlerClient:
       def __init__(self, base_url: str, timeout: float = 30.0):
           self.base_url = base_url
           self.client = httpx.AsyncClient(timeout=timeout)

       @retry(
           stop=stop_after_attempt(3),
           wait=wait_exponential(multiplier=1, min=2, max=10),
       )
       async def search_twitter(
           self,
           query: str,
           max_results: int = 100
       ) -> list[Tweet]:
           response = await self.client.post(
               f"{self.base_url}/social/twitter/search",
               json={"query": query, "max_results": max_results},
           )
           response.raise_for_status()

           data = response.json()
           return [Tweet(**item) for item in data["results"]]

       async def close(self):
           await self.client.aclose()

   class Tweet(BaseModel):
       id: str
       text: str
       author: str
       created_at: str
   ```

3. **Test** (with httpx mock):
   ```python
   import pytest
   from httpx import AsyncClient, Response
   from pytest_httpx import HTTPXMock

   @pytest.mark.asyncio
   async def test_search_twitter(httpx_mock: HTTPXMock):
       # Mock HTTP response
       httpx_mock.add_response(
           method="POST",
           url="http://stubs:8002/social/twitter/search",
           json={
               "results": [
                   {"id": "1", "text": "AI is great", "author": "user1", "created_at": "2025-01-01"},
               ]
           },
       )

       client = CrawlerClient(base_url="http://stubs:8002")
       tweets = await client.search_twitter("AI", max_results=10)

       assert len(tweets) == 1
       assert tweets[0].text == "AI is great"
   ```

---

## Integration Points

### Receives work from:
- **task-engineer**: Task specifications for Python service implementation
- **lean-architect**: Workflow specifications, agent design

### Hands off work to:
- **ml-ops-engineer**: ML model serving requirements
- **data-engineer**: Data transformation requirements (Dagster)
- **test-engineer**: Integration test implementation
- **quality-reviewer**: Completed Python services for acceptance

### Collaborates with:
- **go-engineer**: YAML → Temporal workflow handoff
- **event-engineer**: Event schema design
- **temporal-engineer**: Workflow pattern design

---

## Quality Gates

### Before marking task complete:
- [ ] All acceptance criteria met with evidence
- [ ] Python quality gates passed (see commands below)
- [ ] Unit tests written and passing (≥80% coverage)
- [ ] Async integration tests written (if external APIs)
- [ ] Type hints on all functions (strict mypy compliance)
- [ ] Documentation updated (docstrings, README)
- [ ] Committed with conventional commit message

### Python-Specific Quality Commands:
```bash
# Linting and formatting (zero errors)
ruff check .
ruff format .

# Type checking (strict mode, zero errors)
mypy . --strict

# Testing (all tests pass, ≥80% coverage)
pytest --cov --cov-report=term --cov-fail-under=80

# Optional: Security check
bandit -r services/
```

### Coverage Requirements:
- **Overall**: ≥80% across all files
- **Critical paths**: 100% (workflows, activities, agent logic)
- **Async code**: Must include async integration tests

---

## Quick Reference

### Common Commands

```bash
# Start local development (full profile with Python services)
make start PROFILE=full

# Run specific service
cd services/agent-orchestrator && poetry run python main.py

# Run tests with coverage
pytest --cov --cov-report=html
open htmlcov/index.html

# Type check
mypy .

# Lint and format
ruff check --fix .
ruff format .

# Install dependencies
cd services/agent-orchestrator && poetry install
```

### Code Patterns

**Async context manager for cleanup:**
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_client():
    client = httpx.AsyncClient()
    try:
        yield client
    finally:
        await client.aclose()

async with get_client() as client:
    response = await client.get("https://api.example.com")
```

**Pydantic models for API requests/responses:**
```python
from pydantic import BaseModel, Field

class PipelineSpec(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = ""
    sources: list[Source]
    transforms: list[Transform] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "twitter-investigation",
                "sources": [{"name": "tweets", "method": "social.twitter.search"}],
            }
        }
    }
```

**Structured logging:**
```python
import structlog

log = structlog.get_logger()

log.info(
    "pipeline_submitted",
    pipeline_id=pipeline_id,
    workspace_id=workspace_id,
    source_count=len(sources),
)
```

---

## Anti-Patterns

### DON'T:

❌ **Use `asyncio.run()` inside async functions**
```python
# WRONG
async def process():
    result = asyncio.run(some_async_function())  # Nested event loop error

# RIGHT
async def process():
    result = await some_async_function()
```

❌ **Ignore type hints (use Any)**
```python
# WRONG
def process(data: Any) -> Any:
    return data

# RIGHT
def process(data: PipelineSpec) -> PipelineResult:
    return PipelineResult(...)
```

❌ **Use synchronous libraries in async code**
```python
# WRONG
import requests
async def fetch():
    response = requests.get(url)  # Blocks event loop

# RIGHT
import httpx
async def fetch():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
```

❌ **Hard-code API endpoints**
```python
# WRONG
LLM_API = "https://api.openai.com/v1"

# RIGHT
LLM_API = os.getenv("LLM_API_URL", "http://stubs:8002/llm")
```

### DO:

✅ **Use async context managers for resources**
```python
async with httpx.AsyncClient() as client:
    response = await client.post(url, json=data)
```

✅ **Add type hints everywhere (strict mypy)**
```python
async def execute_workflow(
    pipeline: PipelineSpec,
    timeout: timedelta = timedelta(minutes=30),
) -> PipelineResult:
    ...
```

✅ **Use Pydantic for validation**
```python
class Source(BaseModel):
    name: str
    method: str
    params: dict[str, Any] = {}

    @validator("method")
    def validate_method(cls, v):
        if not re.match(r"^\w+\.\w+\.\w+$", v):
            raise ValueError("Invalid method format")
        return v
```

✅ **Test async code properly**
```python
@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result == expected
```

---

**Last Updated**: 2025-10-27
**Document Owner**: python-ml-engineer
