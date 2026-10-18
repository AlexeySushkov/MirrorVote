---
name: review-pr
description: Review a MirrorVote PR or the current branch against the project checklist (PR title type → version, Supabase migrations/RLS, edge functions, YooKassa webhook, credit quota, i18n, PWA, tests). Use before merging or when asked to review a PR. Args - PR number; if omitted, review current branch vs main.
---

# Reviewing a PR in MirrorVote

Read-only review: report findings, do not edit files unless the user asks.

## 1. Collect the change
- `$ARGUMENTS` is a PR number → `gh pr view $ARGUMENTS --json title,body,files` and `gh pr diff $ARGUMENTS`.
- Empty → current branch: `git log --oneline main..HEAD`, `git diff main...HEAD --stat`, `git diff main...HEAD`, plus uncommitted changes (`git status`).
- Read the touched files in full where the diff lacks context — not only the hunks.

## 2. Title and version
- PR title (or the commit that will become the squash commit) is a Conventional Commit.
- Type matches the change: `feat` → minor, `fix`/`ui`/`perf` → patch, `!`/`BREAKING CHANGE` → major, `docs`/`chore`/`test`/`refactor` → no release. User-visible behaviour change under `chore`/`refactor`, or a non-functional change under `feat`, is a `blocker:`.
- `version` in `package.json` and `CHANGELOG.md` are not edited by hand (release-please owns them).

## 3. Correctness first
Edge cases (null/empty, offline, anonymous user, expired session), error handling, race conditions in TanStack Query hooks (invalidation, optimistic updates), unhandled promise rejections.

## 4. Project checklist — only for areas the diff touches
**`supabase/migrations/`**
- File takes the next number (`NNN_description.sql`); existing migrations are never edited.
- New tables: `enable row level security` + policies; `security definer` functions set `search_path`.
- Safe on production data (defaults for new NOT NULL columns, no destructive drops without a reason).
- `src/integrations/supabase/types.ts` regenerated, not hand-edited.

**`supabase/functions/`**
- Secrets never reach responses, logs or the client; CORS via `_shared/cors.ts`.
- `yookassa-webhook` (`verify_jwt = false`): verifies the request really comes from YooKassa; idempotent — a repeated event must not grant credits twice.
- `analyze-outfits`: `consume_analysis_credit()` runs before calling OpenRouter; quota cannot be bypassed.
- New pure logic belongs in `_shared/` with tests (Deno functions are otherwise untested).
- Remind: after merge deploy from `main` and switch off "Verify JWT with legacy secret".

**Storage / access**
- Bucket `mirror_photos` is public — nothing private goes there.
- Public route `/v/:token` and anonymous mode do not expose other users' data.

**`src/`**
- UI strings added to both `ru` and `en` in `src/contexts/LanguageContext.tsx`, used via `t('section.key')`.
- Errors via `src/utils/errorToast.ts`; edge-function errors parsed via `src/utils/supabaseFunctionError.ts`.
- IDs via `src/utils/id.ts` (no detached `randomUUID`); file limits from `src/utils/constants.ts`.
- Reuses existing hooks/utils instead of duplicating them.
- New logic has `*.test.ts(x)` next to it; component/hook tests start with `// @vitest-environment jsdom`.

**PWA / build** (`vite.config.ts`, service worker, `PWAUpdatePrompt`)
- `config.js` stays excluded from precache; suggest checking with `npm run build && npm run preview`.

## 5. Recommend follow-ups
- Touches `supabase/functions/`, `supabase/migrations/`, auth or payments → recommend `/security-review`.
- New logic in `src/` without tests → recommend the `test-writer` subagent.
- Large or risky diff → mention `/code-review` (or `/code-review ultra`, user-triggered).

## Output
- Findings grouped by severity, each prefixed `blocker:` / `suggestion:` / `nit:` / `question:`, with a `file:line` reference and a one-line *why*.
- Skip checklist items that do not apply; do not pad with praise.
- End with a verdict: **готов к merge** or **нужны правки** (list the blockers).
