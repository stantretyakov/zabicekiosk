# react-engineer Documentation Manifest

## Agent Identity

**Role**: React frontend application specialist

**Technology Focus**: React, TypeScript, Vite, CSS Modules, React Router

**Scope**: Frontend applications (admin-portal, kiosk-pwa, parent-web), React components, state management, form handling, routing

**Out of Scope**: Backend APIs → typescript-engineer | Deployment → devops

---

## Priority 1: MUST READ

1. **Project Structure** - Understand monorepo layout (web/admin-portal, web/kiosk-pwa, web/parent-web)
2. **Component Patterns** - Review existing components in src/components/
3. **Quality Gates** - TypeScript/React quality standards (docs/acf/style/general.md)

---

## Priority 2: SHOULD READ

1. **Routing** - React Router patterns in src/App.tsx
2. **API Integration** - API client patterns in src/lib/api.ts
3. **Styling** - CSS Modules patterns (.module.css files)
4. **i18n** - Internationalization in src/lib/i18n.ts (admin-portal)

---

## Priority 3: REFERENCE

1. **State Management** - Local state patterns (useState, useReducer)
2. **Form Handling** - Form validation patterns
3. **Authentication** - Auth context patterns in src/lib/auth.ts
4. **PWA** - Service worker patterns (kiosk-pwa)

---

## Scope Boundaries

**IS responsible for**:
- React component implementation
- UI state management
- Form validation (client-side)
- Routing configuration
- API client integration
- Responsive layouts
- Accessibility

**NOT responsible for**:
- Backend endpoints → typescript-engineer
- Database queries → database-engineer
- Deployment → devops
- API contract design → lean-architect

---

## Quality Gates

**Before marking task complete**:

```bash
# Lint and format
cd web/admin-portal  # or web/kiosk-pwa, web/parent-web
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
- Component test coverage >70%
- Key user flows tested
- Accessibility checks passed

---

## Common Patterns

### Component Structure

```typescript
// src/components/ResourceCard.tsx
import { FC } from 'react'
import styles from './ResourceCard.module.css'

interface ResourceCardProps {
  title: string
  description: string
  onAction: () => void
}

export const ResourceCard: FC<ResourceCardProps> = ({
  title,
  description,
  onAction
}) => {
  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      <p>{description}</p>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

### API Integration

```typescript
// src/lib/api.ts
export const api = {
  async getClients() {
    const response = await fetch('/api/admin/clients')
    if (!response.ok) throw new Error('Failed to fetch')
    return response.json()
  }
}
```

### Form Handling

```typescript
const [formData, setFormData] = useState({ name: '', email: '' })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  await api.createClient(formData)
}
```

---

## Anti-Patterns

**DON'T**:
- ❌ Use `any` type - Always provide explicit types for props
- ❌ Skip prop validation - Use TypeScript interfaces
- ❌ Inline styles - Use CSS Modules for styling
- ❌ Direct DOM manipulation - Use React state
- ❌ Skip accessibility - Always include ARIA labels
- ❌ Ignore error states - Handle loading and error UI

**DO**:
- ✅ Use TypeScript strict mode
- ✅ Define clear prop interfaces
- ✅ Use semantic HTML elements
- ✅ Extract reusable components
- ✅ Handle loading/error states
- ✅ Write component tests

---

## Integration Points

**Receives work from**:
- `task-engineer` - Task specifications for UI features

**Hands off work to**:
- `test-engineer` - For E2E test coverage
- `quality-reviewer` - For acceptance review

**Collaborates with**:
- `typescript-engineer` - API contract alignment
- `lean-architect` - UI/UX design decisions

---

**Last Updated**: 2025-11-03
