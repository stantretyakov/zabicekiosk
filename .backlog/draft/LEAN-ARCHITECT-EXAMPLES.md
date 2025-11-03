# 🏗️ Работа с lean-architect: Практические примеры

## 📖 Что делает lean-architect?

**lean-architect** - это агент-архитектор, который:
- ✅ Проектирует системную архитектуру
- ✅ Создаёт OpenAPI спецификации
- ✅ Пишет Architecture Decision Records (ADR)
- ✅ Разрабатывает диаграммы компонентов
- ✅ Определяет API контракты
- ❌ НЕ пишет код реализации (это делают typescript-engineer, react-engineer)

---

## 🎯 Когда использовать lean-architect?

### Используйте для:
1. **Новая функциональность** - проектирование перед реализацией
2. **Архитектурные решения** - выбор между технологиями
3. **API контракты** - определение интерфейсов между сервисами
4. **Рефакторинг** - переосмысление существующей архитектуры
5. **Документация** - создание технических спецификаций

### НЕ используйте для:
- Написания кода → typescript-engineer, react-engineer
- Реализации баз данных → database-engineer
- Настройки деплоя → devops
- Написания тестов → test-engineer

---

## 💬 Примеры запросов

### Пример 1: Новая функциональность (простой запрос)

**Вы пишете:**
```
Спроектируй систему онлайн-оплаты для абонементов через Stripe.
Нужна поддержка рекуррентных платежей и webhook'ов.
```

**Что создаст lean-architect:**
```
📄 docs/architecture/payment-system.md
├─ Контекст и бизнес-требования
├─ Дизайн компонентов (core-api расширение)
├─ API контракт (OpenAPI для /api/payments)
├─ Модель данных Firestore (collections: payments, subscriptions)
├─ Диаграмма последовательности (Client → API → Stripe)
├─ Соображения безопасности
├─ Стратегия тестирования
└─ План развёртывания

📄 docs/architecture/adr/ADR-003-stripe-for-payments.md
├─ Статус: Принято
├─ Контекст решения
├─ Обоснование выбора Stripe
├─ Последствия (плюсы/минусы)
└─ Рассмотренные альтернативы (PayPal, Square)

📄 services/core-api/openapi-payment-extension.yaml
└─ OpenAPI спецификация для новых endpoints
```

---

### Пример 2: Архитектурное решение (ADR)

**Вы пишете:**
```
Мне нужен ADR: выбрать между хранением абонементов в Firestore
или отдельной PostgreSQL базе. Учти масштабирование до 10k клиентов.
```

**Что создаст lean-architect:**
```
📄 docs/architecture/adr/ADR-004-firestore-vs-postgresql-passes.md

# ADR-004: Firestore для хранения абонементов

## Статус: Принято

## Контекст
Система zabicekiosk требует хранилище для абонементов (passes).
Текущий стек использует Firestore для всех данных.
Рассматриваем миграцию на PostgreSQL для структурированных данных.

## Решение
Продолжить использовать Firestore для абонементов.

## Обоснование
**Положительные последствия:**
- Консистентность со стеком (всё на Firebase)
- Real-time обновления в kiosk-pwa без polling
- Автоматическое масштабирование до 10k+ клиентов
- Упрощённая авторизация через Firebase Security Rules
- Offline-first возможности для киоска

**Отрицательные последствия:**
- Ограниченные возможности сложных запросов
- Стоимость reads при высокой нагрузке (~$0.06 за 100k reads)
- Нет транзакций между коллекциями (ограничение 500 документов)

## Альтернативы
1. **PostgreSQL на Cloud SQL**
   - Плюс: Сложные JOIN запросы
   - Минус: Дополнительная инфраструктура, нет real-time из коробки
   - Стоимость: ~$25/месяц за db-f1-micro

2. **Гибридный подход** (Firestore для passes, PostgreSQL для аналитики)
   - Плюс: Best of both worlds
   - Минус: Сложность синхронизации, два источника правды

## Метрики успеха
- Latency < 200ms для чтения абонемента
- Поддержка 100 одновременных kiosk-сканирований
- Стоимость < $50/месяц при 10k активных абонементов

## Пересмотр
Пересмотреть решение если:
- Объём данных превысит 1M абонементов
- Потребуются сложные аналитические запросы
- Стоимость Firestore превысит $200/месяц
```

