# Agent Manifests - Novel Writing Framework

## Для AI агентов: начните здесь

Каждый специализированный агент имеет **dedicated manifest** с приоритетной документацией и workflow инструкциями.

## Quick Start для агента

1. **Найдите свой manifest**: `docs/agents/{your-role}.md`
2. **Загрузите Priority 1 docs** из manifest (core knowledge)
3. **Следуйте workflow** описанному в manifest
4. **Используйте Priority 2 docs** при необходимости
5. **Соблюдайте quality gates** перед завершением

## Доступные роли

### Creative Roles

| Роль | Manifest | Основная ответственность |
|------|----------|--------------------------|
| **Writer** | `writer.md` | Создание контента, написание глав |
| **Chief Editor** | `chief-editor.md` | Координация review, финальное одобрение |

### Editorial Roles

| Роль | Manifest | Специализация |
|------|----------|---------------|
| **Co-Editor: Characters** | `co-editor-character.md` | Consistency персонажей |
| **Co-Editor: Plot** | `co-editor-plot.md` | Continuity сюжета |

### Expert Roles

| Роль | Manifest | Область экспертизы |
|------|----------|--------------------|
| **Expert: Light Novels** | `expert-light-novels.md` | Стилистика японских лайт новелл |
| **Expert: Military** | `expert-military.md` | Оружие, тактика спецподразделений |
| **Expert: SciFi** | `expert-scifi.md` | Научная фантастика, технологии |
| **Expert: Japanese Culture** | `expert-japanese-culture.md` | Культура, обычаи, менталитет |

### Production Roles

| Роль | Manifest | Функция |
|------|----------|---------|
| **Formatter** | `formatter.md` | Верстка финальной книги |

## Agent Manifest Structure

Каждый manifest содержит:

```markdown
# Agent Name

## Role Definition
Краткое описание роли и ответственности

## Core Responsibilities
Что этот агент делает

## Workflow
Пошаговый процесс работы

## Priority Documentation
### Priority 1 (Must Read)
- Документы которые ОБЯЗАТЕЛЬНО читать перед работой

### Priority 2 (Reference)
- Документы для справки во время работы

### Priority 3 (Optional)
- Дополнительный контекст

## Quality Gates
Что нужно проверить перед завершением задачи

## Input/Output Format
Формат входных данных и результатов работы

## Collaboration
С какими агентами взаимодействует

## Examples
Примеры типичных задач
```

## Coordination Patterns

### Sequential Pattern (Linear)

```
Author → Writer → Co-Editors → Chief Editor → Writer (revision) → Chief Editor (accept)
```

Используется для: Большинство глав

### Parallel Pattern

```
                ┌→ Co-Editor: Character ┐
Writer → Chief Editor →│                         ├→ Aggregated Feedback → Writer
                └→ Co-Editor: Plot      ┘
```

Используется для: Быстрый review

### Expert Consultation Pattern

```
Co-Editor identifies issue → Chief Editor → Expert → Feedback → Writer
```

Используется для: Специфические предметные области

### Revision Loop Pattern

```
Writer → Review → Feedback → Writer (revision) → Review
(Max 3 iterations, then escalate)
```

Используется для: Исправления и доработки

## State Transitions

```
draft (Author)
  ↓
pending (Ready for Writer)
  ↓
in-progress (Writer working)
  ↓
completed (Draft done)
  ↓
in-review (Editors/Experts analyzing)
  ↓
feedback (Recommendations collected)
  ↓
revision (Writer fixing) ──→ in-review (repeat if needed)
  ↓
accepted ✓ (Chief Editor approval)
  OR
rejected ✗ (Major issues, max 3 retries)
  OR
blocked ⊗ (Critical unresolvable issues)
```

## Task File Naming Convention

```
CHAPTER-XX-SCENE-YY-state-timestamp.md

Examples:
- chapter-01-scene-01-pending-20250117.md
- chapter-03-scene-02-feedback-20250117.md
- chapter-05-revision-20250117.md
```

## Feedback File Format

```markdown
# Feedback: Chapter X Scene Y

**Agent**: [role-name]
**Date**: YYYY-MM-DD
**Status**: [issue/recommendation/question]

## Issues Found

1. **Category**: [character/plot/style/technical]
   **Severity**: [critical/major/minor]
   **Location**: Chapter X, paragraph Y
   **Description**: ...
   **Recommendation**: ...

## Positive Observations

- What works well

## Overall Assessment

[Accept/Reject/Needs Revision]
```

## Communication Protocols

### Writer ← Chief Editor

- Clear actionable feedback
- Specific locations (chapter, paragraph)
- Examples where helpful

### Chief Editor → Experts

- Specific questions
- Context from story
- Time constraints if any

### Experts → Chief Editor

- Factual corrections
- Alternative suggestions
- References/sources

### Co-Editors ↔ Chief Editor

- Structured feedback format
- Severity classification
- Consolidated recommendations

## Quality Standards

### For Writer

- [ ] Follows author's prompt
- [ ] Maintains character consistency
- [ ] Advances plot logically
- [ ] Proper markdown formatting
- [ ] Engaging prose

### For Editors

- [ ] Specific actionable feedback
- [ ] Examples provided
- [ ] Severity assessment
- [ ] Positive reinforcement included

### For Experts

- [ ] Factually accurate
- [ ] Sources cited if needed
- [ ] Alternatives provided
- [ ] Context-aware recommendations

## Escalation Rules

### When to escalate to Chief Editor

- **Writer**: Conflicting feedback from multiple editors
- **Co-Editor**: Issues outside scope (need expert)
- **Expert**: Fundamental story logic problem

### When to mark as blocked

- Unresolvable contradiction in feedback
- Author prompt unclear/impossible
- Technical limitation
- After 3 rejected iterations

## Best Practices

1. **Read the full context** - Don't work in isolation
2. **Check character sheets** - Always verify against canon
3. **Reference previous chapters** - Maintain continuity
4. **Be specific** - Vague feedback wastes iteration cycles
5. **Be constructive** - Balance criticism with encouragement
6. **Stay in role** - Don't overstep your domain
7. **Document decisions** - Future reference matters

---

**Framework Version**: 1.0
**Last Updated**: 2025-11-17
