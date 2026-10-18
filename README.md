# MirrorVote — AI‑помощник выбора образа

Веб-приложение для сравнения нарядов из примерочной с помощью AI. Загрузите 1–6 фото, получите AI-обработку (AI Review) и оценку нарядов с учётом выбранного случая.

## Лендинг

- [**Приложение в Internet**](https://mirror-vote.ru/app)
- [**Лендинг в Internet**](https://mirror-vote.ru/)
- [**Лендинг на GitHub**](https://alexeysushkov.github.io/MirrorVoteLanding/)

## Возможности

- **Загрузка фото** — drag-and-drop, камера, галерея (1–6 фото, JPG/PNG/HEIC)
- **AI Review (image-to-image)** — AI-обработка: замена фона под выбранный контекст, студийный свет, единая поза, без телефона
- **Режимы сравнения** — Pick Best (по умолчанию), карусель
- **AI Review** — одна кнопка: выбор случая (офис, свидание и др.) + чекбокс «Единый фон и поза» (по умолчанию включён); нормализует фото под выбранный контекст, затем даёт оценку 1–10 и рекомендацию для каждого фото
- **Экспорт** — коллаж в JPG для шеринга
- **Голосование друзей** — публичная ссылка на сессию, друзья оценивают фото 1–5 звёзд, видят средний рейтинг

## Технологии

| Слой | Стек |
|------|------|
| **Frontend** | React 18, TypeScript, Vite 7, Tailwind CSS, shadcn/ui (Radix UI), React Router 6, TanStack Query 5 |
| **UI** | Lucide React (иконки), Embla Carousel, date-fns, Sonner (toast) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions на Deno) |
| **AI** | OpenRouter (оценка нарядов, AI Review через google/gemini-2.5-flash-image) |

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
   | `OPENROUTER_IMAGE_MODEL` | нет | normalize-photo | Модель для AI Review (image-to-image). По умолчанию: `google/gemini-2.5-flash-image`. Важно: только модель с поддержкой вывода изображений |
   | `YOOKASSA_SHOP_ID` | да (для подписки) | create-yookassa-payment, yookassa-webhook | Shop ID из личного кабинета ЮKassa |
   | `YOOKASSA_SECRET_KEY` | да (для подписки) | create-yookassa-payment, yookassa-webhook | Secret key ЮKassa |
   | `YOOKASSA_PACK_5_AMOUNT` | нет | create-yookassa-payment | Цена пакета 5 примерок в RUB, по умолчанию `99.00` |
   | `YOOKASSA_PACK_10_AMOUNT` | нет | create-yookassa-payment | Цена пакета 10 примерок в RUB, по умолчанию `179.00` |
   | `YOOKASSA_PACK_20_AMOUNT` | нет | create-yookassa-payment | Цена пакета 20 примерок в RUB, по умолчанию `299.00` |
   | `APP_URL` | да (для подписки) | create-yookassa-payment | Публичный URL приложения для `return_url` после оплаты |
   | `SUPABASE_URL` | — | все | Подставляется Supabase автоматически |
   | `SUPABASE_SERVICE_ROLE_KEY` | — | все | Подставляется Supabase автоматически |

   **Список моделей для AI Review** (переменная `OPENROUTER_IMAGE_MODEL`):
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

Кнопка «Войти через Google» **скрыта для пользователей из России** (406-ФЗ), см. `src/utils/geo.ts`:
- страна берётся из `/app/geo.json` (nginx + GeoIP, см. [§ 2.1](#21-определение-страны-geoip-опционально)); если он не настроен — по часовому поясу браузера;
- после входа через Google ставится метка `mv:usedGoogleAuth` в `localStorage` — кнопка остаётся видна при включении/выключении VPN;
- в dev страну можно подменить: `VITE_GEO_COUNTRY=RU` в `.env`.

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
│   ├── 008_credit_packs.sql          # user_credits, пакеты примерок
│   └── 009_fix_credit_period_ambiguity.sql  # фикс ON CONFLICT ambiguity
└── functions/
    ├── normalize-photo/              # AI Review: image-to-image + Storage
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

1. **Владелец сессии** — на странице «Мои примерки» нажимает кнопку «Ссылка для голосования» в карточке сессии. При первом нажатии генерируется уникальный `share_token`, затем открывается диалог с выбором действия: скопировать ссылку в буфер или открыть в новом окне браузера (например, `https://app.com/v/abc123def456`).
2. **Передача ссылки** — владелец отправляет ссылку друзьям (мессенджер, соцсети, любым способом).
3. **Друзья** — открывают ссылку в браузере; без авторизации видят фото сессии и под каждым — 5 звёзд для оценки.
4. **Оценка** — выбор 1–5 звёзд сохраняется в `mirror_votes`; один голосующий (fingerprint в localStorage) может изменить оценку — повторный клик сохраняет новое значение.
5. **Результаты** — под каждым фото отображаются средний рейтинг и количество оценок (например, `4.2 ★ · 3 votes`). Кнопка «Обновить» обновляет данные без перезагрузки страницы.
6. **Срок действия** — ссылка действует бессрочно; привязка к аккаунту не требуется.

### Технические детали

- **RPC** `get_public_session(p_token)` — возвращает сессию и фото с агрегатами (avg_rating, vote_count).
- **RPC** `submit_rating(p_token, p_photo_id, p_fingerprint, p_rating)` — сохраняет или обновляет оценку (1–5).
- **Fingerprint** — идентификатор в localStorage (`mv_fp_{token}`) для ограничения одного голоса на фото от одного голосующего.

### Безопасность ссылки для голосования

Ссылка намеренно публичная — владелец сам решает, кому её передать. Ниже описаны реализованные уровни защиты.

#### Уровни защиты

| Угроза | Механизм защиты | Статус |
|--------|----------------|--------|
| Перебор токенов | 12 hex-символов из `crypto.randomUUID()` = 48 бит энтропии = ~281 триллион вариантов | ✅ Надёжно |
| Прямой SELECT чужих сессий | Row Level Security: `USING (auth.uid() = user_id)` на всех таблицах | ✅ Заблокировано |
| Прямая запись голосов в БД | Политика `FOR ALL USING (false)` на `mirror_votes` — таблица закрыта полностью | ✅ Заблокировано |
| Накрутка оценки 1–5 | Валидация диапазона в `submit_rating`: `RAISE EXCEPTION` при rating < 1 или > 5 | ✅ Заблокировано |
| Утечка приватных полей через ссылку | `get_public_session` возвращает только `id`, `title`, `background` сессии и нужные поля фото — без `user_id`, `ai_recommendation`, `share_token` и т.д. (миграция `010`) | ✅ Исправлено |
| Накрутка голосов с одного устройства | Fingerprint в localStorage (`mv_fp_{token}`); `UNIQUE(session_id, photo_id, fingerprint)` в БД | ⚠️ Мягкая защита |

#### Что видит голосующий по ссылке

По ссылке `https://mirror-vote.ru/app/v/{token}` доступно только:
- название сессии и тип случая (background)
- фотографии нарядов (URL из публичного bucket `mirror_photos`)
- средний рейтинг и количество оценок по каждому фото

**Не передаётся:** `user_id` владельца, AI-рекомендации, статус сессии, токен, любые внутренние идентификаторы.

#### Ограничения

- **Накрутка голосов:** очистка `localStorage` позволяет проголосовать повторно. Fingerprint — защита от случайного двойного голоса, но не от намеренной накрутки. Для критичных голосований рассмотреть IP-ограничение или авторизацию.
- **Фото публичны:** bucket `mirror_photos` — public. Любой, у кого есть прямой URL фото, может его загрузить, даже без токена сессии. Для приватности — перейти на signed URLs (см. TODO).
- **Ссылка бессрочна:** токен не имеет срока действия. Отозвать ссылку можно только удалив `share_token` из сессии вручную в БД.

## Статусы сессий и фото

### Сессия (`mirror_sessions.status`)

| Статус (БД) | В интерфейсе | Описание | Когда устанавливается |
|-------------|--------------|----------|------------------------|
| `uploading` | Загрузка / Uploading | Загрузка фото | По умолчанию при создании сессии |
| `normalizing` | Обработка / Processing | AI Review в процессе | При запуске нормализации в NewSession или Compare |
| `ready` | Готово / Ready | Готово к анализу | После успешной нормализации; при ошибке — откат в ready |
| `analyzed` | Проанализировано / Analyzed | Анализ выполнен | После успешного Rate Outfits |

**Поток:** `uploading` → `normalizing` → `ready` → `analyzed`. При повторной нормализации в Compare сессия возвращается в `ready` (рекомендуется перезапустить анализ).

### Фото (`mirror_photos.status`)

| Статус | Описание | Когда устанавливается |
|--------|----------|------------------------|
| `uploaded` | Загружено | По умолчанию при вставке в БД |
| `normalizing` | В процессе AI Review | Перед вызовом normalize-photo |
| `ready` | Обработано | После успешного ответа от edge-функции |
| `error` | Ошибка обработки | При падении normalize-photo |

### Реализованные улучшения

- **Локализация** — статусы сессий отображаются на языке интерфейса (RU/EN)
- **Обработка ошибок** — при сбое нормализации фото получает `error`, сессия откатывается в `ready`
- **Повторная нормализация** — при AI Review в Compare сессия переходит в `normalizing` → `ready` (анализ нужно запустить заново)

## Деплой на сервере

Сервер: Selectel VPS, nginx, домен `mirror-vote.ru`. SPA раздаётся из `/var/www/mirror-vote-app-dist/`, все запросы к Supabase проксируются через nginx.

### 1. CI/CD (GitHub Actions)

Деплой автоматический: **push в `main` → сборка → rsync на сервер**.

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

Перед первым запуском добавить секреты в **GitHub → Settings → Secrets → Actions**:

| Secret | Значение |
|--------|---------|
| `SSH_PRIVATE_KEY` | Приватный ключ от `webuser@mirror-vote.ru` |
| `SUPABASE_URL` | `https://mirror-vote.ru/supabase` |
| `SUPABASE_KEY` | anon-ключ из Supabase Dashboard → API Keys |

Публичный ключ должен быть в `~/.ssh/authorized_keys` у `webuser` на сервере.

> `config.js` с ключами Supabase **не хранится в репо** — генерируется в CI из секретов и сразу уходит на сервер.

### 2. Конфигурация nginx

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

    # PWA: Service Worker — НИКОГДА не кэшировать HTTP-кэшем браузера.
    # Если sw.js закэширован с max-age, браузер не увидит обновлений.
    location = /app/sw.js {
        alias /var/www/mirror-vote-app-dist/sw.js;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # PWA: Web App Manifest — без кэша (браузер должен читать свежий)
    location = /app/manifest.webmanifest {
        alias /var/www/mirror-vote-app-dist/manifest.webmanifest;
        add_header Cache-Control "no-cache";
        add_header Content-Type "application/manifest+json";
    }
}
```

### 2.1. Определение страны (GeoIP, опционально)

Нужно, чтобы скрывать вход через Google для пользователей из РФ по IP. Без этого блока приложение работает: `/app/geo.json` отдаёт `index.html`, и фронт определяет страну по часовому поясу браузера.

База — [DB-IP Lite Country](https://db-ip.com/db/download/ip-to-country-lite) (бесплатно, без регистрации, CC BY 4.0 — атрибуция «IP Geolocation by DB-IP» уже есть на странице входа).

> ⚠️ **Порядок важен:** сначала скачайте базу, потом добавляйте `geoip2` в конфиг. Если файла `.mmdb` нет, nginx не запустится и ляжет весь сайт. Всегда `nginx -t` перед reload.

1. Модуль (nginx должен быть из репозитория дистрибутива — проверьте `apt policy nginx`):
   ```bash
   sudo apt install libnginx-mod-http-geoip2 mmdb-bin
   ```
2. Скрипт `/usr/local/bin/update-dbip.sh`:
   ```sh
   #!/bin/sh
   set -e
   mkdir -p /var/lib/GeoIP
   URL="https://download.db-ip.com/free/dbip-country-lite-$(date +%Y-%m).mmdb.gz"
   curl -fsSL "$URL" | gunzip > /var/lib/GeoIP/dbip-country.mmdb.tmp
   mv /var/lib/GeoIP/dbip-country.mmdb.tmp /var/lib/GeoIP/dbip-country.mmdb
   ```
   ```bash
   sudo chmod +x /usr/local/bin/update-dbip.sh
   sudo /usr/local/bin/update-dbip.sh
   mmdblookup --file /var/lib/GeoIP/dbip-country.mmdb --ip 77.88.8.8 country iso_code   # → "RU"
   echo '0 5 3 * * root /usr/local/bin/update-dbip.sh' | sudo tee /etc/cron.d/dbip
   ```
3. В `/etc/nginx/nginx.conf`, внутри `http { }`:
   ```nginx
   geoip2 /var/lib/GeoIP/dbip-country.mmdb {
       auto_reload 6h;
       $geoip2_country_code country iso_code;
   }
   ```
4. В `mirror-vote.ru.conf`, внутри `server { listen 443 ... }`, перед `location ^~ /app`:
   ```nginx
   location = /app/geo.json {
       default_type application/json;
       add_header Cache-Control "no-store";
       return 200 '{"country":"$geoip2_country_code"}';
   }
   ```
5. `sudo nginx -t && sudo systemctl reload nginx`, проверка: `curl https://mirror-vote.ru/app/geo.json`.

### 3. Проверка и перезапуск nginx

```bash
# Проверить конфиг перед применением
nginx -t

# Применить изменения без разрыва соединений
systemctl reload nginx

# Полный перезапуск (если reload не помог)
systemctl restart nginx
```

### 4. SSL-сертификат (Let's Encrypt)

```bash
certbot --nginx -d mirror-vote.ru -d www.mirror-vote.ru
```

Авторебью настраивается автоматически при установке certbot. Проверить:

```bash
systemctl status certbot.timer
```

### 6. Обновление приложения

Сделать `git push` в `main` — GitHub Actions соберёт и задеплоит автоматически (~25 сек).

> **Nginx перезапускать не нужно** — статические файлы читаются с диска при каждом запросе.

## PWA

MirrorVote — полноценный Progressive Web App. Одна кодовая база обслуживает и веб-браузер, и установленное приложение на смартфоне: никакой отдельной сборки нет, `dist/` одинаков для обоих случаев.

### Что добавлено

| Файл | Назначение |
|------|-----------|
| `dist/manifest.webmanifest` | Web App Manifest (название, иконки, `start_url`, `display: standalone`) |
| `dist/sw.js` | Сервис-воркер на Workbox — прекэш app shell, NetworkFirst для Supabase |
| `dist/pwa-192x192.png` | Иконка 192×192 (Android Chrome, обязательный минимум) |
| `dist/pwa-512x512.png` | Иконка 512×512 (splash screen при запуске) |
| `dist/maskable-icon-512x512.png` | Maskable-иконка для адаптивных иконок Android |
| `dist/apple-touch-icon-180x180.png` | Иконка для iOS Safari «Добавить на экран Домой» |

### Стратегии кэша сервис-воркера

| Ресурс | Стратегия | Почему |
|--------|-----------|--------|
| HTML / JS / CSS / шрифты / PNG (app shell) | **Precache** (CacheFirst) | Загружается без сети после первого визита |
| Supabase API (`*.supabase.co`) | **NetworkFirst**, timeout 10 сек | Данные должны быть свежими; при оффлайне — кэш последних запросов |
| Google Fonts CSS | **StaleWhileRevalidate** | Обновляется в фоне, показывает кэш сразу |
| Google Fonts woff2 | **CacheFirst**, 1 год | Файлы шрифтов почти никогда не меняются |
| `config.js` | **Без кэша** (исключён из precache) | Runtime-конфиг с ключами Supabase — должен всегда грузиться с сервера |

### Поведение оффлайн

App shell (HTML + JS + CSS) кэшируется после первого онлайн-визита. При следующем открытии без сети:
- Приложение запускается и показывает интерфейс
- Supabase-запросы падают через 10 сек → React Query показывает ошибку, toast уведомляет пользователя
- Аутентификация работает: Supabase хранит JWT в `localStorage`, `AuthContext` читает его синхронно без сети

### Уведомление об обновлении

Компонент `PWAUpdatePrompt` следит за новым сервис-воркером. При выходе новой версии пользователь видит toast:

> **Доступна новая версия** · кнопка «Обновить»

После нажатия SW активируется и страница перезагружается с новым кодом. Без подтверждения пользователя принудительного обновления не происходит.

### Установка на устройство

**Android Chrome** — после двух визитов на сайт Chrome предлагает «Установить приложение» в адресной строке. Приложение открывается в отдельном окне без адресной строки, иконка появляется на рабочем столе.

**iOS Safari** — автоматического баннера нет (ограничение iOS). Пользователь нажимает «Поделиться» → «На экран «Домой»». Приложение открывается в полноэкранном режиме (`display: standalone`), иконка — `apple-touch-icon-180x180.png`.

### Регенерация иконок

Если изменился `public/favicon.svg`:

```bash
npm run pwa-icons
```

Скрипт перегенерирует все четыре PNG из SVG. Конфиг: [scripts/pwa-icons.config.ts](scripts/pwa-icons.config.ts).

### Проверка после деплоя

```bash
# Локальная проверка собранной версии
npm run build
npm run preview
```

В **Chrome DevTools → Application**:
- **Service Workers** — статус `activated and is running`
- **Manifest** — все поля и иконки отображаются без ошибок
- **Lighthouse → PWA audit** — все проверки зелёные

### Nginx: обязательные заголовки для PWA

> Эти блоки уже включены в конфиг [§ 4. Конфигурация nginx](#4-конфигурация-nginx) ниже. Вынесено отдельно для наглядности.

```nginx
# Service Worker — НИКОГДА не кэшировать HTTP-кэшем.
# Если sw.js будет закэширован, браузер не увидит обновлений.
location = /app/sw.js {
    alias /var/www/mirror-vote-app-dist/sw.js;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    expires 0;
}

# Web App Manifest — без кэша
location = /app/manifest.webmanifest {
    alias /var/www/mirror-vote-app-dist/manifest.webmanifest;
    add_header Cache-Control "no-cache";
    add_header Content-Type "application/manifest+json";
}
```

**Почему это критично:** браузер проверяет обновления SW, скачивая `sw.js` и сравнивая байты. Если HTTP-кэш отдаёт старый файл, пользователи никогда не получат новую версию приложения. Lighthouse специально проверяет этот заголовок.

---

## Скрипты

```bash
npm run dev       # Разработка
npm run build     # Сборка
npm run preview   # Превью сборки
npm run pwa-icons # Регенерация PNG-иконок из public/favicon.svg
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
- [x] **PWA** — manifest.webmanifest, Workbox service worker, иконки, установка на домашний экран, офлайн app shell

### Функции
- [x] **Голосование друзей** — публичная ссылка на сессию, оценка 1–5 звёзд
- [ ] **Шеринг результатов** — поделиться в соцсети / мессенджер с превью
- [x] **Добавление фото в существующую сессию** — кнопка «добавить ещё» на странице сравнения
- [ ] **История анализов** — хранение нескольких оценок (разные occasion) для одной сессии
- [ ] **Теги и поиск** — теги для сессий, фильтр/поиск в списке
- [x] **Свайп-навигация** — жесты влево/вправо на мобильных (все режимы, включая полноэкранный в карусели)
- [x] **Полноэкранный режим** — просмотр фотографий на весь экран

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
- [x] **CI-деплой вместо коммита `dist/`** — GitHub Actions (`.github/workflows/deploy.yml`): push в `main` → сборка → rsync на Selectel; `dist/` убран из репо
- [ ] **E2E-тесты** — Playwright для основных сценариев
- [ ] **i18n** — вынести переводы в JSON, добавить языки

## История изменений

См. [CHANGELOG.md](./CHANGELOG.md).


## Лицензия

MIT
