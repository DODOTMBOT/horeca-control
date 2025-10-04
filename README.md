# HoReCa SaaS Platform

Многоорганизационная SaaS платформа для индустрии HoReCa (Hotels, Restaurants, Cafes).

## 🏗️ Архитектура

### Роли и доступы

#### **Platform Owner** (Владелец платформы)
- **Доступ**: Полный доступ ко всем функциям платформы
- **Маршруты**: `/owner/*` - Owner Console
- **Права**: Управление всеми организациями, пользователями, настройки платформы
- **Назначение**: Через переменную `PLATFORM_OWNER_EMAIL` в `.env.local`

#### **Organization Roles** (Роли в организации)
1. **OWNER** - Владелец организации
   - Полный доступ к своей организации
   - Управление пользователями организации
   - Настройки организации

2. **ADMIN** - Администратор организации
   - Административные права в организации
   - Управление пользователями (кроме OWNER)

3. **MANAGER** - Менеджер
   - Управленческие права
   - Доступ к отчетам и аналитике

4. **EMPLOYEE** - Сотрудник
   - Базовые права доступа
   - Работа с основными функциями

### Защищенные маршруты

#### **Публичные маршруты** (не требуют авторизации)
- `/` - Главная страница
- `/pricing` - Планы подписки
- `/api/auth/*` - NextAuth endpoints

#### **Защищенные маршруты** (требуют авторизации)
- `/dashboard` - Панель управления
- `/billing` - Управление подписками
- `/org/*` - Управление организацией
- `/api/secure/*` - Защищенные API endpoints

#### **Owner маршруты** (только для Platform Owner)
- `/owner/*` - Owner Console

## 🔧 Настройка

### 1. Переменные окружения

Создайте файл `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."
SHADOW_DATABASE_URL="postgresql://...?schema=shadow&sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Local Authentication
# No external OAuth providers needed

# Platform Owner
PLATFORM_OWNER_EMAIL="your-email@example.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2. Настройка Platform Owner

1. Установите ваш email в `PLATFORM_OWNER_EMAIL`
2. При первой регистрации с этим email вы автоматически получите права Platform Owner
3. Доступ к `/owner` будет доступен только вам

## 🚀 Запуск

### Установка зависимостей
```bash
npm install
```

### Настройка базы данных
```bash
# Применить схему
npx prisma db push

# Запустить seed (создать роли)
npx prisma db seed

# Сгенерировать Prisma Client
npx prisma generate
```

### Запуск в режиме разработки
```bash
npm run dev
```

## 📁 Структура проекта

```
├── app/
│   ├── (app)/              # Защищенные страницы приложения
│   │   ├── dashboard/      # Панель управления
│   │   ├── labeling/       # Инструменты разметки
│   │   ├── files/          # Управление файлами
│   │   └── learning/       # Обучение
│   ├── (owner)/            # Owner Console
│   │   └── owner/         # Административная панель
│   ├── api/auth/          # NextAuth API routes
│   └── pricing/           # Страница планов
├── components/
│   ├── AppNav.tsx         # Навигация приложения
│   └── AuthButtons.tsx    # Кнопки авторизации
├── lib/
│   ├── auth.ts            # NextAuth конфигурация
│   ├── guards.ts          # Guard утилиты
│   └── prisma.ts          # Prisma Client
├── prisma/
│   ├── schema.prisma      # Схема базы данных
│   └── seed.ts            # Seed скрипт
└── middleware.ts          # Middleware для защиты маршрутов
```

## 🔐 Безопасность

### Guard утилиты

```typescript
// Требовать авторизацию
const session = await requireSession()

// Требовать права Platform Owner
const session = await requirePlatformOwner()

// Требовать принадлежность к организации
const session = await requireTenant()

// Проверить роль пользователя
const { session, role } = await hasRole('ADMIN')

