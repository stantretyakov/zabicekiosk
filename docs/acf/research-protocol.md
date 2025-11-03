# Research Protocol

## Tool Selection Matrix

| Need                      | Tool       | When to Use                                            |
| ------------------------- | ---------- | ------------------------------------------------------ |
| **UI/UX Design Analysis** | Figma MCP  | **MANDATORY** when Figma links/nodes provided          |
| **Library Documentation** | Context7   | Adding new libraries, updating versions, API questions |
| **Best Practices**        | Perplexity | Architecture, patterns, industry standards             |
| **Security Research**     | Perplexity | Vulnerabilities, patches, security practices           |
| **Performance Research**  | Perplexity | Optimization techniques, benchmarks                    |
| **Technology Comparison** | Perplexity | Evaluating alternatives, migration paths               |
| **Code Examples**         | Context7   | Library usage patterns, implementation examples        |

## Figma MCP Usage (mcp\_\_figma-dev-mode-mcp-server)

### 🎨 MANDATORY Use Cases

1. **Task Includes Figma URL/Node**

   ```
   Trigger: Task mentions Figma design or includes Figma link
   Action: MUST extract node ID and analyze BEFORE any other work
   Priority: ALWAYS FIRST when Figma reference exists
   ```

2. **Node ID Extraction**

   ```
   URL: https://figma.com/design/:fileKey/:fileName?node-id=1-2
   Extract: nodeId = "1:2" (replace - with :)
   Call: get_code(nodeId="1:2")
   ```

3. **Design Analysis Flow**

   ```javascript
   // 1. Get component code
   mcp__figma-dev-mode-mcp-server__get_code {
     nodeId: "123:456",
     clientFrameworks: "react,nextjs",
     clientLanguages: "typescript,html,css"
   }

   // 2. Get design tokens/variables
   mcp__figma-dev-mode-mcp-server__get_variable_defs {
     nodeId: "123:456"
   }

   // 3. Get component connections (if available)
   mcp__figma-dev-mode-mcp-server__get_code_connect_map {
     nodeId: "123:456"
   }
   ```

4. **Screenshot Capture**
   ```javascript
   // For visual reference in tasks
   mcp__figma-dev-mode-mcp-server__get_screenshot {
     nodeId: "123:456"
   }
   ```

### Figma Integration Protocol

**CRITICAL RULES**:

1. **ALWAYS** use Figma tools when URL/node provided
2. **NEVER** skip Figma analysis for UI tasks with designs
3. **EXTRACT** node IDs from URLs before calling tools
4. **INCLUDE** design insights in task descriptions
5. **REFERENCE** specific Figma nodes in implementation tasks

### Common Figma Patterns

**Pattern 1: Full Page Implementation**

```
Input: "Implement dashboard from [Figma URL]"
1. Extract node ID from URL
2. get_code() for component structure
3. get_variable_defs() for styling
4. Create tasks with design specs
```

**Pattern 2: Component Update**

```
Input: "Update button component per Figma"
1. get_code() for new design
2. get_code_connect_map() for existing mapping
3. Create migration task
```

**Pattern 3: Design System Sync**

```
Input: "Sync design tokens from Figma"
1. get_variable_defs() for all tokens
2. Create token update tasks
3. Include CSS variable mappings
```

## Context7 Usage (mcp\_\_context7)

### MANDATORY Use Cases

1. **Adding New Libraries**

   ```
   Before: npm install new-library
   Action: Use Context7 to understand API, patterns, best practices
   After: Implement with correct patterns
   ```

2. **Updating Existing Libraries**

   ```
   Before: npm update existing-library
   Action: Check breaking changes, migration guide
   After: Update code for compatibility
   ```

3. **Resolving Usage Questions**

   ```
   Question: "How to implement X with library Y?"
   Action: Context7 lookup for current documentation
   Result: Accurate, up-to-date implementation
   ```

4. **Checking Deprecations**
   ```
   Warning: Method might be deprecated
   Action: Verify with Context7
   Result: Use recommended alternative
   ```

### Context7 Protocol