---

### Пример 3: API контракт (OpenAPI)

**Вы пишете:**
```
Создай OpenAPI спецификацию для API управления расписанием занятий.
Endpoints: создать сессию, получить список, отменить, проверить доступность.
```

**Что создаст lean-architect:**
```yaml
📄 services/booking-api/openapi.yaml (дополнение)

paths:
  /api/v1/sessions:
    get:
      summary: Получить список сессий
      tags: [Sessions]
      parameters:
        - name: date
          in: query
          schema:
            type: string
            format: date
        - name: status
          in: query
          schema:
            type: string
            enum: [scheduled, cancelled, completed]
      responses:
        200:
          description: Список сессий
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Session'

    post:
      summary: Создать новую сессию
      tags: [Sessions]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [dateTime, capacity, instructorId]
              properties:
                dateTime:
                  type: string
                  format: date-time
                capacity:
                  type: integer
                  minimum: 1
                  maximum: 20
                instructorId:
                  type: string
                notes:
                  type: string
      responses:
        201:
          description: Сессия создана
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Session'
        400:
          description: Ошибка валидации
        409:
          description: Конфликт расписания

  /api/v1/sessions/{sessionId}:
    delete:
      summary: Отменить сессию
      tags: [Sessions]
      security:
        - bearerAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Сессия отменена
        404:
          description: Сессия не найдена
        409:
          description: Невозможно отменить (есть бронирования)

  /api/v1/sessions/{sessionId}/availability:
    get:
      summary: Проверить доступность мест
      tags: [Sessions]
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Информация о доступности
          content:
            application/json:
              schema:
                type: object
                properties:
                  sessionId:
                    type: string
                  capacity:
                    type: integer
                  booked:
                    type: integer
                  available:
                    type: integer
                  isAvailable:
                    type: boolean

components:
  schemas:
    Session:
      type: object
      properties:
        id:
          type: string
        dateTime:
          type: string
          format: date-time
        capacity:
          type: integer
        booked:
          type: integer
        instructorId:
          type: string
        status:
          type: string
          enum: [scheduled, cancelled, completed]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

---

### Пример 4: Комплексная архитектура

**Вы пишете:**
```
Спроектируй систему real-time уведомлений для zabicekiosk:
- Push-уведомления в parent-web (браузерные)
- SMS через Twilio за 24ч до занятия
- Email напоминания
- Уведомления администраторам в admin-portal
- Логирование всех отправок

Учти Firebase Functions, Firestore triggers, и масштабирование.
```

**Что создаст lean-architect:**
```
📄 docs/architecture/notification-system.md

# Архитектура: Система уведомлений zabicekiosk

## 1. Контекст

### Бизнес-требования
- Родители получают напоминания о занятиях (push, SMS, email)
- Администраторы видят уведомления о новых бронированиях
- Полный audit trail всех отправленных сообщений
- Поддержка шаблонов и локализации

### Технические ограничения
- Стек: Firebase Functions, Firestore, Twilio, SendGrid
- Масштаб: До 1000 уведомлений/день на старте
- Latency: Email/SMS <30 секунд, Push <5 секунд

## 2. Компоненты системы

### 2.1. Services
- **notification-service** (новая Firebase Function)
  - Обработка очереди уведомлений
  - Интеграция с провайдерами (Twilio, SendGrid, FCM)
  - Retry логика и error handling

- **notification-scheduler** (новая Firebase Function)
  - Cloud Scheduler триггер (каждые 5 минут)
  - Поиск предстоящих сессий
  - Создание задач уведомлений в очереди

### 2.2. Firestore Collections
```javascript
notifications/
  {notificationId}/
    - type: 'push' | 'sms' | 'email'
    - recipientId: string (userId)
    - templateId: string
    - scheduledAt: timestamp
    - status: 'pending' | 'sent' | 'failed'
    - sentAt?: timestamp
    - error?: string
    - metadata: {
        sessionId?: string,
        bookingId?: string
      }

notificationTemplates/
  {templateId}/
    - type: 'push' | 'sms' | 'email'
    - subject?: string (для email)
    - body: string (с плейсхолдерами {{name}})
    - locale: 'cs' | 'en'

notificationPreferences/
  {userId}/
    - enablePush: boolean
    - enableSms: boolean
    - enableEmail: boolean
    - smsReminderHours: number (24 по умолчанию)
    - emailReminderHours: number (24 по умолчанию)
```

