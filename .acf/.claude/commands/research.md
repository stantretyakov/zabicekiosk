# research - Ultra-intelligent context-aware research command

## Command

Performs deep, project-specific research with parallel execution and synthesized documentation.

### Arguments:

```
$ARGUMENTS
```

## Execution Protocol

### Phase 1: Ultra-Context Analysis

**MANDATORY**: Ultra-think about the current project FIRST.

1. **Project Analysis**:

   ```
   - Read README.md, CLAUDE.md, Makefile
   - Understand tech stack (Go, Python/LangGraph, Temporal, Dagster, Delta Lake)
   - Map business domain (AI-Native OSINT intelligence platform)
   - Identify existing docs/ structure
   - Analyze current challenges
   ```

2. **Context Extraction**:

   ```
   - Core features and capabilities (YAML DSL, agent orchestration, pipeline execution)
   - Technical architecture patterns (microservices, event-driven, Temporal workflows)
   - Integration points (crawlers, ML models, data lake, vector store)
   - Performance requirements (300M requests/month, 10K concurrent workflows)
   - Security constraints (multi-tenant, Keycloak RBAC)
   - Design analysis: If Figma URLs provided, extract UI/UX requirements
   ```

3. **Gap Identification**:
   ```
   - Missing knowledge areas
   - Outdated implementations
   - Performance bottlenecks
   - Security vulnerabilities
   - Scalability concerns
   ```

### 🎨 Figma MCP Integration (When Applicable)

**USE FIGMA TOOLS (mcp__figma-dev-mode-mcp-server) for UI/UX research:**

**Node ID Extraction:**
```
URL: https://figma.com/design/:fileKey/:fileName?node-id=1-2
Extract: nodeId = "1:2" (replace - with :)
```

**Design Analysis Calls:**
```javascript
// Component code
mcp__figma-dev-mode-mcp-server__get_code {
  nodeId: "123:456",
  clientFrameworks: "react",
  clientLanguages: "typescript,html,css"
}

// Design tokens
mcp__figma-dev-mode-mcp-server__get_variable_defs {
  nodeId: "123:456"
}

// Screenshot for docs
mcp__figma-dev-mode-mcp-server__get_screenshot {
  nodeId: "123:456"
}
```

**Integration Protocol:**
1. **ALWAYS** use Figma when URL/node in research scope
2. **EXTRACT** node IDs before calling tools
3. **INCLUDE** design insights in research document
4. **REFERENCE** specific nodes in recommendations

### Phase 2: Research Plan Construction

**Build research plan SPECIFIC to ODP platform**:

1. **Relevance Filtering**:

   - ONLY topics relevant to ODP OSINT intelligence platform
   - Focus on actual project needs (YAML processing, Temporal workflows, data pipelines, vector search)

2. **Todo Generation** (SINGLE TodoWrite):
   ```javascript
   TodoWrite { todos: [
     { content: "Research Temporal workflow patterns for long-running OSINT pipelines", ... },
     { content: "Research LangGraph best practices for agent orchestration", ... },
     { content: "Research Delta Lake medallion architecture (Bronze/Silver/Gold)", ... },
     { content: "Research Qdrant vector search for semantic investigation", ... },
     { content: "Research Apache Pulsar vs Redis for event bus at scale", ... },
     { content: "Research Go microservice patterns with Gin framework", ... },
     { content: "Research BentoML model serving for face recognition/NER", ... },
     { content: "Research GKE multi-zone HA for 99.99% availability", ... }
   ]}
   ```

### Phase 3: Parallel Research Execution

**SINGLE message with multiple research agent spawns**:

```javascript
Message:
  Task {
    subagent_type: "general-purpose",
    prompt: "Research Temporal.io workflow patterns for durable OSINT pipeline execution: saga patterns, long-running workflows, error handling, retry strategies 2024-2025"
  }
  Task {
    subagent_type: "general-purpose",
    prompt: "Research LangGraph agent orchestration patterns: graph design, tool use, memory management, multi-agent collaboration 2024-2025"
  }
  Task {
    subagent_type: "general-purpose",
    prompt: "Research Delta Lake medallion architecture: Bronze/Silver/Gold transformations, schema evolution, time travel, performance optimization"
  }
  // ... more parallel research tasks
```

### Phase 4: Synthesis and Documentation

**Create ONE comprehensive document**:

1. **Document Structure**:

   ```markdown
   # Research: [Topic] for ODP Platform

   ## Executive Summary
   - Key findings (3-5 bullets)
   - Immediate recommendations
   - Implementation impact

   ## Project Context
   - Current ODP architecture
   - Why this research matters
   - Specific ODP use cases

   ## Research Findings
   ### Finding 1: [Topic]
   #### Evidence
   - Source 1 (URL, date)
   - Source 2 (URL, date)
   #### Application to ODP
   - How it applies to YAML processor / workflows / data lake
   - Implementation considerations

   ## Comparative Analysis
   | Approach | Pros | Cons | Fit for ODP |

   ## Recommendations
   ### Immediate (Week 1)
   ### Short-term (Month 1)
   ### Long-term (Quarter 1)

   ## References
   ### Primary Sources
   ### Code Examples
   ### Documentation
   ```

2. **Research Style**:
   - Follow `docs/acf/style/research-documents.md`
   - Evidence-based (URLs, dates, sources)
   - Quantified comparisons
   - ODP-specific application
   - NO marketing language

3. **Save Location**:
   ```
   docs/research/[timestamp]-[topic].md
   ```

### Phase 5: Action Items

**Extract actionable tasks**:

1. **Identify tasks** from research findings
2. **Use task-engineer** to create structured tasks in `.backlog/pending/`
3. **Assign to appropriate agents** (go-engineer, python-ml-engineer, data-engineer, etc.)

## Critical Rules

**MANDATORY**:
- Ultra-context analysis BEFORE research
- ODP-specific focus (YAML DSL, Temporal, Dagster, Delta Lake, vector search)
- Parallel research execution (SINGLE message, multiple agents)
- Synthesize into ONE document
- Evidence-based style (no marketing fluff)
- Create actionable tasks from findings

**FORBIDDEN**:
- Generic research without ODP context
- Sequential research (NOT parallel)
- Multiple fragmented documents
- Claims without sources
- Research without implementation path

## Examples

### Good Research Topics for ODP:
- "Temporal workflow patterns for OSINT data collection at 300M req/month"
- "Delta Lake optimization for time-series investigation data"
- "LangGraph multi-agent patterns for YAML pipeline generation"
- "Qdrant vector search performance tuning for 100TB+ data"
- "GKE multi-zone deployment strategies for 99.99% availability"

### Pattern: UI Component from Figma
```
1. Figma MCP: Extract design specs (MANDATORY)
2. Context7: Check React/shadcn capabilities
3. Perplexity: Component patterns
4. Synthesize: Tasks for react-engineer
```

### Bad Research Topics (too generic):
- "Latest AI trends"
- "How to use Docker"
- "Python best practices"
- "Database optimization techniques"

## Output Format

**Research Document**: `docs/research/[YYYY-MM-DD]-[topic].md`

**Task Files**: `.backlog/pending/[category]-[XXX]-[task].md`

**Summary to User**:
```
Research completed: [Topic]

Key Findings:
1. [Finding with evidence]
2. [Finding with evidence]
3. [Finding with evidence]

Recommendations:
- Immediate: [Action]
- Short-term: [Action]
- Long-term: [Action]

Next Steps:
- [X] Research document saved: docs/research/[file]
- [X] [N] tasks created in .backlog/pending/
- [ ] Review findings and approve implementation
```