```javascript
// 1. Resolve library ID
mcp__context7__resolve-library-id {
  libraryName: "next"
}

// 2. Get documentation
mcp__context7__get-library-docs {
  context7CompatibleLibraryID: "/vercel/next.js",
  tokens: 5000,
  topic: "app router"
}
```

### f7-tip-code Specific Libraries

**Frontend (Context7 required)**:

- Next.js 15 - App Router, Server Components
- React 19 - Hooks, Suspense, Transitions
- TypeScript - Strict mode patterns
- Tailwind CSS - Utility patterns
- Chart.js - Data visualization
- SWR - Data fetching

**Backend (Context7 required)**:

- Prisma - ORM patterns, migrations
- Stripe - Payment integration
- AWS SDK - S3, CloudFront
- Redis - Caching patterns
- Zod - Validation schemas

**Python (Context7 required)**:

- FastAPI - Async patterns, dependency injection
- Pydantic - Model validation
- SQLAlchemy - ORM patterns
- httpx - Async HTTP
- OpenAI/Anthropic - LLM APIs

## Perplexity Usage (mcp\_\_perplexity)

### MANDATORY Use Cases

1. **Architecture Decisions** (lean-architect agent)

   ```
   Question: "Microservices vs monolith for SaaS?"
   Filter: recency=month
   Focus: Scalability, complexity, team size
   ```

2. **Best Practices Research**

   ```
   Topic: "Next.js 15 performance optimization 2025"
   Filter: recency=week
   Focus: SSR, ISR, streaming patterns
   ```

3. **Security Research**

   ```
   Issue: "JWT security vulnerabilities 2025"
   Filter: recency=day
   Focus: Latest exploits, mitigations
   ```

4. **Performance Optimization**
   ```
   Problem: "PostgreSQL slow queries with JSON"
   Filter: recency=month
   Focus: Indexing, query optimization
   ```

### Perplexity Protocol

```javascript
mcp__perplexity__perplexity_search_web {
  query: "Next.js 15 server components best practices 2025",
  recency: "month"
}
```

### f7-tip-code Research Topics

**Architecture** (Perplexity):

- SaaS multi-tenancy patterns
- Video processing at scale
- LLM cost optimization
- Real-time analysis architectures

**Performance** (Perplexity):

- 60-minute video in 5-minute processing
- Concurrent user scaling
- Database optimization for time-series
- CDN strategies for video delivery

**Security** (Perplexity):

- OAuth best practices
- API rate limiting
- Data encryption at rest
- GDPR/CCPA compliance

## Research Synthesis Requirements

### Document Structure

````markdown
# Research: [Topic] for Tip SaaS Platform

## Executive Summary

- Key findings (3-5 bullets)
- Relevance to Tip platform
- Recommended actions

## Context Analysis

### Current Implementation

- Existing approach in f7-tip-code
- Identified limitations
- Performance metrics

### Business Requirements

- User needs addressed
- Cost implications
- Timeline constraints

## Research Findings

### Finding 1: [Specific Pattern/Solution]

#### Evidence

- Source 1 (date, credibility)
- Source 2 (date, credibility)
- Source 3 (date, credibility)

#### Application to Tip

- How it solves our specific problem
- Implementation approach
- Expected improvements

### Finding 2: [Alternative Approach]

[Similar structure]

## Comparative Analysis

| Approach | Pros | Cons | Fit for Tip |
| -------- | ---- | ---- | ----------- |
| Current  | ...  | ...  | ...         |
| Option 1 | ...  | ...  | ...         |
| Option 2 | ...  | ...  | ...         |

## Recommendations

### Immediate (This Sprint)

1. Quick win with high impact
2. Security/performance fix
3. Technical debt reduction

### Short-term (Next Month)

1. Feature enhancement
2. Optimization opportunity
3. User experience improvement

### Long-term (Quarterly)

1. Architecture evolution
2. Scaling preparation
3. Platform modernization

## Implementation Blueprint

### Code Changes

```typescript
// Specific code examples
// File locations
// Migration path
```
````

### Testing Strategy

- Unit test requirements
- Integration test scenarios
- Performance benchmarks

### Rollout Plan

1. Development environment
2. Staging validation
3. Gradual production rollout
4. Monitoring and rollback

## Risk Assessment