## 3. API Контракт

### OpenAPI Specification
```yaml
paths:
  /api/v1/notifications:
    post:
      summary: Создать уведомление
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [type, recipientId, templateId]

  /api/v1/notifications/{notificationId}:
    get:
      summary: Статус уведомления

  /api/v1/users/{userId}/preferences:
    get:
      summary: Настройки уведомлений пользователя
    put:
      summary: Обновить настройки
```

## 4. Диаграмма последовательности

### Session Reminder Flow
```
Cloud Scheduler (*/5 * * * *)
    ↓
notification-scheduler Function
    ↓
    │ Query Firestore: sessions where
    │ dateTime between NOW+23h and NOW+25h
    │ AND status = 'scheduled'
    ↓
For each session:
    │ Query bookings for session
    │ For each booking:
    │   ↓
    │   Check notificationPreferences/{userId}
    │   │
    │   │ If enableSms:
    │   │   → Create notifications/{id} (type: sms)
    │   │ If enableEmail:
    │   │   → Create notifications/{id} (type: email)
    │   │ If enablePush:
    │   │   → Create notifications/{id} (type: push)
    ↓
notifications/{id} created (Firestore onCreate trigger)
    ↓
notification-service Function
    ↓
    │ Read template from notificationTemplates/
    │ Interpolate placeholders ({{name}}, {{sessionTime}})
    ↓
Switch by type:
    │
    ├─ SMS:
    │   └─ Twilio API: POST /Messages
    │       ↓
    │       Update notifications/{id}: status='sent', sentAt=NOW
    │
    ├─ Email:
    │   └─ SendGrid API: POST /mail/send
    │       ↓
    │       Update notifications/{id}: status='sent', sentAt=NOW
    │
    └─ Push:
        └─ Firebase Cloud Messaging: POST /send
            ↓
            Update notifications/{id}: status='sent', sentAt=NOW

If error:
    │ Update notifications/{id}: status='failed', error=message
    │ Retry logic (exponential backoff, max 3 attempts)
```

## 5. Интеграции

### 5.1. Twilio (SMS)
```typescript
// Firebase Function environment config
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=***
TWILIO_PHONE_NUMBER=+420...
```

### 5.2. SendGrid (Email)
```typescript
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=notifications@zabicekiosk.cz
```

### 5.3. Firebase Cloud Messaging (Push)
- Используем Firebase Admin SDK (уже настроен)
- FCM токены хранятся в `users/{userId}/fcmTokens` (массив)

## 6. Безопасность

### 6.1. Authentication
- API endpoints требуют Firebase Auth токен
- Only authenticated users can update own preferences

### 6.2. Firestore Security Rules
```javascript
match /notificationPreferences/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /notifications/{notificationId} {
  allow read: if request.auth.uid == resource.data.recipientId
              || hasRole('admin');
  allow write: if hasRole('admin');
}
```

### 6.3. Secrets Management
- Environment variables через Firebase Functions config
- NEVER commit API keys to git
- Rotate credentials quarterly

## 7. Тестирование

### 7.1. Unit Tests
- Template interpolation logic
- Retry logic
- Error handling

### 7.2. Integration Tests
- Mock Twilio/SendGrid responses
- Test Firestore triggers
- Test scheduling logic

### 7.3. E2E Tests (Playwright)
- Parent receives notification (check test SMS)
- Admin sees notification badge
- User can disable notifications

## 8. Мониторинг

### Metrics
- Notification send rate (per minute)
- Delivery success rate (sent / total)
- Error rate by provider (Twilio vs SendGrid vs FCM)
- Average delivery time

### Alerts
- Error rate > 5% (15 min window)
- Queue backlog > 100 pending
- Provider API downtime

### Logs (Structured)
```typescript
logger.info('Notification sent', {
  notificationId,
  type: 'sms',
  recipientId,
  duration: 1234, // ms
  provider: 'twilio'
});
```

## 9. Развёртывание

### Phase 1: Email только (неделя 1)
- Deploy notification-service (email only)
- Deploy notificationPreferences UI in parent-web
- Test with real users (opt-in beta)

