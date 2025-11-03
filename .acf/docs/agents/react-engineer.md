# react-engineer Documentation Manifest

## Agent Identity

**Role**: React frontend application specialist

**Technology Focus**: React, TypeScript, TailwindCSS, shadcn/ui, WebSocket, multi-tenant UI

**Scope**: console-ui and admin-ui implementation, React components, state management, WebSocket integration

**Out of Scope**: Backend APIs → go-engineer/python-ml-engineer | K8s deployment → k8s-engineer

---

## Priority 1: MUST READ

1. **`docs/architecture/system-architecture.md`** → Frontend layer
2. **`docs/architecture/identity-and-api.md`** → Multi-tenant UI
3. **`docs/development/quality-gates.md`** → TypeScript section

---

## Scope Boundaries

**IS responsible for**: React components, UI state management, WebSocket client, multi-tenant UI patterns, form validation

**NOT responsible for**: Backend implementation → other engineers | API design → lean-architect

---

## Quality Gates

```bash
cd apps/console-ui
npm run lint
npm run typecheck
npm run build
npm test
```

---

**Last Updated**: 2025-10-27
