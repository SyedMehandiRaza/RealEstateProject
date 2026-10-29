# Real Estate

Monorepo (npm workspaces), JavaScript (ESM):

- `backend/`: Node.js + Express 5, MySQL + Sequelize, JWT access/refresh tokens
- `frontend/`: React + Vite, Redux Toolkit + RTK Query, React Router, react-hook-form
- `shared/`: Zod schemas, validation messages and error codes used by both apps
- `e2e/`: Playwright tests

## Setup

1. Node.js 24 (`.nvmrc`) and a local **MySQL 8.0.16 or newer** (target 8.4 LTS). MySQL 5.7 and MariaDB are not supported; the API exits at startup with a clear error on an older server. XAMPP ships MariaDB: keep XAMPP's MySQL module stopped and run MySQL 8.4 on port 3306.
2. `npm install`
3. `copy backend\env.example backend\.env`, then fill in DB credentials, two long random JWT secrets, the SMTP settings and the Cloudinary credentials.
4. Create the databases `real_estate` and `real_estate_test` in MySQL.
5. `npm run db:migrate -w backend`
6. `npx playwright install chromium` (first time only, for e2e)

## Run

| Task                        | Command                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| Dev (API :5000 + web :5173) | `npm run dev`                                                               |
| All unit/integration tests  | `npm test`                                                                  |
| One workspace               | `npm test -w backend` (or `shared`, `frontend`)                             |
| E2E                         | `npm run test:e2e` (UI only: `$env:E2E_WITH_API='false'; npm run test:e2e`) |
| Lint / format               | `npm run lint` / `npm run format`                                           |
| Build frontend              | `npm run build`                                                             |
| New migration               | `npm run migration:new -w backend -- create-users`, then rename to `.cjs`   |
| Migrate / seed              | `npm run db:migrate -w backend` / `npm run db:seed -w backend`              |

## Claude Code setup

- `CLAUDE.md`: entry point, stack, commands and workflow
- `.claude/rules/`: backend, frontend, database, validation, testing, security, git and planning rules
- `.claude/skills/`: project skills (`/new-module`, `/db-design`, `/db-design-review`, `/shared-validation`, `/express-module`, `/figma-to-module`, `/jest-testing`, `/playwright-e2e`)
- `.claude/skills/` also holds Matt Pocock's skills (`/grill-me`, `/grill-with-docs`, `/tdd`, `/to-spec`, `/to-tickets`, `/implement`, `/chief-of-staff`, ...), pinned in `skills-lock.json`. Update: `npx skills@latest update -p`.
- `.claude/agents/`: architect, developer, integration-owner, qa-reviewer, db-architect, ui-implementer
- `.claude/settings.json`: permissions and project plugins (figma, playwright, context7, pr-review-toolkit, security-guidance)

## Docs

`docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`, `docs/DECISIONS.md`, `docs/database/SCHEMA.md`, `docs/modules/`, `docs/execution/`.
