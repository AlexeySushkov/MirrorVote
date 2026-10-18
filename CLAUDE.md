# CLAUDE.md

Этот файл содержит инструкции для Claude Code (claude.ai/code) по работе с кодом в этом репозитории.

## Команды

```bash
npm run dev        # Dev-сервер (localhost:5173)
npm run build      # tsc -b && vite build → dist/
npm run lint       # ESLint (eslint.config.js); в CI — с --max-warnings 0
npm run preview    # Локальный просмотр production-сборки
npm run pwa-icons  # Перегенерировать PWA-иконки из public/favicon.svg
```

```bash
npm test                                   # Vitest, все unit-тесты (однократный запуск)
npm run test:watch                         # Vitest в watch-режиме
npx vitest run src/utils/id.test.ts        # один файл
npx vitest run -t "falls back to"          # один тест по имени
```

Проверять изменения через `npm test` и `npm run build` (включает проверку типов).

### Тесты

- Конфиг Vitest — блок `test` в `vite.config.ts`; тесты лежат рядом с кодом: `src/**/*.test.{ts,tsx}`; setup — `src/test/setup.ts` (матчеры jest-dom)
- Окружение по умолчанию — `node`; тесты компонентов/хуков добавляют первой строкой `// @vitest-environment jsdom`
- Соглашения и паттерны моков (клиент Supabase, TanStack Query, `LanguageProvider`): `.claude/skills/write-tests/SKILL.md` (`/write-tests`); сабагент `test-writer` покрывает тестами файлы, изменённые в ветке
- Новая логика в `src/` — вместе с тестами. Edge-функции (Deno) тестами не покрыты — чтобы протестировать, выносить чистую логику в `supabase/functions/_shared/`
- Папки в корне `test/`, `testReal*/`, `testGen*/` — игнорируемые git фото-фикстуры, а не тесты

## Архитектура

### Роутинг и точка входа

- Приложение отдаётся по базовому пути `/app/` (задан в `vite.config.ts` и в `basename` React Router)
- Маршруты: `/`, `/auth`, `/v/:token` (публичная страница голосования по ссылке, без авторизации) и защищённые `/sessions`, `/sessions/new`, `/sessions/:id`
- `vite.config.ts` задаёт глобальные константы `__APP_VERSION__` (из `version` в `package.json`) и `__BUILD_DATE__` — версию поднимает release-please (см. «Git-процесс»)
- `src/main.tsx` — корень: `<App>` + `<PWAUpdatePrompt>` (вне роутера, смонтирован всегда)
- `src/App.tsx` — стек провайдеров: QueryClient → Language → Auth → Tooltip → BrowserRouter; маршруты + `<Toaster>`
- Защищённые маршруты обёрнуты в `<AuthGuard>` (редирект на `/auth`, если нет пользователя)

### Состояние и данные

- **Серверное состояние:** TanStack Query через свои хуки (`usePhotoSession`, `useOutfitAnalysis`, `usePhotoNormalization`)
- **Глобальное состояние:** два React-контекста — `AuthContext` (пользователь, вход/выход, анонимный режим) и `LanguageContext` (i18n ru/en, переводы — inline-объект с ключами вида `'section.key'`)
- **Локальное UI-состояние:** `useCompareMode` (режим просмотра), `useState` в компонентах

### Интеграция с Supabase

- Клиент — `src/integrations/supabase/client.ts`: берёт ключи из `window.__APP_CONFIG__` (runtime `config.js` на сервере), fallback — `import.meta.env`
- Типы БД — `src/integrations/supabase/types.ts` (сгенерированы автоматически, вручную не править)
- Миграции БД — `supabase/migrations/`, нумерация по порядку (`NNN_description.sql`) — новая миграция берёт следующий номер
- Edge Functions (Deno) в `supabase/functions/`: `analyze-outfits`, `normalize-photo`, `create-yookassa-payment`, `yookassa-webhook`, `cleanup-orphans`; общие CORS-заголовки — `supabase/functions/_shared/cors.ts`
- У `yookassa-webhook` стоит `verify_jwt = false` в `supabase/config.toml` (его вызывает YooKassa, а не пользователи)
- После деплоя edge-функций: выключить тумблер **«Verify JWT with legacy secret»** в Dashboard → Edge Functions → Details (перепроверять после каждого передеплоя)

