# Project Instructions for Claude Code

## Purpose

Real Estate web application. This file is the entry point for project-wide instructions. Read the relevant files under `.claude/rules/` and `docs/` before making substantial changes.

## Stack (confirmed)

- Language: JavaScript (ESM) everywhere, no TypeScript. npm workspaces: `shared/`, `backend/`, `frontend/`, `e2e/`.
- Backend: Node.js + Express 5, Sequelize + MySQL, JWT access token (Bearer header) + refresh token (httpOnly cookie, rotated, stored hashed)
- Frontend: React + Vite, Redux Toolkit + RTK Query (auto-refresh on 401), React Router, react-hook-form
- Validation: Zod. Schemas and error messages live once in `shared/` (`@real-estate/shared`) and are imported by both apps.
- Database: MySQL **8.0.16+ required (target 8.4 LTS; no 5.7 or MariaDB)**, checked at startup, via Sequelize; migrations and seeders are `.cjs` files in `backend/src/migrations` / `backend/src/seeders`
- Tests: Jest (shared, backend with supertest, frontend with React Testing Library + MSW), Playwright (`e2e/`)
- UI source of truth: Figma, read through the Figma MCP, one module at a time

## Commands (from the repo root)

- `npm run dev`: backend (http://localhost:5000) + frontend (http://localhost:5173, proxies `/api`)
- `npm test`: all Jest suites. One workspace: `npm test -w backend`
- `npm run test:e2e`: Playwright (`$env:E2E_WITH_API='false'` for UI only, without MySQL)
- `npm run lint`, `npm run format`, `npm run build`
- `npm run check`: tests, lint, `prettier --check` and build in one go (run before every commit)
- DB: `npm run db:migrate -w backend`, `npm run db:seed -w backend`, `npm run migration:new -w backend -- <name>` (rename the generated file to `.cjs`)

## First actions

1. Check `git status`, then read `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`, `docs/DECISIONS.md`, the relevant `docs/modules/<module>/` folder, and `docs/execution/<module>/` (board, STATUS, open questions; auth: `docs/execution/QUESTIONS.md`).
2. If important requirements are missing or ambiguous, ask focused questions in small batches (or run `/grill-with-docs`). Record answers in the docs.
3. For a new module or substantial change, propose a plan before broad implementation.

## Module workflow

Run `/new-module <name>`. It drives each step in order and stops for approval between steps:

1. Align: `/grill-with-docs`, then write the module spec in `docs/modules/<module>/README.md`
2. Database: `/db-design`, then `/db-design-review`
3. Contract: `/shared-validation` (Zod schemas + messages) and the API contract
4. Tickets: `/to-tickets` (and `/to-spec` if it needs a published spec)
5. Backend: `/express-module`, test-first through `/tdd` and `/jest-testing`
6. Frontend: `/figma-to-module` for each page listed in `docs/modules/<module>/figma.md`
7. E2E: `/playwright-e2e`
8. Review: `/code-review`, `/db-design-review` if the schema changed, then `/security-review`

## Non-negotiables

- One source of truth for validation: never write a Zod schema or user-facing validation message inside `backend/` or `frontend/`; import it from `shared/`. See `.claude/rules/validation.md`.
- Every field gets explicit validation (type, required/optional, length, format, range), and every rule has a message from `shared/`.
- Database changes go through migrations only. Never use `sequelize.sync({ force/alter })` outside throwaway tests.
- UI must match Figma exactly: use Figma variables/tokens and downloaded assets, and verify with a screenshot comparison.

## General rules

- Follow the existing architecture and conventions unless an approved change is needed.
- Prefer small, testable, maintainable changes over broad rewrites.
- Do not invent business rules, API contracts, permissions, or data relationships. Ask, or document a clearly labeled assumption.
- Reuse existing components and utilities; avoid unnecessary dependencies and duplicated logic.
- Keep secrets, credentials, personal data, and environment files out of source control and logs.
- Never run destructive commands, reset shared data, deploy to production, or perform irreversible actions without explicit approval.
- Do not claim a task is complete until relevant tests/checks have been run or the unverified parts are clearly disclosed.
- Update documentation when behavior, interfaces, setup, or architectural decisions change.

## Branches

`feature/<module>` → `testing` → `main`. Claude pushes only feature branches. Merging into `testing`, and later from `testing` into `main`, happens only when the user asks. See `.claude/rules/git-workflow.md`.

## Parallel work

- Before parallelizing, define task boundaries, dependencies, file ownership, interfaces, and acceptance criteria.
- `shared/` (schemas, messages, error codes), migrations, and app bootstrap/routing are shared foundations with a single owner (the `integration-owner` agent).
- Avoid assigning multiple agents to edit the same files at the same time. Use separate branches/worktrees for independent tasks.
- Do not merge work merely because it compiles; review changes and run relevant tests.

## Definition of done

1. Acceptance criteria are met.
2. Jest and Playwright suites relevant to the change pass, plus lint/build where available.
3. Frontend and backend reject the same invalid input with the same message (parity test exists).
4. Security, error handling, and edge cases have been considered.
5. Documentation is updated where needed.
6. Remaining risks, assumptions, failures, and follow-up work are reported.

## Skills and tools available

- Project skills (`.claude/skills/`): `new-module`, `db-design`, `db-design-review`, `shared-validation`, `express-module`, `figma-to-module`, `jest-testing`, `playwright-e2e`
- Matt Pocock skills (copied into `.claude/skills/`, tracked in `skills-lock.json`, update with `npx skills@latest update -p`): `/grill-me`, `/grill-with-docs`, `/tdd`, `/to-spec`, `/to-tickets`, `/implement`, `/implement-spec`, `/triage`, `/wayfinder`, `/chief-of-staff` (long-running goal), `/diagnosing-bugs`, `/improve-codebase-architecture`, `/handoff`, `/ask-matt`, and more. Configured by `/setup-matt-pocock-skills` (see Agent skills below).
- Official plugins: `figma`, `playwright` (browser MCP), `context7` (current library docs), `pr-review-toolkit`, `security-guidance`
- Built in: `/code-review`, `/security-review`, `/simplify`

## Agent skills

### Issue tracker

Local markdown, one folder per module: `docs/execution/<module>/` holds the board (README.md), STATUS.md, and one file per ticket (`tickets/PROP-NNN-<slug>.md`), question, decision and spec, with a prefix per module (PROP, FAC, STAFF). Auth keeps the older `BACKLOG.md` (`TASK-NNN`). See `docs/agents/issue-tracker.md` and `docs/execution/README.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), written as text in specs and BACKLOG rows. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md`, `docs/DECISIONS.md` (the ADRs) and `docs/modules/<module>/`. See `docs/agents/domain.md`.
