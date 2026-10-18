# Процесс разработки

Проект работает по **GitHub Flow**: `main` всегда соответствует продакшену, вся работа идёт в коротких ветках через Pull Request.

> ⚠️ Каждый push в `main` автоматически деплоит сайт (`.github/workflows/deploy.yml`). Поэтому напрямую в `main` не коммитим.

## Ветки

- `main` — стабильная ветка = то, что на mirror-vote.ru.
- Для каждой задачи — отдельная ветка от свежего `main`, живёт до merge (в идеале — дни, не недели).

Именование: `<тип>/<краткое-описание>` в kebab-case.

| Тип         | Для чего                              | Пример                         |
|-------------|---------------------------------------|--------------------------------|
| `feat/`     | новая функциональность                | `feat/share-collage`           |
| `fix/`      | исправление бага (в т.ч. хотфикс)     | `fix/offline-error-message`    |
| `ui/`       | визуальные правки                     | `ui/occasion-picker-buttons`   |
| `refactor/` | рефакторинг без изменения поведения   | `refactor/session-hooks`       |
| `docs/`     | документация                          | `docs/branching-workflow`      |
| `chore/`    | зависимости, конфиги, CI              | `chore/update-vite`            |

## Пошагово

```bash
# 1. Начать задачу от актуального main
git switch main
git pull
git switch -c feat/my-feature

# 2. Работать, коммитить небольшими шагами
npm test
npm run build
git add <файлы>
git commit -m "feat: краткое описание"

# 3. Опубликовать ветку и открыть PR
git push -u origin feat/my-feature
gh pr create --base main --fill

# 4. Дождаться зелёного CI (test + build), проверить diff в PR
gh pr checks --watch

# 5. Влить (squash) и удалить ветку — запустится деплой
gh pr merge --squash --delete-branch

# 6. Вернуться на обновлённый main
git switch main
git pull
```

Если `main` ушёл вперёд, пока ветка была открыта: `git fetch origin && git rebase origin/main`, затем `git push --force-with-lease`.

## Коммиты

[Conventional Commits](https://www.conventionalcommits.org/): `<тип>: <описание>` — `feat:`, `fix:`, `ui:`, `refactor:`, `docs:`, `chore:`.
Одна логическая правка — один коммит. При squash merge заголовок PR становится коммитом в `main`, поэтому заголовок PR пишем в том же формате.

## CI

`.github/workflows/ci.yml` на каждый PR в `main` запускает `npm test` (Vitest) и `npm run build` (включая проверку типов `tsc`). PR с красным CI не вливаем.

## Тесты

- Unit-тесты на Vitest лежат рядом с кодом: `src/utils/foo.ts` → `src/utils/foo.test.ts`.
- Новая логика в `src/` — вместе с тестом. Тест должен падать, если сломать код.
- Запуск: `npm test`, один файл — `npx vitest run <путь>`, один тест — `-t "имя"`, watch — `npm run test:watch`.
- Подробные соглашения и моки — `.claude/skills/write-tests/SKILL.md`.

> Lint пока не настроен: нет `eslint.config.js`, и ESLint 9 без него падает. После добавления конфига — включить шаг `npm run lint` в `ci.yml`.

## Релиз версии

Версии считает [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`). Вручную `version` в `package.json` и `CHANGELOG.md` **не трогаем**.

1. Вливаем PR как обычно. Тип в заголовке PR (он становится коммитом при squash) определяет версию по SemVer:

   | Заголовок PR                     | Версия           | Раздел в CHANGELOG |
   |----------------------------------|------------------|--------------------|
   | `feat: ...`                      | minor `1.1.0`    | Новое              |
   | `fix: ...`, `ui: ...`, `perf: ...` | patch `1.0.6`  | Исправления / Интерфейс / Производительность |
   | `feat!: ...` или `BREAKING CHANGE:` в описании | major `2.0.0` | — |
   | `docs:`, `chore:`, `test:`, `refactor:` | без релиза | не попадают |

2. После каждого merge release-please открывает или обновляет PR **`chore: release vX.Y.Z`**: в нём поднята версия в `package.json`/`package-lock.json` и дописан `CHANGELOG.md`.
3. Когда хотим выпустить релиз — вливаем этот PR. Создаются тег `vX.Y.Z` и GitHub Release, деплой запускается как при любом merge в `main`. Номер в приложении (`__APP_VERSION__`) обновится этим деплоем.

Деплой не ждёт релиза: между релизами на проде может быть код новее номера версии.

## Supabase

Edge-функции (`supabase/functions/`) и миграции (`supabase/migrations/`) деплоятся вручную, CI их не трогает.
Деплоить только из `main` после merge, чтобы прод-база и функции соответствовали коду в `main`.
После деплоя edge-функций проверить toggle **"Verify JWT with legacy secret"** (см. `CLAUDE.md`).

## Хотфикс

Та же схема, только быстро: `fix/...` от `main` → PR → зелёный CI → merge.