// Проверить любую из ролей
const { session, roles } = await hasAnyRole(['ADMIN', 'MANAGER'])
```

### Middleware защита

- Автоматический редирект на `/api/auth/signin` для неавторизованных пользователей
- Проверка прав Platform Owner для `/owner/*` маршрутов
- Защита API endpoints через `/api/secure/*`

## 🎯 Пользовательские сценарии

### Новый пользователь
1. Регистрируется через email/пароль
2. Автоматически создается организация с именем `<email>-org`
3. Пользователь получает роль OWNER в своей организации
4. Получает доступ к `/dashboard` и другим защищенным маршрутам

### Platform Owner
1. Устанавливается через `PLATFORM_OWNER_EMAIL`
2. При входе получает `isPlatformOwner = true`
3. Получает доступ к `/owner` - Owner Console
4. Может управлять всеми организациями и пользователями

## 🛠️ Разработка

### Добавление новых ролей
1. Обновите `prisma/seed.ts`
2. Запустите `npx prisma db seed`
3. Обновите guard утилиты при необходимости

### Добавление новых защищенных маршрутов
1. Добавьте маршрут в `middleware.ts` config.matcher
2. Используйте guard утилиты в компонентах страниц
3. Обновите навигацию в `AppNav.tsx`

### Добавление новых функций
1. Создайте страницы в `app/(app)/`
2. Добавьте проверки доступа через guard утилиты
3. Обновите навигацию и middleware при необходимости

## 📦 Модули проекта (скелет)

### 🏷️ Маркировки (`/labeling`)
**Назначение**: Управление маркировками продуктов и отслеживание сроков годности

**Функциональность**:
- Создание и управление продуктами
- Печать этикеток с QR-кодами
- Отслеживание сроков годности
- Анализ статистики по продуктам

**Модели данных**:
- `Product` - продукты с информацией о сроке годности
- `Label` - напечатанные этикетки с датами

### 📁 Файлы (`/files`)
**Назначение**: Централизованное хранение и управление файлами организации

**Функциональность**:
- Загрузка и скачивание файлов
- Организация файлов по папкам
- Настройка прав доступа
- Поиск файлов по содержимому

**Модели данных**:
- `File` - файлы с метаданными и путями

### 🎓 Обучение (`/learning`)
**Назначение**: Система обучения сотрудников и управления знаниями

**Функциональность**:
- Создание курсов и уроков
- Назначение обучения сотрудникам
- Отслеживание прогресса обучения
- Проведение тестирований

**Модели данных**:
- `Course` - курсы обучения
- `Lesson` - уроки в рамках курсов

## 💳 Mock Billing

### Как работает Mock Billing

Mock Billing - это система тестовых платежей для разработки, которая имитирует реальные платежные процессы без внешних API.

#### Настройка
```env
DEV_PAYMENT_PROVIDER="mock"
DEV_PAYMENT_ALLOW_IN_PROD="false"
```

#### Функциональность
- **Активация подписки**: При нажатии "Оформить BASIC/PRO" подписка сразу активируется
- **Mock-оплата**: Статус меняется на `ACTIVE`, `currentPeriodEnd` устанавливается на +30 дней
- **Портал-заглушка**: Кнопка "Управлять подпиской" возвращает обратно на `/billing`
- **Защита от продакшена**: В production mock отключен (если `DEV_PAYMENT_ALLOW_IN_PROD !== "true"`)

#### Доступ к биллингу
- Пункт меню "Биллинг" виден только пользователям с ролями `OWNER` или `ADMIN`
- Защищен middleware - требует авторизации

#### Замена на реальные платежи

Для перехода на реальные платежи:

1. **YooKassa** (рекомендуется для России):
   ```typescript
   // lib/payments/yookassa.ts
   export class YooKassaProvider implements PaymentProvider {
     // Реализация YooKassa API
   }
   ```

2. **Stripe** (международные платежи):
   ```typescript
   // lib/payments/stripe.ts  
   export class StripeProvider implements PaymentProvider {
     // Реализация Stripe API
   }
   ```

3. **Переключение провайдера**:
   ```env
   DEV_PAYMENT_PROVIDER="yookassa"  # или "stripe"
   ```

#### Структура платежной системы
```
lib/payments/
├── types.ts          # Интерфейсы и типы
├── mock.ts          # Mock провайдер
├── yookassa.ts      # YooKassa провайдер (TODO)
├── stripe.ts        # Stripe провайдер (TODO)
└── index.ts         # Фабрика провайдеров
```

#### API Endpoints
- `POST /api/billing/checkout` - Создание сессии оплаты
- `POST /api/billing/portal` - Создание сессии управления подпиской  
- `POST /api/billing/webhook` - Обработка webhook'ов от платежных систем# horeca-control
