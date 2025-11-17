# ACF Novel Writing Framework

**Agent-based Creative Fiction Framework**

Адаптация ACF (Agent Collaboration Framework) для collaborative novel writing с использованием специализированных AI агентов.

## Быстрый старт

```bash
# Создать новый роман
make novel NAME="my-novel"

# Добавить промпт автора (идею главы)
make prompt NOVEL="my-novel" CHAPTER=1

# Запустить писателя
make write NOVEL="my-novel" CHAPTER=1

# Запустить полный review цикл
make review NOVEL="my-novel" CHAPTER=1

# Собрать финальную книгу
make compile NOVEL="my-novel"
```

## Архитектура

### Роли агентов

1. **Writer** - Создание контента на основе промптов автора
2. **Chief Editor** - Координация review, валидация сюжета
3. **Co-Editors** - Специализированные проверки:
   - Character Consistency Editor
   - Plot Continuity Editor
4. **Experts** - Предметные области:
   - Light Novels Stylistics
   - Military & Tactics
   - Science Fiction Technologies
   - Japanese Culture
5. **Formatter** - Финальная верстка книги

### Workflow

```
Author Prompt (draft/)
    ↓
Writer creates chapter (in-progress/ → completed/)
    ↓
Co-Editors analyze (parallel) → feedback/
    ↓
Chief Editor coordinates review → feedback/
    ↓
Experts consulted if needed → feedback/
    ↓
Writer revises (revision/)
    ↓
Chief Editor final verdict (accepted/ or rejected/)
    ↓
Formatter compiles book
```

### Состояния задач

| State | Описание |
|-------|----------|
| **draft/** | Промпты автора - идеи глав/сцен |
| **pending/** | Готово к работе писателя |
| **in-progress/** | Писатель работает над главой |
| **completed/** | Черновик главы готов к review |
| **in-review/** | Редакторы/эксперты анализируют |
| **feedback/** | Замечания и рекомендации |
| **revision/** | Писатель вносит исправления |
| **rejected/** | Требуется major rework (max 3 попытки) |
| **blocked/** | Критические проблемы |
| **accepted/** | Глава принята, готова к публикации |

## Структура проекта

```
novel-writing-framework/
├── docs/
│   ├── agents/              # Agent manifests (START HERE)
│   │   ├── writer.md
│   │   ├── chief-editor.md
│   │   ├── co-editor-*.md
│   │   ├── expert-*.md
│   │   └── formatter.md
│   └── acf/                 # ACF process documentation
│       ├── workflow.md
│       ├── style/
│       └── backlog/
│
├── .backlog/                # Task workflow states
│   ├── draft/               # Author prompts
│   ├── pending/             # Ready for writer
│   ├── in-progress/         # Active writing
│   ├── completed/           # Draft done
│   ├── in-review/           # Under review
│   ├── feedback/            # Editor/expert feedback
│   ├── revision/            # Revisions in progress
│   ├── rejected/            # Needs major rework
│   ├── blocked/             # Critical issues
│   └── accepted/            # Final approved
│
├── novels/                  # Your novel projects
│   └── [novel-name]/
│       ├── chapters/        # Final chapter markdown files
│       ├── characters/      # Character sheets
│       ├── worldbuilding/   # World/setting documentation
│       ├── prompts/         # Author prompts log
│       ├── outline.md       # Story outline
│       ├── metadata.md      # Title, genre, etc.
│       └── book.md          # Compiled final book
│
└── Makefile                 # Development commands
```

## Документация

- **Для агентов**: Начните с `docs/agents/README.md`
- **Workflow**: `docs/acf/workflow.md`
- **Style guides**: `docs/acf/style/`

## Отличия от software ACF

| Aspect | Software ACF | Novel Writing ACF |
|--------|--------------|-------------------|
| Продукт | Code | Creative text |
| Quality gates | Linters, tests | Style, consistency |
| Acceptance | Binary (works/broken) | Subjective (compelling/boring) |
| Experts | Tech specialists | Domain experts |
| Версионирование | Git commits | Chapter revisions |
| Финальный артефакт | Deployed service | Published book |

## Принципы

1. **Author is the source of truth** - Автор задает vision
2. **Writer translates vision** - Писатель воплощает в текст
3. **Editors ensure quality** - Редакторы гарантируют качество
4. **Experts ensure authenticity** - Эксперты проверяют достоверность
5. **Formatter ensures presentation** - Верстальщик обеспечивает форму

## Best Practices

- **Один промпт = одна сцена/глава** - Атомарность задач
- **Co-editors работают параллельно** - Эффективность
- **Feedback структурирован** - Четкие actionable items
- **Max 3 revision cycles** - Избегаем бесконечных итераций
- **Character sheets актуальны** - Single source of truth для персонажей

---

**Version**: 1.0
**Based on**: ACF Framework (zabicekiosk adaptation)
**Last Updated**: 2025-11-17
