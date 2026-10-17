---
name: write-tests
description: Write or update Vitest unit tests for MirrorVote code. Use when adding/changing logic in src/ (utils, hooks, contexts, components) or when asked to cover a file with tests. Args - file path(s) to cover; if omitted, cover files changed vs main.
---

# Writing tests in MirrorVote

## Scope
- Target: `$ARGUMENTS`. If empty, use `git diff --name-only main...HEAD -- src` plus uncommitted changes in `src/`.
- Skip generated/trivial files: `src/integrations/supabase/types.ts`, `src/components/ui/*` (shadcn primitives), pure re-exports.

## Conventions
- Runner: **Vitest**. Import explicitly: `import { describe, it, expect, vi } from 'vitest'` (no globals).
- Location: next to the code — `src/utils/foo.ts` → `src/utils/foo.test.ts`. Shared setup: `src/test/setup.ts`.
- Default environment is `node`. For components/hooks that need DOM, put `// @vitest-environment jsdom` as the first line and use `@testing-library/react` (`render`, `screen`, `renderHook`) + `@testing-library/user-event`. jest-dom matchers (`toBeInTheDocument`) are already registered.
- Imports via `@/` alias work.
- Test names describe behaviour: `it('falls back to plain text when JSON parsing fails')`.
- One scenario per test, Arrange → Act → Assert. Test behaviour, not implementation details.

## Mocking
- Supabase: mock the client module, never hit the network:
  ```ts
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: { from: vi.fn(), rpc: vi.fn(), functions: { invoke: vi.fn() }, storage: { from: vi.fn() } },
  }))
  ```
- Globals (`crypto`, `fetch`, `navigator.onLine`): `vi.stubGlobal(...)` + `vi.unstubAllGlobals()` in `afterEach`.
- Hooks using TanStack Query: wrap in a fresh `QueryClientProvider` with `retry: false` per test.
- Components using `t()`: wrap in `LanguageProvider` from `src/contexts/LanguageContext.tsx`.

## Edge functions
`supabase/functions/*` run on Deno and are not covered by Vitest. If logic there needs a test, extract it into a pure function in `supabase/functions/_shared/` first and say so in the report — don't add Deno tooling without asking.

## Process
1. Read the target code; list behaviours and edge cases (null/empty input, error paths, fallbacks).
2. Write the tests.
3. Run `npx vitest run <test files>`. All must pass.
4. Prove the tests can fail: temporarily break the code under test (or reason clearly why a test would catch the regression), then restore it with `git checkout -- <file>` / undo the edit.
5. Run `npm test` once at the end.
6. If a test reveals a real bug, do **not** silently change the test to match — report it.

## Report
Short list: files added, what each covers, results of `npm test`, any bugs found.
