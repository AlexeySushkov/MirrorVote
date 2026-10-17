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
npm run build
git add <файлы>
git commit -m "feat: краткое описание"

# 3. Опубликовать ветку и открыть PR
git push -u origin feat/my-feature
gh pr create --base main --fill

# 4. Дождаться зелёного CI (build), проверить diff в PR
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

`.github/workflows/ci.yml` на каждый PR в `main` запускает `npm run build` (включая проверку типов `tsc`). PR с красным CI не вливаем.

> Lint пока не настроен: нет `eslint.config.js`, и ESLint 9 без него падает. После добавления конфига — включить шаг `npm run lint` в `ci.yml`.

## Релиз версии

1. В ветке поднять `version` в `package.json` (показывается в приложении через `__APP_VERSION__`) по SemVer: `fix` → patch, `feat` → minor.
2. Добавить запись в changelog в `README.md`.
3. После merge — по желанию тег: `git tag v1.0.6 && git push origin v1.0.6`.

## Supabase

Edge-функции (`supabase/functions/`) и миграции (`supabase/migrations/`) деплоятся вручную, CI их не трогает.
Деплоить только из `main` после merge, чтобы прод-база и функции соответствовали коду в `main`.
После деплоя edge-функций проверить toggle **"Verify JWT with legacy secret"** (см. `CLAUDE.md`).

## Хотфикс

Та же схема, только быстро: `fix/...` от `main` → PR → зелёный CI → merge.
