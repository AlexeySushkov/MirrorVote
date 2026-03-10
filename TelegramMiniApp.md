# Telegram Mini App для MirrorVote

Mini App — это существующее веб-приложение, которое открывается внутри Telegram. Проект не нужно переписывать — нужно его адаптировать.

---

## Шаг 1: Подготовка бота

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → задать имя и username
3. Записать **bot token** (например `7123456789:AAH...`)
4. `/mybots` → выбрать бота → **Bot Settings** → **Menu Button** → задать URL приложения (тот же `https://your-domain.com` где задеплоен Vite-билд)

## Шаг 2: Настройка Mini App в BotFather

```
/mybots → ваш бот → Bot Settings → Menu Button
→ Configure menu button
→ URL: https://your-domain.com
→ Title: Open MirrorVote
```

Или через Web App info:
```
/myapps → Create App (или через /newapp)
→ URL: https://your-domain.com
```

## Шаг 3: Подключить Telegram WebApp SDK

В `index.html` добавить скрипт Telegram:

```html
<head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
```

После этого в браузере Telegram будет доступен глобальный объект `window.Telegram.WebApp`.

## Шаг 4: Аутентификация через initData

Telegram передаёт данные пользователя автоматически. Схема:

```
[Telegram App]
    │
    ▼  window.Telegram.WebApp.initData (строка с user_id, username, hash)
[Фронтенд]
    │
    ▼  POST /functions/v1/telegram-auth  { initData }
[Edge Function]
    │  1. Проверяет подпись (hash) с помощью bot token
    │  2. Ищет/создаёт пользователя через supabase.auth.admin
    │  3. Возвращает { access_token, refresh_token }
    ▼
[Фронтенд]
    │  supabase.auth.setSession({ access_token, refresh_token })
    ▼
    Пользователь авторизован — всё как обычно
```

### Edge Function `telegram-auth` (примерная структура):

```typescript
// supabase/functions/telegram-auth/index.ts
import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { initData } = await req.json()
  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

  // 1. Парсить initData (URLSearchParams)
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')!
  params.delete('hash')

  // 2. Проверить подпись
  const sorted = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN).digest()
  const checkHash = createHmac('sha256', secretKey)
    .update(sorted).digest('hex')

  if (checkHash !== hash) {
    return new Response(JSON.stringify({ error: 'Invalid hash' }), { status: 401 })
  }

  // 3. Извлечь данные пользователя
  const userData = JSON.parse(params.get('user')!)
  const telegramId = userData.id
  const email = `tg_${telegramId}@telegram.local`

  // 4. Создать/найти пользователя через Admin API
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Попробовать найти существующего
  const { data: existing } = await supabaseAdmin.auth.admin
    .listUsers()  // или искать по email

  // Если нет — создать
  const { data: user } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      telegram_id: telegramId,
      first_name: userData.first_name,
      username: userData.username,
    },
  })

  // 5. Сгенерировать сессию
  // (через generateLink или signInWithPassword с auto-generated password)

  return new Response(JSON.stringify({ access_token, refresh_token }))
})
```

## Шаг 5: Адаптация фронтенда

Определить, запущено ли приложение внутри Telegram:

```typescript
const isTelegramWebApp = Boolean(window.Telegram?.WebApp?.initData)

if (isTelegramWebApp) {
  // 1. Автоматическая авторизация (без страницы /auth)
  const initData = window.Telegram.WebApp.initData
  const { access_token, refresh_token } = await fetch('/functions/v1/telegram-auth', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  }).then(r => r.json())

  await supabase.auth.setSession({ access_token, refresh_token })

  // 2. Настроить UI Telegram
  window.Telegram.WebApp.ready()
  window.Telegram.WebApp.expand()  // развернуть на весь экран
}
```

## Шаг 6: Возможности Telegram WebApp API

Внутри Mini App доступны нативные элементы Telegram:

| API | Что делает |
|---|---|
| `WebApp.MainButton` | Кнопка внизу экрана ("Continue", "Rate Outfits") |
| `WebApp.BackButton` | Кнопка "Назад" |
| `WebApp.HapticFeedback` | Вибрация при действиях |
| `WebApp.close()` | Закрыть Mini App |
| `WebApp.sendData(data)` | Отправить данные боту |
| `WebApp.themeParams` | Цвета темы Telegram (для стилизации) |

## Итого: минимальный план

1. Создать бота в BotFather, задать Menu Button URL
2. Добавить `telegram-web-app.js` в `index.html`
3. Создать Edge Function `telegram-auth` для проверки `initData` и создания сессии
4. На фронте: если `Telegram.WebApp.initData` есть — авторизоваться автоматически, пропустить `/auth`
5. Задеплоить (Vite build на любой хостинг с HTTPS)

Приложение будет работать **и в браузере** (как сейчас), **и внутри Telegram** (с автоматической авторизацией).

## Supabase Secrets

Добавить в Dashboard → Edge Functions → Secrets:

- `TELEGRAM_BOT_TOKEN` — токен бота от BotFather
