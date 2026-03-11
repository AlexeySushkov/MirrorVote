# MirrorVote — AI-помощник в примерочной

Веб-приложение для сравнения нарядов из примерочной с помощью AI. Загрузите 1–6 фото, получите AI-обработку (Simple Look) и оценку нарядов с учётом выбранного случая.

## История изменений

### 2026-03-11

- **Layout Pic the Best и Carousel** — кнопки под изображением, текст (вердикт, анализ) под кнопками; в Pick Best: фото сверху, затем Restart/Exclude/точки, затем Winner; основные кнопки (Sessions, Add Photos, Rate, Simple Look, Export) под каруселью/фото
- **Rate Outfits** — текст анализа появляется сразу после нажатия Rate (без перезагрузки): исправлен activePhoto для pick-best (берётся из photosList по id), добавлен refetchQueries после анализа
- **Simple Look** — картинки с новым фоном появляются сразу после выбора фона: синхронизация remaining в PickBestView при изменении photos, cache-bust (?t=timestamp) для URL обработанных фото, key на img для перезагрузки при смене URL
- **Кнопка Original** — глобальный переключатель всех фото: Original / Back to Look (вместо Simple Look при показе оригинала); показывается при наличии хотя бы одного обработанного фото

### 2026-03-09

- **Rate Outfit** — выбор случая (офис, свидание, вечеринка, свой вариант), оценка с учётом контекста, текстовая рекомендация для каждого фото
- **Рекомендации** — убраны отдельные блоки AI Recommendation и Score; вердикт показывается под текущим фото и меняется при пролистывании
- **Simple Look** (бывший Clear Look) — кнопка внизу, прогресс-бар при обработке, обрабатываются только новые фото
- **Добавление фото** — кнопка «Добавить фото» на странице сравнения для существующей сессии
- **Сессии** — создание только при загрузке первого фото; кнопка Sessions для возврата без создания новой
- **Загрузка** — отдельные кнопки «Сделать фото» и «Из галереи»
- **Pick Best** — режим по умолчанию и первый в списке; Exclude с счётчиком (1/4); убрано имя файла из Winner
- **Режимы** — удалены Side by Side, Before/After, Overlay; остались Carousel и Pick Best
- **Кнопка Original** — при показе Simple Look: нажал — показать исходник, отпустил — скрыть
- **Обновление данных** — refetchQueries вместо invalidateQueries: результаты появляются сразу после анализа, Simple Look, добавления фото
- **Telegram Mini App** — инструкция в [TelegramMiniApp.md](./TelegramMiniApp.md)
- **TODO** — расширенный список в README

## Возможности

- **Загрузка фото** — drag-and-drop, камера, галерея (1–6 фото, JPG/PNG/HEIC)
- **Simple Look (image-to-image)** — AI-обработка: чистый фон, студийный свет, единая поза, без телефона
- **Режимы сравнения** — Pick Best (по умолчанию), карусель
- **AI-оценка** — выбор случая (офис, свидание и др.), оценка 1–10, рекомендация для каждого фото
- **Экспорт** — коллаж в JPG для шеринга

## Технологии

| Слой | Стек |
|------|------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Auth, Storage, Edge Functions) |
| AI | OpenRouter (оценка нарядов, Simple Look через google/gemini-2.5-flash-image) |

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:5173 (или порт из вывода).

## Настройка Supabase

### 0. Установка Supabase CLI через npm

Если `supabase` команда не найдена, установите CLI локально в проект:

```bash
npm install --save-dev supabase
```

Запускать CLI можно без глобальной установки:

```bash
npx supabase --version
npx supabase login
npx supabase db push
npx supabase functions deploy normalize-photo
npx supabase functions deploy analyze-outfits
```

Альтернатива для npm:

```bash
npm exec supabase -- --version
```

