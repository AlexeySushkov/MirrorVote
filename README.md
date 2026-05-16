# MirrorVote — AI-помощник в примерочной

Веб-приложение для сравнения нарядов из примерочной с помощью AI. Загрузите 1–6 фото, получите AI-обработку (Simple Look) и оценку нарядов с учётом выбранного случая.

## Лендинг

- [**Лендинг на GitHub**](https://alexeysushkov.github.io/MirrorVoteLanding/)
- [**Лендинг на Selectel**](https://alexeysushkov.github.io/MirrorVoteLanding/) - TBD


## История изменений

### 2026-05-15

- **Фикс URL обработанных фото через прокси** — edge-функция `normalize-photo` возвращает `processedStoragePath` вместо готового URL; фронтенд сам генерирует URL через `supabase.storage.getPublicUrl()`, используя настроенный прокси-домен (`mirror-vote.ru/supabase`). Раньше обработанные фото всегда загружались напрямую с `byyiwfyetzlegbowqbtn.supabase.co`, в обход nginx-прокси
- **Удалён лишний cache-bust `?t=Date.now()`** — после обработки Compare добавлял `?t=timestamp` к URL в React Query, но не в БД. Это ломало кэш браузера (уникальный URL при каждой обработке) и создавало расхождение между кэшем и БД. Имя файла уже содержит timestamp (`photoId_processed_<ts>.jpg`), URL и так уникален
- **Ограничение высоты фото** — добавлен `max-h-[calc(100svh-26rem)]` на контейнер изображения в `PhotoCard` и `BeforeAfterView`, чтобы при высоком разрешении экрана фото не выталкивало кнопки за пределы экрана
- **`object-contain` вместо `object-cover` в PhotoCard** — изображение масштабируется целиком без обрезки; ранее `object-cover` обрезал фото по краям когда `max-h` ограничивал высоту контейнера
- **Упрощён PhotoCard** — убран вспомогательный `div` с `aspect-[3/4]`; `max-h-[calc(100svh-26rem)]` и `max-w-full` применяются прямо на `<img>`, внешний контейнер получил `w-fit mx-auto` — изображение масштабируется корректно без лишней обёртки
- **Переименование кредитов** — в UI «примерок» заменено на «оценок» (кнопка «Купить 5 оценок», плашка «Осталось X оценок», описание платежа YooKassa) — термин точнее отражает назначение: кредиты списываются за AI-оценку нарядов, а не за факт примерки
- **Цвет кнопки destructive** — скорректирован оттенок с чисто-красного (`0 84% 60%`) на тёплый красно-оранжевый (`8 75% 48%`) в светлой и тёмной теме

### 2026-05-12

- **Пакеты примерок** — заменена модель Pro-подписки на разовые пакеты: 5/10/20 примерок без срока давности. При исчерпании пользователь возвращается на free (3/мес). Новая таблица `user_credits`, функция `add_user_credits()`, обновлены `consume_analysis_credit` и `get_analysis_quota`
- **Иконка шапки** — вместо иконки `Shirt` (lucide) используется `favicon.svg`
- **Кнопка покупки** — красная кнопка «Купить 5 примерок» рядом с плашкой Free вместо отдельного блока
- **Проксирование Supabase через nginx** — все запросы (API, Auth, Storage, Edge Functions) идут через `mirror-vote.ru/supabase/` для обхода блокировок; CORS-заголовки добавляются nginx
- **Фикс `crypto.randomUUID` в edge function** — метод вызывался без `this`-контекста при создании платежа YooKassa (`Illegal invocation`)
- **Лимит free** — снижен с 5 до 3 примерок в месяц

### 2026-05-11

- **Фикс загрузки фото** — `crypto.randomUUID` вызывался без `this`-контекста (ссылка извлекалась в переменную), что приводило к `TypeError: Illegal invocation` при добавлении любого фото в сессию. Метод теперь вызывается на самом `crypto`.

### 2026-05-10

- **Совместимость с supabase-js 2.98** — `Database` приведён к `GenericSchema`: добавлены `Relationships: []` всем таблицам, а также `Views`, `Enums`, `CompositeTypes` в `public`. Без этого RPC и `.update()` сваливались в тип `never` и блокировали `tsc`.
- **Чистка билда** — убраны неиспользуемые импорты (`Toggle`, `Loader2`); `useDeletePhoto` теперь принимает `string | undefined` (`sessionId ?? undefined`); в `Sessions.tsx` `.then().catch()` заменён на `.then(success, failure)`, т.к. supabase-js возвращает `PromiseLike` без `.catch`; в `VotePage.tsx` каст `Json` → `PublicSessionData` через `unknown`.
- **Сборка `dist/` в репо** — `dist/` убран из `.gitignore`, готовый production-бандл коммитится в репозиторий для прямой раздачи со статического хостинга без CI.

### 2026-05-09

- **Монетизация и лимиты** — добавлены таблицы `billing_plan_limits`, `billing_subscriptions`, `usage_analytics_monthly` и RPC `consume_analysis_credit` / `get_analysis_quota` для модели free/pro с лимитом бесплатных анализов
- **YooKassa подписка** — добавлены edge-функции `create-yookassa-payment` и `yookassa-webhook`; оплата создаётся с idempotence key, webhook обновляет подписку пользователя
- **UI квоты и апгрейда** — на странице Compare показывается текущая квота анализов, кнопка `Upgrade` доступна всегда и ведёт на оплату YooKassa
- **Совместимость окружений** — заменено использование `crypto.randomUUID()` на fallback-генератор ID в фронтенде и функции создания платежа
- **Цена Pro** — значение по умолчанию `YOOKASSA_PRO_AMOUNT` изменено с `299.00` на `99.00`

### 2026-03-14

- **Голосование друзей** — публичная ссылка на сессию (`/v/:token`), оценка фото 1–5 звёзд; таблица `mirror_votes`, RPC `get_public_session` и `submit_rating`
- **Кнопка «Ссылка для голосования»** — перенесена в карточку сессии (SessionCard); при клике генерирует share_token, копирует URL в буфер; окантовка (variant outline)
- **Страница голосования (VotePage)** — рейтинг (4.2 ★ · 3 votes) вынесен на отдельную строку выше, увеличен шрифт; кнопка «Обновить» для обновления данных без перезагрузки страницы
- **Фон в карточке и голосовании** — колонка `background` в `mirror_sessions`; в карточке и на VotePage отображается «Примерка (Офис)» и т.п.; фон сохраняется при Simple Look
- **Rate Outfit — кнопка Neutral** — в диалоге выбора случая добавлена кнопка «Нейтральный» на всю ширину сверху; при нажатии анализ с промптом по умолчанию (без occasion)
- **Технологии** — расширенный стек в README (Frontend, UI, Backend, AI)
- **TODO** — пункт «Приватность Storage» (публичный bucket, signed URLs)
- **Статусы сессий и фото** — локализация статусов (RU/EN) в карточках примерок; при ошибке нормализации фото получает `status: error`, сессия откатывается в `ready`; при повторной нормализации в Compare сессия обновляется (`normalizing` → `ready`); документация в README

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
- **Голосование друзей** — публичная ссылка на сессию, друзья оценивают фото 1–5 звёзд, видят средний рейтинг

## Технологии

| Слой | Стек |
|------|------|
| **Frontend** | React 18, TypeScript, Vite 7, Tailwind CSS, shadcn/ui (Radix UI), React Router 6, TanStack Query 5 |
| **UI** | Lucide React (иконки), Embla Carousel, date-fns, Sonner (toast) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions на Deno) |
| **AI** | OpenRouter (оценка нарядов, Simple Look через google/gemini-2.5-flash-image) |

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
- **mirror_sessions** — сессии примерок (в т.ч. `share_token` для публичных ссылок)
- **mirror_photos** — фотографии с параметрами нормализации и оценками AI
- **mirror_votes** — голоса друзей (оценки 1–5 звёзд по каждому фото)
- **billing_plan_limits** — лимиты анализов по тарифам
- **billing_subscriptions** — подписки пользователей (история платежей)
- **usage_analytics_monthly** — ежемесячное использование анализов
- **billing_payment_events** — лог событий от YooKassa
- **user_credits** — баланс купленных примерок (пакеты без срока)

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
   | `OPENROUTER_IMAGE_MODEL` | нет | normalize-photo | Модель для Simple Look (image-to-image). По умолчанию: `google/gemini-2.5-flash-image`. Важно: только модель с поддержкой вывода изображений |
   | `YOOKASSA_SHOP_ID` | да (для подписки) | create-yookassa-payment, yookassa-webhook | Shop ID из личного кабинета ЮKassa |
   | `YOOKASSA_SECRET_KEY` | да (для подписки) | create-yookassa-payment, yookassa-webhook | Secret key ЮKassa |
   | `YOOKASSA_PACK_5_AMOUNT` | нет | create-yookassa-payment | Цена пакета 5 примерок в RUB, по умолчанию `99.00` |
   | `YOOKASSA_PACK_10_AMOUNT` | нет | create-yookassa-payment | Цена пакета 10 примерок в RUB, по умолчанию `179.00` |
   | `YOOKASSA_PACK_20_AMOUNT` | нет | create-yookassa-payment | Цена пакета 20 примерок в RUB, по умолчанию `299.00` |
   | `APP_URL` | да (для подписки) | create-yookassa-payment | Публичный URL приложения для `return_url` после оплаты |
   | `SUPABASE_URL` | — | все | Подставляется Supabase автоматически |
   | `SUPABASE_SERVICE_ROLE_KEY` | — | все | Подставляется Supabase автоматически |

   **Список моделей для Simple Look** (переменная `OPENROUTER_IMAGE_MODEL`):
   - `google/gemini-2.5-flash-image` — по умолчанию
   - `openai/gpt-5-image-mini`
   - `google/gemini-3-pro-image-preview`
   - `black-forest-labs/flux.2-klein-4b`

3. Для функций `analyze-outfits` и `normalize-photo` в Dashboard → Edge Functions → Details выключите переключатель `Verify JWT with legacy secret` и сохраните изменения.
   Это убирает конфликт legacy-режима с пользовательским JWT и предотвращает ошибку `401 Invalid JWT` при вызове функций из приложения.
   После каждого redeploy функций перепроверьте этот переключатель и, если он снова включился, выключите его повторно.

4. Для монетизации разверните дополнительные функции:
   ```bash
   supabase functions deploy create-yookassa-payment
   supabase functions deploy yookassa-webhook
   ```

5. Настройте HTTP-уведомления в ЮKassa (личный кабинет → Интеграция → HTTP-уведомления):
   - URL: `https://<project-ref>.supabase.co/functions/v1/yookassa-webhook`
   - Событие: `payment.succeeded`
   - Метод аутентификации: HTTP Basic Auth (настройка webhook через личный кабинет).
   Требования и формат webhook см. в документации: [Входящие уведомления ЮKassa](https://yookassa.ru/developers/using-api/webhooks), [HTTP-уведомления в личном кабинете](https://yookassa.ru/my/merchant/integration/http-notifications).

### 5. Auth

Включите провайдеры в Dashboard → Authentication → Providers:
- Email/Password
- Google OAuth (при необходимости)

## Структура проекта

```
src/
├── main.tsx              # Точка входа
├── App.tsx               # Роутинг и провайдеры
├── pages/                # Index, Auth, Sessions, NewSession, Compare, VotePage, NotFound
├── components/
│   ├── ui/               # shadcn/ui
│   ├── layout/           # AppHeader
│   ├── session/          # PhotoUploader, PhotoGrid, SessionCard
│   ├── vote/             # StarRating (5 звёзд)
│   ├── compare/          # CarouselView, PickBestView, PhotoCard
│   ├── analysis/         # InlineVerdict, PhotoVerdict
│   └── share/            # CollageExport
├── contexts/             # AuthContext, LanguageContext (ru/en)
├── hooks/                # usePhotoSession, useOutfitAnalysis, usePhotoNormalization,
│                         # useCompareMode, use-mobile
├── integrations/supabase/ # client, types
└── utils/                # imageUtils, collageGenerator, errorToast,
                          # supabaseFunctionError, normalizationUtils, constants, id

supabase/
├── migrations/
│   ├── 001_initial.sql
│   ├── 002_storage_policies.sql
│   ├── 003_add_processed_photo_url.sql
│   ├── 004_voting_and_sharing.sql    # share_token, mirror_votes, RPC
│   ├── 005_add_session_background.sql
│   ├── 006_billing_limits_and_subscription.sql
│   ├── 007_fix_quota_period_ambiguity.sql
│   └── 008_credit_packs.sql          # user_credits, пакеты примерок
└── functions/
    ├── normalize-photo/              # Simple Look: image-to-image + Storage
    ├── analyze-outfits/             # AI-оценка нарядов + quota check
    ├── create-yookassa-payment/     # Создание платежа (пакеты 5/10/20)
    ├── yookassa-webhook/            # Пополнение user_credits после оплаты
    └── cleanup-orphans/             # Очистка осиротевших файлов
```

## Маршруты

| Путь | Описание |
|------|----------|
| `/` | Редирект на /sessions или /auth |
| `/auth` | Вход, регистрация, сброс пароля |
| `/sessions` | Список сессий примерок |
| `/sessions/new` | Новая сессия — загрузка фото |
| `/sessions/:id` | Сравнение и оценка фото |
| `/v/:token` | Публичная страница голосования (без авторизации) |

## Голосование друзей

Публичная ссылка позволяет друзьям оценивать наряды от 1 до 5 звёзд без регистрации.

### Процесс

1. **Владелец сессии** — на странице «Мои примерки» нажимает кнопку «Ссылка для голосования» в карточке сессии. При первом нажатии генерируется уникальный `share_token`, ссылка копируется в буфер обмена (например, `https://app.com/v/abc123def456`).
2. **Передача ссылки** — владелец отправляет ссылку друзьям (мессенджер, соцсети, любым способом).
3. **Друзья** — открывают ссылку в браузере; без авторизации видят фото сессии и под каждым — 5 звёзд для оценки.
4. **Оценка** — выбор 1–5 звёзд сохраняется в `mirror_votes`; один голосующий (fingerprint в localStorage) может изменить оценку — повторный клик сохраняет новое значение.
5. **Результаты** — под каждым фото отображаются средний рейтинг и количество оценок (например, `4.2 ★ · 3 votes`). Кнопка «Обновить» обновляет данные без перезагрузки страницы.
6. **Срок действия** — ссылка действует бессрочно; привязка к аккаунту не требуется.

### Технические детали

- **RPC** `get_public_session(p_token)` — возвращает сессию и фото с агрегатами (avg_rating, vote_count).
- **RPC** `submit_rating(p_token, p_photo_id, p_fingerprint, p_rating)` — сохраняет или обновляет оценку (1–5).
- **Fingerprint** — идентификатор в localStorage (`mv_fp_{token}`) для ограничения одного голоса на фото от одного голосующего.

## Статусы сессий и фото

### Сессия (`mirror_sessions.status`)

| Статус (БД) | В интерфейсе | Описание | Когда устанавливается |
|-------------|--------------|----------|------------------------|
| `uploading` | Загрузка / Uploading | Загрузка фото | По умолчанию при создании сессии |
| `normalizing` | Обработка / Processing | Simple Look (AI) в процессе | При запуске нормализации в NewSession или Compare |
| `ready` | Готово / Ready | Готово к анализу | После успешной нормализации; при ошибке — откат в ready |
| `analyzed` | Проанализировано / Analyzed | Анализ выполнен | После успешного Rate Outfits |

**Поток:** `uploading` → `normalizing` → `ready` → `analyzed`. При повторной нормализации в Compare сессия возвращается в `ready` (рекомендуется перезапустить анализ).

### Фото (`mirror_photos.status`)

| Статус | Описание | Когда устанавливается |
|--------|----------|------------------------|
| `uploaded` | Загружено | По умолчанию при вставке в БД |
| `normalizing` | В процессе Simple Look | Перед вызовом normalize-photo |
| `ready` | Обработано | После успешного ответа от edge-функции |
| `error` | Ошибка обработки | При падении normalize-photo |

### Реализованные улучшения

- **Локализация** — статусы сессий отображаются на языке интерфейса (RU/EN)
- **Обработка ошибок** — при сбое нормализации фото получает `error`, сессия откатывается в `ready`
- **Повторная нормализация** — при Simple Look в Compare сессия переходит в `normalizing` → `ready` (анализ нужно запустить заново)

## Деплой на сервере

Сервер: Selectel VPS, nginx, домен `mirror-vote.ru`. SPA раздаётся из `/var/www/mirror-vote-app-dist/`, все запросы к Supabase проксируются через nginx.

### 1. Сборка

```bash
npm run build
```

Собранный бандл появится в `dist/`.

### 2. Конфигурация бандла (`config.js`)

После деплоя на сервере отредактировать `/var/www/mirror-vote-app-dist/config.js`:

```js
window.__APP_CONFIG__ = {
  SUPABASE_URL: 'https://mirror-vote.ru/supabase',  // nginx-прокси
  SUPABASE_KEY: 'eyJ...',  // anon/publishable ключ из Supabase Dashboard → API Keys
}
```

> Файл не пересобирается при изменении — достаточно отредактировать его на сервере и обновить страницу в браузере.

### 3. Копирование файлов на сервер

```bash
rsync -avz --delete dist/ user@mirror-vote.ru:/var/www/mirror-vote-app-dist/
```

После копирования восстановить `config.js` (rsync перезапишет его пустым из репо):

```bash
ssh user@mirror-vote.ru "nano /var/www/mirror-vote-app-dist/config.js"
```

### 4. Конфигурация nginx

Файл: `/etc/nginx/sites-enabled/mirror-vote.ru.conf`

```nginx
# HTTP → HTTPS редирект
server {
    listen 80;
    server_name mirror-vote.ru www.mirror-vote.ru;
    return 301 https://mirror-vote.ru$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mirror-vote.ru www.mirror-vote.ru;

    ssl_certificate     /etc/letsencrypt/live/mirror-vote.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mirror-vote.ru/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20m;
    charset utf-8;
    root /var/www/landing;
    index index.html;

    access_log /var/log/nginx/mirror-vote.ru_access.log;
    error_log  /var/log/nginx/mirror-vote.ru_error.log;

    # Статические файлы (лендинг + ассеты)
    location ~* \.(jpg|jpeg|gif|png|css|js|webp|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Прокси Supabase (API, Auth, Storage, Edge Functions)
    # ^~ отключает regex-матчинг после совпадения префикса
    location ^~ /supabase/ {
        proxy_pass https://<project-ref>.supabase.co/;
        proxy_ssl_server_name on;
        proxy_set_header Host <project-ref>.supabase.co;
        proxy_set_header Origin "";
        proxy_set_header Referer "";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Headers;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Credentials;

        add_header Access-Control-Allow-Origin "https://mirror-vote.ru" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, apikey, Content-Type, X-Client-Info, X-Supabase-Api-Version" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://mirror-vote.ru";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, apikey, Content-Type, X-Client-Info, X-Supabase-Api-Version";
            add_header Access-Control-Max-Age 3600;
            return 204;
        }
    }

    # Лендинг
    location / {
        try_files $uri $uri/ /index.html;
    }

    # SPA (React) на /app
    location ^~ /app {
        alias /var/www/mirror-vote-app-dist/;
        try_files $uri $uri/ /app/index.html;
    }

    location = /app {
        return 301 /app/;
    }

    # index.html без кеша — чтобы после деплоя браузер не использовал старую версию
    location = /app/index.html {
        alias /var/www/mirror-vote-app-dist/index.html;
        add_header Cache-Control "no-cache, must-revalidate";
        expires 0;
    }

    # config.js — runtime-конфиг, меняется без пересборки, НЕ кэшировать
    # ВАЖНО: этот блок должен быть ДО общего правила location ~* \.(js)$
    location = /app/config.js {
        alias /var/www/mirror-vote-app-dist/config.js;
        add_header Cache-Control "no-cache, must-revalidate";
        expires 0;
    }
}
```

### 5. Проверка и перезапуск nginx

```bash
# Проверить конфиг перед применением
nginx -t

# Применить изменения без разрыва соединений
systemctl reload nginx

# Полный перезапуск (если reload не помог)
systemctl restart nginx
```

### 6. SSL-сертификат (Let's Encrypt)

```bash
certbot --nginx -d mirror-vote.ru -d www.mirror-vote.ru
```

Авторебью настраивается автоматически при установке certbot. Проверить:

```bash
systemctl status certbot.timer
```

### 7. Обновление приложения

```bash
# 1. Собрать локально
npm run build

# 2. Скопировать на сервер
rsync -avz --delete dist/ user@mirror-vote.ru:/var/www/mirror-vote-app-dist/

# 3. Восстановить config.js (rsync перезапишет его пустым)
ssh user@mirror-vote.ru "nano /var/www/mirror-vote-app-dist/config.js"
```

> **Nginx перезапускать не нужно** — статические файлы читаются с диска при каждом запросе.

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
- [x] **Голосование друзей** — публичная ссылка на сессию, оценка 1–5 звёзд
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
- [ ] **Оценка размера одежды** - по загруженному фото  

### Монетизация
- [x] **Пакеты примерок** — бесплатно 3 анализа/месяц; покупка пакетов 5/10/20 без срока давности

### Техническое
- [ ] **Приватность Storage** — bucket `mirror_photos` публичный: любой с URL может скачать фото. Варианты: приватный bucket + signed URLs, или Edge Function для проверки прав перед отдачей файла
- [ ] **Оптимизация изображений** — WebP, lazy loading, CDN
- [ ] **Rate limiting** — защита edge-функций от злоупотреблений
- [ ] **Автоудаление анонимов** — cron (pg_cron / GitHub Actions) для очистки старых анонимных сессий
- [ ] **CI-деплой вместо коммита `dist/`** — GitHub Actions: на push в `main` запускать `npm run build` и `rsync dist/` на Selectel по SSH; после этого убрать `dist/` из репо и вернуть в `.gitignore`
- [ ] **E2E-тесты** — Playwright для основных сценариев
- [ ] **i18n** — вынести переводы в JSON, добавить языки

## Лицензия

MIT
