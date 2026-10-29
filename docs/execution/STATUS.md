# Project Execution Status

## Last updated

2026-10-29

## Current milestone

Goal (2026-10-29, /chief-of-staff): auth module fully built and tested (API, UI from Figma, e2e) per SPEC-001. Branch `feature/auth` (baseline `72a116d` on main), one commit per ticket, never pushed. Tickets TASK-017 to TASK-045 in `BACKLOG.md`. Goal memory: `wiki/index.md`.

## Completed

- Claude Code setup: rules, project skills, Matt Pocock skills (27; his `code-review` skipped so the built-in `/code-review` stays), plugins (figma, playwright, context7, pr-review-toolkit, security-guidance), agents
- Monorepo scaffold (DEC-001, DEC-006 to DEC-009):
  - `shared/`: common schemas (id param, pagination), messages, error codes, `toFieldErrors`
  - `backend/`: Express 5 app (helmet, CORS allow-list, cookie-parser, body limits, pino), validate/authenticate/authorize/errorHandler/notFound/rateLimiter middlewares, JWT + password + cookie utilities, Sequelize connection, sequelize-cli config (`.cjs`), `/api/health`
  - `frontend/`: Vite + React, Redux store, RTK Query base API with refresh-on-401, auth slice, ProtectedRoute, applyServerErrors, Home/NotFound placeholders, token stylesheet
  - `e2e/`: Playwright config (starts frontend and backend), smoke tests
- Auth DB draft (2026-10-28): docs/modules/auth/ (README stub, figma.md with 24 frames, db.md with field inventory, ERD, table specs), migration backend/src/migrations/20261028183255-create-auth-tables.cjs (node --check, prettier and eslint pass; NOT run, MySQL not installed), DEC-010 to DEC-015 (proposed/assumed), Q-007 to Q-029
- Auth DB revision (2026-10-29): scope cut to buyer + developer (DEC-017); documents in Cloudinary (DEC-016, Q-023 resolved); `storage_key` replaced by `cloudinary_public_id` + `cloudinary_resource_type`; new Q-030, Q-031; `/db-design-review` re-run
- Foundations (2026-10-29), TASK-001 to TASK-005:
  - MySQL 8.0.16+ required, checked at startup (DEC-020)
  - one account can be buyer and developer: `user_roles` table, token `roles`, `authorize` and `ProtectedRoute` updated (DEC-019)
  - Cloudinary cleanup (DEC-018): migration `20261029120000-create-pending-file-deletions.cjs`, `backend/src/modules/files/` (upload compensation, deletion worker with retry/backoff, daily orphan job, scheduler started in `server.js`), user deletion service
  - models for users, user_roles, professional_profiles, verification_documents, pending_file_deletions
  - `cloudinary` SDK added; Cloudinary env vars validated in `config/env.js`

- Auth grill (2026-10-29): all auth questions answered (DEC-021, DEC-022), `GLOSSARY.md` created; DB fixes applied to the draft migrations (binary collations, Profile Photo CHECK), `USER_ROLES`/`SIGNUP_ROLES` in `shared/`, `User.scope('withPassword')`, migration/shared ENUM parity test

- Phone changed to a contact field (not unique, not used to log in); login by email only; per-account login limit recorded (DEC-022). Shared auth validation: schemas, messages, limits, enums, tests (TASK-008). Retention cleanup ticket TASK-016

## Checks (2026-10-29)

- Jest: shared 112/112, backend 70/70, frontend 13/13 passed
- ESLint clean, Prettier clean, Vite build OK, `node --check` on both migrations
- Playwright not re-run in this change
- 2026-10-29: local MySQL 8.4.9 on port 3306 (XAMPP's MariaDB is stopped; moved from 3307 on 2026-10-29). Both migrations applied to `real_estate` and `real_estate_test`; on the test DB both were rolled back and re-applied cleanly. The API starts (nodemon), passes the version check and `/api/health` returns 200.
- Not verified: the Sequelize repository and the real Cloudinary adapter (no integration tests against MySQL yet, no call made to Cloudinary).

## Risks and assumptions

- Auth DB draft: 19 of 24 field-inventory rows are ASSUMED (required-ness not shown in Figma). MySQL 8.0.16+ is required (DEC-020). The migrations run on MySQL 8.4.9 (up and down).
- The API now fails fast without `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `backend/.env`, and (TASK-018) without `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT` (465), `SMTP_USER_NAME`, `SMTP_USER_PASSWORD`, `MAIL_FROM` and `VERIFICATION_CODE_SECRET`. The local `.env` has them all (startup checked 2026-10-29). No real email has been sent yet.
- File jobs run inside every API instance; there is no row locking yet (TASK-015).
- The refresh endpoint contract (`POST /api/auth/refresh` returns `{ data: { accessToken, user } }`) is assumed in `frontend/src/services/api/baseApi.js`; confirm it in the auth spec.
- Env templates are named `env.example` (not `.env.example`) because the project's deny rule on `.env.*` files also blocks the example file.
- Dependency majors are recent (Babel 8, Vite 8, React Router 8, Express 5, Zod 4). MSW is pinned to v2 for Jest compatibility (DEC-009).

## Next actions

- 2026-10-30: auth goal complete except TASK-037 (Become a developer link, blocked on design, DEC-039) and TASK-055 (date-gated). Tickets TASK-017 to TASK-054 done; code review, security review and fixes done (TASK-048..054). Final check 2026-10-30: shared 190, backend unit 370, integration 305 (+1 skipped), frontend 276, lint/prettier/build clean; e2e 64/64 (TASK-054 run).
- Unverified: real Gmail send, real Cloudinary upload/delete/list, the migration round trip (`$env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend`), Linux screenshot baselines (only win32 exist).
- Next for the user: designer answers (figma.md Design questions), TASK-037 link design, merge feature/auth into testing when ready (DEC-037).
- Resume point: `wiki/index.md`, then this file and BACKLOG.md.