### 1. Проект и переменные окружения

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `.env.example` в `.env` и заполните:
   ```
   VITE_SUPABASE_URL="https://ваш-проект.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
   ```
   Допустимо также имя `VITE_SUPABASE_ANON_KEY` вместо `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. После изменения `.env` перезапустите `npm run dev`.

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
2. **Где задавать Deno.env** — переменные окружения для Edge Functions задаются в **Supabase Dashboard → Edge Functions → Secrets**. Эти значения доступны в коде через `Deno.env.get('ИМЯ')`. Добавить секрет: кнопка **Add new secret** → Name и Value. Через CLI: `supabase secrets set ИМЯ=значение`. После изменения секретов функции нужно передеплоить.

   **Параметры для Edge Functions:**

   | Параметр | Обязательный | Функция | Описание |
   |----------|--------------|---------|----------|
   | `OPENROUTER_API_KEY` | да | normalize-photo, analyze-outfits | Ключ API с [openrouter.ai](https://openrouter.ai) |
   | `OPENROUTER_MODEL` | нет | analyze-outfits | Модель для оценки нарядов (Rate Outfits). По умолчанию: `google/gemini-2.5-flash` |
   | `OPENROUTER_IMAGE_MODEL` | нет | normalize-photo | Модель для Simple Look (image-to-image). По умолчанию: `google/gemini-2.5-flash-image`. Важно: только модель с поддержкой вывода изображений, не подставляйте текстовую модель |
   | `SUPABASE_URL` | — | все | Подставляется Supabase автоматически |
   | `SUPABASE_SERVICE_ROLE_KEY` | — | все | Подставляется Supabase автоматически |

3. Для функций `analyze-outfits` и `normalize-photo` в Dashboard → Edge Functions → Details выключите переключатель `Verify JWT with legacy secret` и сохраните изменения.
   Это убирает конфликт legacy-режима с пользовательским JWT и предотвращает ошибку `401 Invalid JWT` при вызове функций из приложения.
   После каждого redeploy функций перепроверьте этот переключатель и, если он снова включился, выключите его повторно.

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
    ├── normalize-photo/   # Simple Look: image-to-image + загрузка в Storage
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

## Обслуживание: анонимные пользователи

Анонимные пользователи (`signInAnonymously`) создают записи в `auth.users` с флагом `is_anonymous = true`. Их данные со временем накапливаются. Ниже SQL-скрипты для Supabase Dashboard → SQL Editor (требуются права `service_role`).

### Посмотреть статистику анонимных данных

```sql
SELECT
  (SELECT count(*) FROM auth.users WHERE is_anonymous = true) AS anon_users,
  (SELECT count(*) FROM public.mirror_sessions s
     JOIN auth.users u ON u.id = s.user_id WHERE u.is_anonymous = true) AS anon_sessions,
  (SELECT count(*) FROM public.mirror_photos p
     JOIN auth.users u ON u.id = p.user_id WHERE u.is_anonymous = true) AS anon_photos;
```

### Найти анонимные сессии и фото

```sql
-- Анонимные пользователи
SELECT id, created_at, last_sign_in_at
FROM auth.users
WHERE is_anonymous = true;

-- Их сессии
SELECT s.*
FROM public.mirror_sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.is_anonymous = true;

-- Их фото
SELECT p.*
FROM public.mirror_photos p
JOIN auth.users u ON u.id = p.user_id
WHERE u.is_anonymous = true;
```

### Удалить все данные анонимных пользователей

```sql
-- 1. Удалить сессии (фото удалятся каскадно через ON DELETE CASCADE)
DELETE FROM public.mirror_sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE is_anonymous = true
);

-- 2. Удалить самих анонимных пользователей
DELETE FROM auth.users
WHERE is_anonymous = true;
```

### Удалить только старых анонимов (старше 7 дней)

```sql
DELETE FROM public.mirror_sessions
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE is_anonymous = true
    AND created_at < now() - interval '7 days'
);

DELETE FROM auth.users
WHERE is_anonymous = true
  AND created_at < now() - interval '7 days';