| Risk | Likelihood   | Impact       | Mitigation |
| ---- | ------------ | ------------ | ---------- |
| ...  | High/Med/Low | High/Med/Low | ...        |

## Success Metrics

- Performance: X% improvement
- Cost: $Y reduction
- User satisfaction: Z point increase
- Development velocity: N% faster

## References

### Primary Sources

1. [Title](URL) - Date - Key insight
2. [Title](URL) - Date - Key insight

### Code Examples

1. [Repository](URL) - Implementation pattern
2. [Documentation](URL) - API reference

### Related Internal Docs

- [Architecture Decision](../decisions/ADR-XXX.md)
- [Implementation Guide](../guides/guide-name.md)

````

## Research Quality Standards

### Source Requirements

1. **Recency**: Prefer 2024-2025 sources
2. **Credibility**: Official docs, recognized experts
3. **Relevance**: Direct application to Tip platform
4. **Evidence**: Multiple corroborating sources

### Synthesis Requirements

1. **Specificity**: No generic advice
2. **Actionability**: Clear implementation steps
3. **Measurability**: Quantified improvements
4. **Traceability**: All claims sourced

## Project Context Awareness

### MANDATORY Pre-Research Analysis

```bash
# Understand project
cat README.md          # Business context
cat CLAUDE.md         # Technical context
cat package.json      # Dependencies
ls docs/             # Existing knowledge

# Identify gaps
grep -r "TODO"        # Known issues
grep -r "FIXME"       # Technical debt
grep -r "performance" # Optimization needs
````

### Research Relevance Filter

**MUST relate to**:

- Tip SaaS platform specifically
- Current tech stack (Next.js/Python/PostgreSQL)
- Business model ($119/user/month)
- Scale requirements (SMB sales teams)
- Performance targets (5-min processing)

**REJECT if about**:

- Unrelated technologies
- Different business models
- Incompatible scale
- Out-of-scope features

## Common Research Patterns

### Pattern 1: UI Implementation from Design

```
1. Figma MCP: Extract design specifications (MANDATORY)
2. Context7: Check UI library capabilities
3. Perplexity: Research implementation patterns
4. Synthesize: Create implementation tasks
```

### Pattern 2: Library Upgrade

```
1. Context7: Check new version docs
2. Context7: Review breaking changes
3. Perplexity: Research migration experiences
4. Synthesize: Create upgrade plan
```

### Pattern 3: Performance Issue

```
1. Measure: Current performance metrics
2. Perplexity: Research optimization techniques
3. Context7: Check library-specific optimizations
4. Synthesize: Create optimization strategy
```

### Pattern 4: New Feature

```
1. Perplexity: Research implementation patterns
2. Context7: Check library capabilities
3. Perplexity: Security considerations
4. Synthesize: Create implementation plan
```

### Pattern 5: Architecture Decision

```
1. Document: Current architecture
2. Perplexity: Research alternatives
3. Perplexity: Industry best practices
4. Synthesize: Create decision record
```

## Anti-Patterns to Avoid

### ❌ Using Training Knowledge

```javascript
// WRONG - Potentially outdated
'Based on my knowledge, Next.js uses...'

// CORRECT - Verified current info
'According to Context7 docs (Jan 2025), Next.js 15 uses...'
```

### ❌ Generic Research

```javascript
// WRONG - Too generic
'Best practices for web apps'

// CORRECT - Project specific
'Next.js 15 + Prisma optimization for SaaS with 1000 users'
```

### ❌ Single Source

```javascript
// WRONG - Unverified
'One blog post says...'

// CORRECT - Multi-source
'Three sources confirm (Source1, Source2, Source3)...'
```

## Continuous Learning

### Weekly Research Topics

- **Monday**: Security updates
- **Tuesday**: Performance optimizations
- **Wednesday**: New library features
- **Thursday**: Industry trends
- **Friday**: Technical debt review

### Monthly Deep Dives

- Architecture evolution
- Scaling strategies
- Cost optimization
- User experience improvements

## References

- [Context7 Documentation](https://context7.com)
- [Perplexity API](https://perplexity.ai)
- [Research Command](../../.claude/commands/research.md)
- [CLAUDE.md](../../CLAUDE.md)
