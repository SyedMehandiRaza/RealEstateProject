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
- The API now fails fast without `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `backend/.env`, and (TASK-018) without `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT` (465), `SMTP_USER_NAME`, `SMTP_USER_PASSWORD`, `MAIL_FROM` and `VERIFICATION_CODE_SECRET`. The local `.env` has them all (startup checked 2026-10-29). No real email has been sent yet.
- File jobs run inside every API instance; there is no row locking yet (TASK-015).
- The refresh endpoint contract (`POST /api/auth/refresh` returns `{ data: { accessToken, user } }`) is assumed in `frontend/src/services/api/baseApi.js`; confirm it in the auth spec.
- Env templates are named `env.example` (not `.env.example`) because the project's deny rule on `.env.*` files also blocks the example file.
- Dependency majors are recent (Babel 8, Vite 8, React Router 8, Express 5, Zod 4). MSW is pinned to v2 for Jest compatibility (DEC-009).

## Next actions

- Done: TASK-017..045 written (to-tickets, 2026-10-29). TASK-017 backend test harness (2026-10-29): unit/integration Jest projects, `createTestApp()` with fake mailer, storage and clock, `_test` guard, per-test cleanup (DEC-023, ARCHITECTURE.md "Backend tests").
- Done: TASK-018 mailer (2026-10-29, DEC-024): `smtpMailer` (nodemailer, 465, secure) is the `createApp` default; SMTP, `MAIL_FROM` and `VERIFICATION_CODE_SECRET` validated at startup by `parseEnv`.
- Done: TASK-019 sign up + verify email (2026-10-29, DEC-025): POST `/api/auth/sign-up` and `/api/auth/verify-email`; the auth module layout (routes/controller/service/repository wired in `modules/auth/index.js`), the Verification codes module, sessions and the `user` shape; parity cases in `@real-estate/shared/testing`.
- Done: TASK-020 resend verification code (2026-10-29, DEC-026): POST `/api/auth/verify-email/resend`; `verificationCodes.issue` enforces 1 code per 60 s and 5 per hour per purpose and throws `ResendRefusedError` (429 `resendTooSoon(n)` / `resendLimit`); unknown or verified emails get the same 200 `{ sent: true }`; parity cases `resendCodeCases`.
- Done: TASK-021 log in and `/me` (2026-10-29, DEC-027): POST `/api/auth/login` (per-account limiter 10 failed / 15 min / email in memory, dummy-hash compare for unknown emails, every failure 401 `invalidCredentials`; unverified → 403 `EMAIL_NOT_VERIFIED` with a new code within the resend rules) and GET `/api/auth/me`; new shared error code `EMAIL_NOT_VERIFIED`; parity cases `loginCases`.
- Done: TASK-022 refresh and log out (2026-10-29, DEC-028): POST `/api/auth/refresh` rotates the cookie (row locked, old token revoked, current roles in the new access token), 401 with the cookie cleared otherwise; a revoked token is a reuse and revokes every session of the Account (Q-038: logged-out tokens too); POST `/api/auth/logout` 204, cookie cleared. `sessions.revokeAll(userId)` is ready for TASK-024.
- Done: TASK-023 forgot password, resend and verify reset code (2026-10-29, DEC-029): POST `/api/auth/password/forgot` and `/password/resend` (one use case, `password_reset` code within the resend rules, same 200 `{ sent: true }` for unknown emails) and `/password/verify` (200 `{ resetToken }`: 10-min JWT, purpose `password_reset`, HMAC fingerprint of the password hash, keys HKDF-derived from `JWT_ACCESS_SECRET` in `modules/auth/resetToken.js`); parity cases `forgotPasswordCases`.
- Done: TASK-024 reset password (2026-10-29, DEC-030): POST `/api/auth/password/reset` (`resetPasswordSchema`) reads the reset token, locks the Account row, checks the password fingerprint, stores the new bcrypt hash and revokes every refresh token of the Account; 200 `{ message: passwordChanged }`, no session. A refused token (invalid, expired, used, unknown Account) → 401 `UNAUTHORIZED` with `resetToken.required` as `error.message`; a missing one → 422 `fields.resetToken`. Parity cases `resetPasswordCases`.
- Done: TASK-025 select country (2026-10-29, DEC-031): PUT `/api/auth/me/country` (`authenticate`, `authorize('buyer')` before `validate({ body: selectCountrySchema })`) stores `preferred_country_code` and returns 200 `{ user }`; non-Buyer → 403 `FORBIDDEN`, outside AE/SG/US/GB → 422 `fields.countryCode`. Matches the TASK-035 pin (moved to "Already matched"). Parity cases `selectCountryCases`.
- Done: TASK-026 become a developer (2026-10-29, DEC-032): POST `/api/auth/me/roles/developer` (access token, no body) adds the `developer` `user_roles` row under a row lock and returns 201 `{ user }` with no new token; the client calls `/refresh` for an access token with both roles. Already a Developer → 409 `CONFLICT` (unique index, also for concurrent requests); unverified → 403; deleted Account → 401.
- Done: TASK-027 Professional info (2026-10-29, DEC-033): PUT `/api/auth/me/professional-profile` (`authenticate`, `authorize('developer')` before `validate({ body: professionalInfoSchema })`) creates or replaces the one profile under an Account row lock and returns 200 `{ profile }` in the request field names (`companyName` null when left out); non-Developer → 403, Company without name → 422 `fields.companyName`; an Active Developer → 409 `CONFLICT` (Q-033 assumed, option a). Adds the pure Verification status function (`verificationStatus.js`) that TASK-028/030 reuse. Matches the TASK-038 pin. Parity cases `professionalInfoCases`.
- Done: TASK-028 first submission of Verification documents (2026-10-29, DEC-034): POST `/api/auth/me/documents` (Developer, multipart through `multer` memory storage, one part per kind plus `idDocumentType`) checks each file with `documentUploadSchema` and sniffs it, requires every kind with no document yet (2 for an Individual, 3 for a Company; 422 `documents.<kind>.file` "Upload your ..."), refuses a pending/approved kind with 409 `documentAlreadySubmitted`, uploads through `uploadAndSave` with the injected storage, then saves the rows in one transaction (profile row locked, rules re-checked); failures delete or queue every uploaded file. 201 `{ verification }` in the GET shape. Matches the TASK-039 pin. New shared messages (Q-036 wording, assumed) and parity cases `documentUploadCases`. Next: TASK-029 (rejected kinds already pass `checkSubmission`; needs its tests) and TASK-030 (GET reuses `verificationStatus`).
- Next: TASK-044 rechecks the TASK-036 pages against the real reset API; the "Become a developer" UI (TASK-037, blocked by Q-035) must call `/refresh` after the 201 before opening Developer pages. Not blocking: Q-038 (reuse and logout), Q-039 (reset for unverified Accounts), Q-040 (issued access tokens live until expiry after a reset).
- Done: TASK-031 auth UI foundation (tokens, AuthSplitLayout, TextInput, Button, Tabs, OtpInput, auth routes in `frontend/src/modules/auth/routes.jsx`) and TASK-032 onboarding UI kit (Select, FileDropzone, UploadedFileCard, StatusBadge, CountryOption), built in worktrees and cherry-picked (2026-10-29). Figma has no variables: tokens are raw values named by role.
- Done: `.gitattributes` forces LF (worktree checkouts had CRLF and failed Prettier); `.playwright-mcp/` is git- and prettier-ignored.
- In progress: TASK-034 (FE Sign up + Verify) in a worktree, coded against the SPEC-001 contract with MSW.
- Unverified: the migration round trip test (opt-in, `$env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend`) was not run by the agent; the user should run it once.
- Blockers: Q-034 (post-login routing, blocks TASK-041), Q-035 (Become-a-developer link, Agent tab; blocks TASK-037). Not blocking: Q-033, Q-037 (assumptions in force). User to run once: `$env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend` (undo:all was blocked for agents).
- Per ticket: `npm run check` passes, commit with the TASK id, BACKLOG status Done, update this file.
