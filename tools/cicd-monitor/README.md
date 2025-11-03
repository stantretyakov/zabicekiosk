# zabice-cicd-monitor

Автоматический мониторинг Cloud Build и создание задач при сбоях.

## Описание

CI/CD Monitor отслеживает статус сборок в Cloud Build, анализирует ошибки с помощью Claude AI и автоматически создает задачи для агентов в `.backlog/pending/`.

## Возможности

- 🔍 **Real-time мониторинг** Cloud Build через Pub/Sub
- 🤖 **AI-анализ ошибок** с помощью Claude API
- 📝 **Автоматическое создание задач** в ACF backlog
- 🎯 **Умный роутинг** задач к правильным агентам
- 💬 **PR комментарии** с деталями ошибок
- 🛡️ **Rate limiting** для всех API
- 📊 **Structured logging** для мониторинга

## Установка

```bash
cd tools/cicd-monitor
npm install
npm run build
```

### Глобальная установка

```bash
npm install -g .
```

## Конфигурация

### 1. Переменные окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Заполните:
- `GITHUB_TOKEN` - GitHub Personal Access Token (scope: `repo`)
- `ANTHROPIC_API_KEY` - Claude API key
- `GOOGLE_APPLICATION_CREDENTIALS` - Путь к GCP service account key (для локальной разработки)

### 2. Секреты в Secret Manager

```bash
# GitHub Token
gcloud secrets create cicd-monitor-github-token \
  --data-file=- \
  --project=zabicekiosk

# Claude API Key
gcloud secrets create cicd-monitor-anthropic-api-key \
  --data-file=- \
  --project=zabicekiosk

# Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding cicd-monitor-github-token \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding cicd-monitor-anthropic-api-key \
  --member="serviceAccount:120039745928@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Pub/Sub Subscription (рекомендуется)

```bash
# Create subscription for Cloud Build events
gcloud pubsub subscriptions create cicd-monitor-builds \
  --topic=cloud-builds \
  --project=zabicekiosk
```

## Использование

### Watch Mode (real-time мониторинг)

```bash
zabice-cicd-monitor watch \
  --build-id=abc123-def456 \
  --project-id=zabicekiosk \
  --pr-number=42 \
  --branch=feature/foo \
  --auto-fix-enabled \
  --notify
```

### Analyze Mode (post-mortem анализ)

```bash
zabice-cicd-monitor analyze \
  --build-id=abc123-def456 \
  --project-id=zabicekiosk \
  --create-tasks \
  --notify
```

### List Recent Builds

```bash
zabice-cicd-monitor list \
  --project-id=zabicekiosk \
  --status=failed \
  --last=10
```

### Show Tasks for Build

```bash
zabice-cicd-monitor tasks \
  --build-id=abc123-def456
```

## Интеграция

### Cloud Build

Добавьте в `cloudbuild.yaml`:

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-github-token/versions/latest
      env: 'GITHUB_TOKEN'
    - versionName: projects/$PROJECT_ID/secrets/cicd-monitor-anthropic-api-key/versions/latest
      env: 'ANTHROPIC_API_KEY'

steps:
  # ... existing steps ...

  - id: cicd-monitor-on-failure
    name: node:20
    entrypoint: bash
    secretEnv: ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY']
    args:
      - -c
      - |
        npm install -g zabice-cicd-monitor
        zabice-cicd-monitor analyze \
          --build-id=$BUILD_ID \
          --project-id=$PROJECT_ID \
          --create-tasks \
          --notify
    waitFor: ['-']
```

### GitHub Actions

Создайте `.github/workflows/pr-quality-gate.yaml`:

```yaml
name: PR Quality Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloud Build
        id: cloudbuild
        run: |
          BUILD_ID=$(gcloud builds submit ...)
          echo "build_id=$BUILD_ID" >> $GITHUB_OUTPUT

      - name: Monitor Build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx zabice-cicd-monitor watch \
            --build-id=${{ steps.cloudbuild.outputs.build_id }} \
            --pr-number=${{ github.event.pull_request.number }} \
            --auto-fix-enabled
```

## Разработка

### Локальный запуск

```bash
npm run dev -- watch --build-id=TEST_ID --dry-run
```

### Тесты

```bash
# Все тесты
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Quality Gates

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

## Архитектура

```
src/
├── index.ts                 # CLI entry point
├── config/                  # Configuration loader
├── monitor/                 # Build monitoring (Pub/Sub & polling)
├── analyzer/                # Error classification & AI analysis
├── task-creator/            # Task generation & agent routing
├── integrations/            # API clients (Cloud Build, GitHub, Claude)
└── utils/                   # Utilities (logging, rate limiting)
```

## Типы Ошибок и Роутинг

| Тип Ошибки | Step Pattern | Агент | Приоритет |
|------------|--------------|-------|-----------|
| ESLint | `quality-gate-*-lint` | typescript-engineer / react-engineer | high |
| TypeScript | `quality-gate-*-typecheck` | typescript-engineer / react-engineer | high |
| Test | `quality-gate-*-test` | test-engineer | high |
| Build | `quality-gate-*-build` | typescript-engineer / react-engineer | critical |
| Migration | `*database*` | database-engineer | critical |
| Deployment | `deploy-*` | devops | blocker |

## Troubleshooting

### "Rate limit exceeded"

```bash
# Проверьте лимиты
zabice-cicd-monitor list --project-id=zabicekiosk --last=1

# Увеличьте интервалы в .cicd-monitor.config.yaml
```

### "Failed to authenticate with GitHub"

```bash
# Проверьте токен
echo $GITHUB_TOKEN

# Проверьте scopes
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

### "Build not found"

```bash
# Проверьте права доступа
gcloud builds describe BUILD_ID --project=zabicekiosk
```

## Contributing

См. `docs/agents/cicd-monitor.md` для деталей архитектуры и guidelines.

## License

PRIVATE - For zabicekiosk project only
