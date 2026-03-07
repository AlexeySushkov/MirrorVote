# MirrorVote — AI-помощник в примерочной

Веб-приложение для сравнения нарядов из примерочной с помощью AI. Загрузите 2–6 фото, получите AI-нормализацию для визуального сопоставления и оценку нарядов.

## Возможности

- **Загрузка фото** — drag-and-drop или камера телефона (2–6 фото, JPG/PNG/HEIC)
- **AI-нормализация** — выравнивание яркости, контраста и масштаба для честного сравнения
- **Режимы сравнения** — бок о бок, карусель, наложение с ползунком
- **AI-оценка** — оценка 1–10, рекомендация лучшего наряда, советы по стилю
- **Экспорт** — коллаж в JPG для шеринга

## Технологии

| Слой | Стек |
|------|------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Auth, Storage, Edge Functions) |
| AI | OpenRouter API (google/gemini-2.5-flash) |

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:5173 (или порт из вывода).

## Настройка Supabase

### 1. Проект и переменные окружения

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `.env.example` в `.env` и заполните:
   ```
   VITE_SUPABASE_URL="https://ваш-проект.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
   ```

### 2. База данных

Примените миграцию в SQL Editor (Dashboard → SQL Editor) или через CLI:

```bash
supabase db push
```

Создаются таблицы:
- **mirror_sessions** — сессии примерок
- **mirror_photos** — фотографии с параметрами нормализации и оценками AI

### 3. Storage

1. Dashboard → Storage → New bucket
2. Имя: `mirror_photos`
3. Public bucket: включить
4. Лимит: 10 MB, форматы: image/jpeg, image/png, image/heic

### 4. Edge Functions

1. Разверните функции:
   ```bash
   supabase functions deploy normalize-photo
   supabase functions deploy analyze-outfits
   ```
2. Добавьте секрет в Dashboard → Edge Functions → Secrets:
   - `OPENROUTER_API_KEY` — ключ с [openrouter.ai](https://openrouter.ai)

### 5. Auth

Включите провайдеры в Dashboard → Authentication → Providers:
- Email/Password
- Google OAuth (при необходимости)

## Структура проекта

```
src/
├── main.tsx              # Точка входа
├── App.tsx                # Роутинг и провайдеры
├── pages/                 # Index, Auth, Sessions, NewSession, Compare
├── components/
│   ├── ui/                # shadcn/ui
│   ├── session/           # PhotoUploader, PhotoGrid, SessionCard
│   ├── compare/           # SideBySide, CarouselView, OverlayView
│   ├── analysis/          # OutfitScore, AIRecommendation
│   └── share/             # CollageExport
├── contexts/              # Auth, Language (ru/en)
├── hooks/                 # usePhotoSession, useOutfitAnalysis
├── integrations/supabase/ # client, types
└── utils/                 # imageUtils, collageGenerator

supabase/
├── migrations/001_initial.sql
└── functions/
    ├── normalize-photo/   # AI-нормализация одного фото
    └── analyze-outfits/  # AI-оценка всех нарядов
```

## Маршруты

| Путь | Описание |
|------|----------|
| `/` | Редирект на /sessions или /auth |
| `/auth` | Вход, регистрация, сброс пароля |
| `/sessions` | Список сессий примерок |
| `/sessions/new` | Новая сессия — загрузка фото |
| `/sessions/:id` | Сравнение и оценка фото |

## Скрипты

```bash
npm run dev      # Разработка
npm run build    # Сборка
npm run preview  # Превью сборки
```

## Лицензия

MIT
