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
- 2026-10-29: local MySQL 8.4.9 on port 3307 (XAMPP's MariaDB stays on 3306). Both migrations applied to `real_estate` and `real_estate_test`; on the test DB both were rolled back and re-applied cleanly. The API starts (nodemon), passes the version check and `/api/health` returns 200.
- Not verified: the Sequelize repository and the real Cloudinary adapter (no integration tests against MySQL yet, no call made to Cloudinary).

## Risks and assumptions

- Auth DB draft: 19 of 24 field-inventory rows are ASSUMED (required-ness not shown in Figma). MySQL 8.0.16+ is required (DEC-020). The migrations run on MySQL 8.4.9 (up and down).
- The API now fails fast without `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `backend/.env`.
- File jobs run inside every API instance; there is no row locking yet (TASK-015).
- The refresh endpoint contract (`POST /api/auth/refresh` returns `{ data: { accessToken, user } }`) is assumed in `frontend/src/services/api/baseApi.js`; confirm it in the auth spec.
- Env templates are named `env.example` (not `.env.example`) because the project's deny rule on `.env.*` files also blocks the example file.
- Dependency majors are recent (Babel 8, Vite 8, React Router 8, Express 5, Zod 4). MSW is pinned to v2 for Jest compatibility (DEC-009).

## Next actions

- Done: TASK-017..045 written (to-tickets, 2026-10-29). TASK-017 backend test harness (2026-10-29): unit/integration Jest projects, `createTestApp()` with fake mailer, storage and clock, `_test` guard, per-test cleanup (DEC-023, ARCHITECTURE.md "Backend tests").
- Next: TASK-018 mailer (implements the `sendVerificationCode({ to, code, purpose })` interface assumed in DEC-023 and replaces the throwing default in `app.js`), then TASK-019 sign up + verify.
- Unverified: the migration round trip test (opt-in, `$env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend`) was not run by the agent; the user should run it once.
- Blockers: Q-034 (post-login routing, blocks TASK-041), Q-035 (Become-a-developer link, Agent tab; blocks TASK-037). Not blocking: Q-033, Q-037 (assumptions in force). User to run once: `$env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend` (undo:all was blocked for agents).
- Per ticket: `npm run check` passes, commit with the TASK id, BACKLOG status Done, update this file.