### Phase 2: SMS (неделя 2)
- Add Twilio integration
- Enable SMS in preferences UI
- Monitor costs ($0.05 per SMS)

### Phase 3: Push (неделя 3)
- Implement FCM token collection
- Deploy push notification service
- Test on parent-web (browser push)

### Phase 4: Scheduler (неделя 4)
- Deploy notification-scheduler function
- Enable Cloud Scheduler
- Monitor for 1 week before full rollout

## 10. Стоимость

### Estimated Monthly Cost (1000 notifications/day)
- Firebase Functions: ~$5 (invocations)
- Firestore: ~$2 (reads/writes)
- Twilio SMS: ~$1500 (30k SMS × $0.05)
- SendGrid: $0 (free tier 100 emails/day)
- FCM: $0 (бесплатно)

**Total**: ~$1507/month

### Cost Optimization
- Batch email sends (reduce SendGrid API calls)
- Cache templates in memory
- Only send SMS for high-priority (default to push/email)

## 11. Roadmap

### Future Enhancements
- [ ] In-app notification center (admin-portal)
- [ ] A/B testing notification templates
- [ ] Rich push notifications (images, actions)
- [ ] Multi-language support (cs/en)
- [ ] WhatsApp integration (Twilio API)

---

**Следующие шаги:**
1. Review этой архитектуры с командой
2. Создать задачи в `.backlog/pending/` для каждой фазы
3. Начать с Phase 1 (email-only MVP)
```

---

## 🚀 Как запросить работу lean-architect

### Вариант 1: Прямой запрос (рекомендуется)
Просто напишите в Claude Code:
```
Спроектируй [описание системы/компонента]
```

### Вариант 2: Через задачу
Создайте файл `.backlog/draft/my-architecture.md` и попросите:
```
Обработай архитектурный запрос из .backlog/draft/my-architecture.md
```

### Вариант 3: Формальная задача
Создайте задачу в `.backlog/pending/` по шаблону и попросите:
```
Обработай архитектурные задачи из бэклога
```

---

## 📚 Что вы получите от lean-architect?

### Типичные deliverables:
1. **Архитектурный документ** (`docs/architecture/[feature]-architecture.md`)
   - Контекст и требования
   - Дизайн компонентов
   - API контракты
   - Модель данных
   - Диаграммы
   - Безопасность
   - Тестирование
   - План развёртывания

2. **ADR** (`docs/architecture/adr/ADR-XXX-[decision].md`)
   - Статус решения
   - Контекст
   - Обоснование
   - Последствия
   - Альтернативы

3. **OpenAPI спецификация** (`services/*/openapi-[feature].yaml`)
   - Endpoints
   - Request/Response схемы
   - Authentication
   - Error responses

4. **Диаграммы** (в Markdown / Mermaid)
   - Sequence diagrams
   - Component diagrams
   - Data flow diagrams

---

## ⚠️ Что lean-architect НЕ делает

❌ **Не пишет код реализации**
→ Для этого есть typescript-engineer, react-engineer

❌ **Не настраивает базы данных**
→ Для этого есть database-engineer

❌ **Не деплоит приложения**
→ Для этого есть devops

❌ **Не пишет тесты**
→ Для этого есть test-engineer

✅ **Lean-architect только проектирует и документирует!**

---

## 💡 Советы для эффективной работы

### 1. Будьте конкретны
❌ "Спроектируй систему"
✅ "Спроектируй систему уведомлений с SMS, email, push для zabicekiosk"

### 2. Укажите ограничения
✅ "Учти бюджет $100/месяц и масштаб до 10k пользователей"

### 3. Упомяните технологии (если важно)
✅ "Используй Firebase Functions и Twilio для SMS"

### 4. Опишите бизнес-требования
✅ "Родители должны получать напоминания за 24 часа до занятия"

### 5. Задавайте вопросы
✅ "Какие есть варианты реализации real-time sync между kiosk и admin?"

---

**Помните**: lean-architect работает в тандеме с другими агентами.
Сначала архитектура → потом реализация → потом тесты → потом деплой. 🏗️→⚙️→✅→🚀

**Создано**: 2025-11-03
**Файл**: `.backlog/draft/LEAN-ARCHITECT-EXAMPLES.md`