### AI-пайплайн

1. **Нормализация фото** (edge-функция `normalize-photo`) — вызывает image-модель OpenRouter (по умолчанию `google/gemini-2.5-flash-image`): заменяет фон и выравнивает позу. URL результата сохраняется в `mirror_photos.processed_photo_url`
2. **Анализ образов** (edge-функция `analyze-outfits`) — вызывает текстовую модель OpenRouter (по умолчанию `google/gemini-2.5-flash`) с учётом случая (occasion). Возвращает JSON с оценками по каждому фото и рекомендацией. Сначала вызывает RPC `consume_analysis_credit()` (контроль квоты)

### PWA

- `vite-plugin-pwa` с `registerType: 'prompt'`, `skipWaiting: false`, `clientsClaim: true`
- Компонент `PWAUpdatePrompt` показывает баннер обновления; по клику отправляет `SKIP_WAITING` + fallback-перезагрузка через 1 с
- `config.js` исключён из precache (runtime-конфиг всегда должен загружаться заново)

### Деплой (GitHub Actions CI/CD)

Push в `main` → автоматически: сборка → inject `config.js` из GitHub Secrets → rsync на сервер.

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

`dist/` **не коммитится** (в `.gitignore`). `config.js` с ключами Supabase не хранится в репо — генерируется в CI из секретов `SUPABASE_URL` и `SUPABASE_KEY`.

GitHub Secrets (настраиваются один раз в репо → Settings → Secrets → Actions):
- `SSH_PRIVATE_KEY` — приватный ключ от `webuser@mirror-vote.ru`
- `SUPABASE_URL` — `https://mirror-vote.ru/supabase`
- `SUPABASE_KEY` — anon-ключ из Supabase Dashboard

## Git-процесс

GitHub Flow — полный процесс в [`CONTRIBUTING.md`](CONTRIBUTING.md). Push в `main` деплоит на прод, поэтому:
- Никогда не коммитить напрямую в `main`; создавать ветку от свежего `main` с именем `<тип>/<описание-в-kebab-case>` (`feat/`, `fix/`, `ui/`, `refactor/`, `docs/`, `chore/`)
- Conventional Commits (`feat:`, `fix:`, `ui:`, …); перед push запускать `npm run lint`, `npm test` и `npm run build`
- PR открывать через `gh pr create --base main`; CI (`.github/workflows/ci.yml`) запускает lint + тесты + сборку; вливать через squash
- Заголовок PR становится squash-коммитом и определяет версию — тип выбирать осознанно (`feat` → minor, `fix`/`ui`/`perf` → patch, `!` → major, `docs`/`chore`/`test`/`refactor` → без релиза)
- Версиями управляет release-please (`release-please-config.json`, `.release-please-manifest.json`): никогда не править вручную `version` в `package.json` и `CHANGELOG.md`; релиз = merge PR бота `chore: release vX.Y.Z`
- Ревью PR: `/review-pr [номер]` — проверка по чек-листу проекта (тот же, что в `.github/pull_request_template.md`)

## Ключевые соглашения

- **Переводы:** добавлять ключи в оба объекта `ru` и `en` в `src/contexts/LanguageContext.tsx`; в компонентах использовать `t('section.key')`
- **Тосты ошибок:** использовать хелпер `src/utils/errorToast.ts`; ошибки edge-функций разбираются через `src/utils/supabaseFunctionError.ts`
- **ID изображений:** использовать `src/utils/id.ts` (безопасная обёртка над `crypto.randomUUID()` — не вызывать `randomUUID` как отдельную ссылку, только как метод объекта `crypto`)
- **Лимиты файлов:** см. `src/utils/constants.ts` (максимальный размер, допустимые форматы)
- **Supabase Storage:** бакет `mirror_photos` публичный — файлы доступны по URL без авторизации
