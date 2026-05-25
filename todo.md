# TODO

## ⚠️ Безопасность — публичный ключ

Ключ показан в чате. Это **anon/publishable** ключ, он по дизайну публичный (любой может его увидеть, открыв `https://mirror-vote.ru/app/config.js`). Так что бить тревогу не надо — **при условии**, что в Supabase у тебя:

- [ ] Включён **RLS** (Row Level Security) на всех таблицах
- [ ] Политики настроены так, что anon ключ позволяет только то, что должно быть доступно публично

Если RLS выключен — anon ключ даёт **полный доступ ко всем данным**, и любой посетитель сайта может прочитать/изменить базу.

Проверить в Supabase Dashboard → Authentication → Policies, что у следующих таблиц стоит **RLS Enabled** и есть политики:

- [ ] `mirror_sessions`
- [ ] `mirror_photos`
- [ ] `mirror_votes`
- [ ] `billing_plan_limits`
- [ ] `billing_subscriptions`
- [ ] `usage_analytics_monthly`
- [ ] `billing_payment_events`

## Список pro пользователей (Supabase SQL Editor)

```sql
SELECT u.email, s.plan_code, s.status, s.current_period_end
FROM billing_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.plan_code = 'pro' AND s.status = 'active'
ORDER BY s.current_period_end DESC;
```

## Сделать пользователя pro (Supabase SQL Editor)

```sql
INSERT INTO billing_subscriptions (
  user_id,
  plan_code,
  status,
  current_period_start,
  current_period_end
)
VALUES (
  'd05fc398-9859-4933-afd5-8a02f3447e7f',
  'pro',
  'active',
  now(),
  now() + interval '30 days'
)
ON CONFLICT (user_id) DO UPDATE SET
  plan_code = 'pro',
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '30 days',
  updated_at = now();
```

## CI-деплой вместо коммита `dist/`

- [ ] GitHub Actions: на push в `main` запускать `npm run build` и `rsync dist/` на Selectel по SSH; после этого убрать `dist/` из репо и вернуть в `.gitignore`


## Это точно воспроизводит то, что делает YooKassa-вебхук после реальной покупки — добавляет кредиты к существующему балансу.

```sql
INSERT INTO user_credits (user_id, credits_remaining)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'alexey.p.sushkov@gmail.com'),
  100
)
ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = user_credits.credits_remaining + 100;
```

# До защиты 
## Проверить идею на сайтах

## Кнопки нажимать в 3D
## Сделать 1 кнопку 
## Перевод на английский

## На мобилке адаптировать 
### Листать пальцем
### Манифест плюс ссылка на экран

## Отложить
### SEO
### CI/CD

## План: Реализация lazy loading для страниц

 
---

## Архитектурный анализ (2026-05-19)

### Стек
React 18 + TypeScript + Vite · Supabase (Postgres + Auth + Storage + Edge Functions) · React Query 5 · Tailwind + Radix/shadcn · OpenRouter (Gemini 2.5 Flash) · YooKassa · Nginx + Selectel VPS

### Что оптимизировать

- **Параллельная нормализация фото** — сейчас последовательно (await в цикле). Promise.all с лимитом 2–3 ускорит в 2–3× при 6 фото. Файл: `src/hooks/usePhotoNormalization.ts`
- **Дублирование refresh-логики токена** — одинаковые 15 строк в `useOutfitAnalysis.ts` и `usePhotoNormalization.ts`. Нужен хелпер `getAuthToken()` в `src/utils/auth.ts`
- **React Query без `staleTime`** — каждый маунт триггерит фоновый рефетч. Достаточно `staleTime: 30_000` для сессий и фото
- **Нет rate limiting на Edge Functions** — `analyze-outfits` и `normalize-photo` защищены только кредитной системой; нужен лимит на уровне Supabase Edge
- **`as never` в usePhotoNormalization.ts:45** — признак устаревших Supabase-типов, нужна перегенерация `types.ts`

### Что переделать

- **Публичный Storage bucket → Signed URLs** — фотографии доступны по постоянным публичным URL навсегда. Нужны signed URL с TTL ~1 час. **Security issue** для личных фото
- **Удалить мёртвые компоненты** — `BeforeAfterView.tsx`, `SideBySide.tsx`, `OverlayView.tsx` не используются (~300 строк мёртвого кода)
- **PickBestView → попарный турнир** — текущее "исключение" теряет информацию. Сравнение A vs B даёт чёткий рейтинг
- **`dist/` убрать из git** — CI/CD через GitHub Actions + SSH rsync (уже в плане)
- **История анализов** — повторный анализ перезаписывает предыдущий. Нужна таблица `photo_analyses(photo_id, occasion, analysis_json, created_at)` вместо одного JSONB-поля

### Каких функций не хватает

**Высокий приоритет:**
- [ ] **PWA + manifest** — fashion-приложение используется с телефона в магазине, иконка на экране обязательна
- [ ] **Свайп в карусели** — Embla Carousel поддерживает touch нативно, достаточно включить
- [ ] **OG meta tags для /v/:token** — без preview-картинки ссылка в Telegram/WhatsApp выглядит как спам
- [ ] **Уведомление о голосовании** — владелец не знает, что друзья проголосовали; Supabase Realtime на `mirror_votes` решает без бэкенда
- [ ] **Lazy loading страниц** — `React.lazy()` + `Suspense`, ~20 мин работы

**Средний приоритет:**
- [ ] Dark mode
- [ ] Retry для конкретного фото при ошибке нормализации
- [ ] Счётчик голосов на SessionCard (сколько друзей проголосовало)
- [ ] Множественные оценки по случаю (офис 8/10, свидание 6/10 — одновременно)
- [ ] Auto-cleanup анонимных пользователей (pg_cron, старше 7 дней)

**Отложить:**
- E2E тесты (Playwright) — важно перед масштабированием
- SEO, sitemap
- Сравнение с гардеробом, стилевой профиль


## Глазик при вводе пароля 
## В ссылку для оценки встаавить ссылку на MirrorVote

