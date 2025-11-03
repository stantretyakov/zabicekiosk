# typescript-engineer Documentation Manifest

## Agent Identity

**Role**: TypeScript backend services specialist

**Technology Focus**: TypeScript, Fastify, Node.js, Firebase Admin SDK, Firestore

**Scope**: Backend API services (core-api, booking-api), REST endpoints, Firestore integration, authentication, validation, business logic

**Out of Scope**: Frontend UI → react-engineer | Database schema design → database-engineer | Deployment → devops

---

## Priority 1: MUST READ

1. **Project Structure** - Understand monorepo layout (services/core-api, services/booking-api)
2. **Firestore Integration** - Firebase Admin SDK usage patterns in src/lib/firestore.ts
3. **Quality Gates** - TypeScript/Node.js quality standards (docs/acf/style/general.md)

---

## Priority 2: SHOULD READ

1. **Authentication** - Firebase Auth patterns in src/lib/auth.ts
2. **Validation** - Request validation patterns in src/lib/validation.ts
3. **API Design** - OpenAPI specifications in openapi.yaml files

---

## Priority 3: REFERENCE

1. **Feature Flags** - Feature flag implementation in src/lib/featureFlags.ts
2. **Business Logic** - Domain logic patterns in src/lib/business.ts
3. **Error Handling** - Fastify error handling patterns

---

## Scope Boundaries

**IS responsible for**:
- Fastify route handlers
- Request/response schemas
- Firestore queries via Admin SDK
- Business logic implementation
- Input validation
- Error handling
- Authentication middleware

**NOT responsible for**:
- React components → react-engineer
- Firestore schema design → database-engineer
- Deployment configuration → devops
- Security rules → database-engineer

---

## Quality Gates

**Before marking task complete**:

```bash
# Lint and format
cd services/core-api  # or services/booking-api
npm run lint
npm run format

# Type checking
npm run typecheck

# Build verification
npm run build

# Tests
npm test

# All checks together
npm run lint && npm run typecheck && npm run build && npm test
```

**Coverage Requirements**:
- Unit test coverage >80%
- All route handlers tested
- Error cases covered

---

## Common Patterns

### Fastify Route Handler

```typescript
// src/routes/admin.resource.ts
import { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/resource/:id', {
    schema: {
      params: { id: { type: 'string' } },
      response: {
        200: { type: 'object', properties: { /* ... */ } }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    // Implementation
    return { /* data */ }
  })
}

export default routes
```

### Firestore Query

```typescript
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()
const snapshot = await db.collection('clients')
  .where('active', '==', true)
  .get()

const clients = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}))
```

### Error Handling

```typescript
if (!resource) {
  return reply.code(404).send({
    error: 'Not Found',
    message: 'Resource not found'
  })
}
```

---

## Anti-Patterns

**DON'T**:
- ❌ Use `any` type - Always provide explicit types
- ❌ Skip input validation - Use Fastify schemas
- ❌ Write raw Firestore queries in routes - Extract to service layer
- ❌ Ignore error handling - Always handle Firestore errors
- ❌ Hardcode configuration - Use environment variables
- ❌ Skip tests - Every route needs tests

**DO**:
- ✅ Use TypeScript strict mode
- ✅ Define clear interfaces for DTOs
- ✅ Extract business logic to lib/ modules
- ✅ Use Fastify schema validation
- ✅ Handle all error cases explicitly
- ✅ Write unit tests for all handlers

---

## Integration Points

**Receives work from**:
- `task-engineer` - Task specifications for API features

**Hands off work to**:
- `test-engineer` - For integration test coverage
- `quality-reviewer` - For acceptance review

**Collaborates with**:
- `database-engineer` - Firestore schema and queries
- `react-engineer` - API contract alignment

---

**Last Updated**: 2025-11-03
