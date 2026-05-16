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

INSERT INTO user_credits (user_id, credits_remaining)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'alexey.p.sushkov@gmail.com'),
  100
)
ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = user_credits.credits_remaining + 100;