```

### Найти файлы анонимов в Storage (bucket)

```sql
-- Файлы анонимных пользователей в bucket mirror_photos
SELECT
  o.name AS storage_path,
  o.created_at,
  (o.metadata->>'size')::int AS size_bytes,
  u.id AS user_id
FROM storage.objects o
JOIN auth.users u
  ON u.id::text = (storage.foldername(o.name))[1]
WHERE o.bucket_id = 'mirror_photos'
  AND u.is_anonymous = true;

-- Объём файлов анонимов
SELECT
  count(*) AS file_count,
  pg_size_pretty(sum((o.metadata->>'size')::bigint)) AS total_size
FROM storage.objects o
JOIN auth.users u
  ON u.id::text = (storage.foldername(o.name))[1]
WHERE o.bucket_id = 'mirror_photos'
  AND u.is_anonymous = true;
```

### Полная очистка анонимов (Storage + БД + Auth)

Порядок важен: сначала файлы, потом записи, потом пользователи.

```sql
-- 1. Файлы из Storage
DELETE FROM storage.objects
WHERE bucket_id = 'mirror_photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM auth.users WHERE is_anonymous = true
  );

-- 2. Сессии (фото из mirror_photos удалятся каскадно)
DELETE FROM public.mirror_sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE is_anonymous = true
);

-- 3. Сами пользователи
DELETE FROM auth.users
WHERE is_anonymous = true;
```

### Edge Function: cleanup-orphans

Автоматическая очистка осиротевших файлов и записей. Деплой:

```bash
supabase functions deploy cleanup-orphans
```

Использование:

```bash
# Сухой прогон — посмотреть что будет удалено (ничего не удаляет)
curl "https://ваш-проект.supabase.co/functions/v1/cleanup-orphans?dry_run=true" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"

# Реальное удаление
curl "https://ваш-проект.supabase.co/functions/v1/cleanup-orphans" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

Функция находит и удаляет:
- Файлы в Storage, чья сессия удалена из `mirror_sessions`
- Записи в `mirror_sessions`, чей пользователь удалён из `auth.users`

> **Примечание:** файлы из Storage при удалении записей из БД **не удаляются автоматически** — используйте `cleanup-orphans` для очистки.

## TODO

### Интеграции
- [ ] **Telegram Mini App** — запуск внутри Telegram с авто-авторизацией через бота. Инструкция: [TelegramMiniApp.md](./TelegramMiniApp.md)
- [ ] **PWA** — manifest.json, service worker, установка на домашний экран, офлайн-заглушка

### Функции
- [ ] **Голосование друзей** — публичная ссылка на сессию, друзья голосуют за лучший наряд
- [ ] **Шеринг результатов** — поделиться в соцсети / мессенджер с превью
- [x] **Добавление фото в существующую сессию** — кнопка «добавить ещё» на странице сравнения
- [ ] **История анализов** — хранение нескольких оценок (разные occasion) для одной сессии
- [ ] **Теги и поиск** — теги для сессий, фильтр/поиск в списке
- [ ] **Свайп-навигация** — жесты влево/вправо на мобильных
- [ ] **Полноэкранный режим** — просмотр фотографий на весь экран

### AI
- [ ] **Рекомендация покупки** — «купи / не бери» с аргументацией
- [ ] **Сравнение с гардеробом** — загрузить фото гардероба, AI оценит совместимость
- [ ] **Ценовой анализ** — ввести цену, AI оценит value-for-money
- [ ] **Стилевой профиль** — AI строит профиль предпочтений пользователя со временем

### Монетизация
- [ ] **Лимиты и подписка** — бесплатно N анализов/месяц, платный план для безлимита

### Техническое
- [ ] **Оптимизация изображений** — WebP, lazy loading, CDN
- [ ] **Rate limiting** — защита edge-функций от злоупотреблений
- [ ] **Автоудаление анонимов** — cron (pg_cron / GitHub Actions) для очистки старых анонимных сессий
- [ ] **E2E-тесты** — Playwright для основных сценариев
- [ ] **i18n** — вынести переводы в JSON, добавить языки

## Лицензия

MIT
