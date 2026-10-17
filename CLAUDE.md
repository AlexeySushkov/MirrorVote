# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (localhost:5173)
npm run build      # tsc -b && vite build → dist/
npm run lint       # ESLint — currently broken: no eslint.config.js (ESLint 9 requires flat config)
npm run preview    # Preview production build locally
npm run pwa-icons  # Regenerate PWA icons from public/favicon.svg
```

```bash
npm test                                   # Vitest, all unit tests (run mode)
npm run test:watch                         # Vitest watch mode
npx vitest run src/utils/id.test.ts        # single file
npx vitest run -t "falls back to"          # single test by name
```

Verify changes with `npm test` and `npm run build` (includes type-check).

### Tests

- Vitest config lives in the `test` block of `vite.config.ts`; tests are colocated `src/**/*.test.{ts,tsx}`; setup in `src/test/setup.ts` (jest-dom matchers)
- Default environment is `node`; component/hook tests add `// @vitest-environment jsdom` as the first line
- Conventions and mocking patterns (Supabase client, TanStack Query, `LanguageProvider`): `.claude/skills/write-tests/SKILL.md` (`/write-tests`); subagent `test-writer` covers files changed on the branch
- New logic in `src/` comes with tests. Edge functions (Deno) are not covered — extract pure logic into `supabase/functions/_shared/` to test it
- Root folders `test/`, `testReal*/`, `testGen*/` are gitignored photo fixtures, not tests

## Architecture

### Routing & Entry

- App is served under `/app/` base path (set in `vite.config.ts` and React Router `basename`)
- Routes: `/`, `/auth`, `/v/:token` (public voting page for shared sessions, no auth), and protected `/sessions`, `/sessions/new`, `/sessions/:id`
- `vite.config.ts` defines globals `__APP_VERSION__` (from `package.json` `version`) and `__BUILD_DATE__` — bump the version in `package.json` for releases
- `src/main.tsx` — root: `<App>` + `<PWAUpdatePrompt>` (outside router, always mounted)
- `src/App.tsx` — providers stack: QueryClient → Language → Auth → Tooltip → BrowserRouter; routes + `<Toaster>`
- Protected routes wrapped in `<AuthGuard>` (redirects to `/auth` if no user)

### State & Data

- **Server state:** TanStack Query via custom hooks (`usePhotoSession`, `useOutfitAnalysis`, `usePhotoNormalization`)
- **Global state:** Two React contexts — `AuthContext` (user, sign-in/out, anonymous mode) and `LanguageContext` (i18n ru/en, translations as inline record keyed by `'section.key'`)
- **Local UI state:** `useCompareMode` (view mode), `useState` in components

### Supabase Integration

- Client in `src/integrations/supabase/client.ts` — reads credentials from `window.__APP_CONFIG__` (runtime `config.js` on server) with fallback to `import.meta.env`
- DB types in `src/integrations/supabase/types.ts` (auto-generated, don't hand-edit)
- DB migrations in `supabase/migrations/`, numbered sequentially (`NNN_description.sql`) — new migration takes the next number
- Edge Functions (Deno) in `supabase/functions/`: `analyze-outfits`, `normalize-photo`, `create-yookassa-payment`, `yookassa-webhook`, `cleanup-orphans`; shared CORS headers in `supabase/functions/_shared/cors.ts`
- `yookassa-webhook` has `verify_jwt = false` in `supabase/config.toml` (called by YooKassa, not by users)
- After deploying edge functions: disable **"Verify JWT with legacy secret"** toggle in Dashboard → Edge Functions → Details (re-check after each redeploy)

### AI Pipeline

1. **Photo normalization** (`normalize-photo` edge function) — calls OpenRouter image model (default: `google/gemini-2.5-flash-image`) to replace background + standardize pose. Stores result URL in `mirror_photos.processed_photo_url`
2. **Outfit analysis** (`analyze-outfits` edge function) — calls OpenRouter text model (default: `google/gemini-2.5-flash`) with occasion context. Returns per-photo scores + recommendation JSON. Calls `consume_analysis_credit()` RPC first (quota enforcement)

### PWA

- `vite-plugin-pwa` with `registerType: 'prompt'`, `skipWaiting: false`, `clientsClaim: true`
- `PWAUpdatePrompt` component shows update banner; onClick sends `SKIP_WAITING` + has 1s fallback reload
- `config.js` excluded from precache (runtime config must always be fetched fresh)

### Deployment (GitHub Actions CI/CD)

Push в `main` → автоматически: сборка → inject `config.js` из GitHub Secrets → rsync на сервер.

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

`dist/` **не коммитится** (в `.gitignore`). `config.js` с ключами Supabase не хранится в репо — генерируется в CI из секретов `SUPABASE_URL` и `SUPABASE_KEY`.

GitHub Secrets (настраиваются один раз в репо → Settings → Secrets → Actions):
- `SSH_PRIVATE_KEY` — приватный ключ от `webuser@mirror-vote.ru`
- `SUPABASE_URL` — `https://mirror-vote.ru/supabase`
- `SUPABASE_KEY` — anon-ключ из Supabase Dashboard

## Git Workflow

GitHub Flow — full process in [`CONTRIBUTING.md`](CONTRIBUTING.md). Push to `main` deploys to production, so:
- Never commit directly to `main`; create a branch from fresh `main` named `<type>/<kebab-description>` (`feat/`, `fix/`, `ui/`, `refactor/`, `docs/`, `chore/`)
- Conventional Commits (`feat:`, `fix:`, `ui:`, …); run `npm run build` before pushing
- Open PR with `gh pr create --base main`; CI (`.github/workflows/ci.yml`) runs build; merge with squash

## Key Conventions

- **Translations:** add keys to both `ru` and `en` objects in `src/contexts/LanguageContext.tsx`; use `t('section.key')` in components
- **Error toasts:** use `src/utils/errorToast.ts` helper; edge function errors parsed via `src/utils/supabaseFunctionError.ts`
- **Image IDs:** use `src/utils/id.ts` (wraps `crypto.randomUUID()` safely — don't call `randomUUID` directly as a reference, must call on `crypto` object)
- **File limits:** see `src/utils/constants.ts` (max file size, accepted formats)
- **Supabase Storage:** bucket `mirror_photos` is public — files accessible by URL without auth
