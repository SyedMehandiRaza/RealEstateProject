# Execution docs

How work is tracked. Rules: [docs/agents/issue-tracker.md](../agents/issue-tracker.md).

## Folder map

```
docs/execution/
  README.md            this file
  _templates/          ticket, question, decision and module README templates
  property/            PROP: board (README.md), STATUS.md, tickets/, questions/, decisions/, specs/
  facility/            FAC: same layout
  staff/               STAFF: same layout
  wiki/                notes shared by every module (gotchas, environment, user preferences)
  BACKLOG.md, QUESTIONS.md, STATUS.md, specs/   auth only (TASK-NNN, Q-NNN), written before this layout
```

## Module prefixes

| Module   | Prefix  | Branch             | Folder (git worktree)               |
| -------- | ------- | ------------------ | ----------------------------------- |
| auth     | (TASK-) | `feature/auth`     | `Desktop\node\Real_Estate`          |
| property | `PROP`  | `feature/property` | `Desktop\node\Real_Estate-property` |
| facility | `FAC`   | `feature/facility` | `Desktop\node\Real_Estate-facility` |
| staff    | `STAFF` | `feature/staff`    | `Desktop\node\Real_Estate-staff`    |

## Working on modules in parallel

Each module has its own folder on disk (a git worktree on its own branch), its own Claude session and its own databases and ports, so the sessions never touch each other's files or data.

| Folder               | Dev web / API | E2E web / API | Databases                                           |
| -------------------- | ------------- | ------------- | --------------------------------------------------- |
| Real_Estate (auth)   | 5173 / 5000   | 5174 / 5100   | `real_estate`, `real_estate_test`                   |
| Real_Estate-property | 5273 / 5010   | 5274 / 5110   | `real_estate_property`, `real_estate_property_test` |
| Real_Estate-facility | 5373 / 5020   | 5374 / 5120   | `real_estate_facility`, `real_estate_facility_test` |
| Real_Estate-staff    | 5473 / 5030   | 5474 / 5130   | `real_estate_staff`, `real_estate_staff_test`       |

- Each folder has its own `backend/.env` (`PORT`, `DB_NAME`, `DB_NAME_TEST`, `CORS_ORIGINS`) and a root `.env.worktree` (`WEB_PORT`, `API_PROXY_TARGET`, `DB_NAME_TEST`, `E2E_WEB_URL`, `E2E_API_URL`). Both are git-ignored. The Vite config, the Playwright config and the backend test setup read `.env.worktree` when it exists; without it the defaults above (auth row) apply.
- Never run `git checkout` of another branch inside a module folder, and never edit files in another module's folder.
- Shared foundations (`shared/` schemas, messages and error codes, `backend/src/routes/index.js`, `backend/src/models/index.js`, `frontend/src/app/`) are edited by every module. Keep those edits small and additive (add lines, don't reorder or reformat), so merging the modules into `testing` one after another stays easy.
- Migrations: each module adds its own files with a timestamp name; never edit another module's or an existing migration.

## Sub-agent worktrees inside a module

If a module session runs tickets in sub-agents with their own worktrees, it names them after the ticket, not a random id. See `.claude/rules/parallel-work.md`, "Git worktrees".
