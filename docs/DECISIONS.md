# Architecture and Product Decisions

Use one entry per meaningful decision.

## DEC-001: Monorepo with npm workspaces

- Status: Accepted (implemented 2026-10-28)
- Date: 2026-10-28
- Context: Backend and frontend must share validation code and messages.
- Decision: One repository with workspaces `shared`, `backend`, `frontend`, `e2e`.
- Alternatives considered: Separate repos with a published package (more release overhead); copying schemas (drift risk).
- Consequences/trade-offs: A single install and CI pipeline; `shared` changes affect both apps, so it has a single owner.

## DEC-002: Zod schemas and messages as the single validation source

- Status: Accepted (user requirement: identical error messages on backend and frontend)
- Date: 2026-10-28
- Context: Messages must be identical on both sides.
- Decision: Schemas plus message constants live in `shared/`; the backend validates with them in middleware, and the frontend uses them through `zodResolver`. Parity is enforced by tests at three levels (schema, API, e2e).
- Consequences/trade-offs: No app-local validation messages; DB uniqueness errors are mapped to shared messages.

## DEC-003: MySQL + Sequelize with migrations as the schema source of truth

- Status: Accepted (user requirement)
- Date: 2026-10-28
- Decision: sequelize-cli migrations define the schema; models mirror them; `sync()` is not used on persistent DBs.

## DEC-004: Testing stack

- Status: Accepted (user requirement)
- Date: 2026-10-28
- Decision: Jest for unit and integration tests (supertest for the API, React Testing Library for UI), Playwright for e2e and visual checks.

## DEC-005: Figma as the UI source of truth, implemented per module page

- Status: Accepted (user requirement)
- Date: 2026-10-28
- Decision: Each module lists its Figma pages in `docs/modules/<module>/figma.md`; pages are built with the `figma-to-module` skill through the Figma MCP and verified by screenshot.

## DEC-006: JavaScript (ESM), no TypeScript

- Status: Accepted (user decision, resolves Q-001)
- Date: 2026-10-28
- Decision: All workspaces are `"type": "module"`. sequelize-cli files (config, migrations, seeders, `.sequelizerc`) are CommonJS (`.cjs`). Jest runs through babel-jest.
- Consequences: No compile-time types; Zod schemas and tests carry the contracts.

## DEC-007: Frontend = React + Vite + Redux Toolkit (RTK Query)

- Status: Accepted (user decision, resolves Q-002)
- Date: 2026-10-28
- Decision: Vite dev server proxies `/api` to the backend (same origin, so cookies work). Server data goes through RTK Query (`baseApi.injectEndpoints`); slices hold client state only. React Router for routing, react-hook-form + zodResolver for forms.
- Alternatives considered: axios + thunks (more hand-written code); Next.js (SSR not required yet).

## DEC-008: JWT access + refresh tokens

- Status: Accepted (user decision, resolves Q-003). Details of the auth flow (OTP, verification) to be settled in the auth module grill.
- Date: 2026-10-28
- Decision: Short-lived access token (default 15m) in the JSON response, kept in Redux memory, and sent as `Authorization: Bearer`. Refresh token (default 7d) only in an httpOnly, SameSite=Strict cookie scoped to `/api/auth`, stored server-side as a SHA-256 hash with its `jti`, rotated on every refresh and revoked on logout. The client retries once after a single shared refresh call on 401.
- Alternatives considered: tokens in localStorage (XSS-exposed); server sessions (needs a session store).
- Consequences: The refresh_tokens table is designed with the auth module DB.

## DEC-009: Jest setup for ESM dependencies

- Status: Accepted
- Date: 2026-10-28
- Decision: Frontend Jest uses `jest-fixed-jsdom`, MSW v2, and compiles `node_modules` with babel-jest, plus a small test-only Babel plugin for `import()` / `import.meta` (`frontend/babel.config.cjs`). MSW v3 was tried and could not run under Jest's CommonJS mode.
- Consequences: The first frontend test run is slower (cached afterwards). Revisit if moving to Vitest.

## DEC-010: One `verification_codes` table for email verification and password reset

- Status: Proposed (auth DB draft, 2026-10-28; to confirm in the grill)
- Date: 2026-10-28
- Context: Both flows send a 6-digit code by email (confirmed: same mail flow) and need the same columns (hash, expiry, attempts, used_at, created_at for resend throttling).
- Decision: One table with `purpose ENUM('email_verification','password_reset')`.
- Alternatives considered: one table per purpose (duplicate schema and code, no benefit while the shape is identical).
- Consequences: A new purpose (e.g. email change) is an ENUM migration. Split later if a purpose needs extra columns.

## DEC-011: Auth dropdowns as ENUMs, not lookup tables

- Status: Proposed (auth DB draft)
- Date: 2026-10-28
- Decision: Role, business type, experience level, ID document type, document kind, MIME type and document status are MySQL ENUMs with matching Zod enums in `shared/`; display labels live in `shared/`.
- Alternatives considered: lookup tables (needed only if admins edit the lists at runtime or lists vary per country).
- Consequences: Changing a list needs a migration plus a shared schema change. Revisit for ID document types if they become per-country (Q-019).

## DEC-012: Country stored as ISO 3166-1 alpha-2 code

- Status: Proposed (auth DB draft; Q-015)
- Date: 2026-10-28
- Decision: `users.preferred_country_code CHAR(2)` with a format CHECK; the supported list (AE, SG, US, GB from Figma) is a Zod enum in `shared/`.
- Alternatives considered: ENUM (migration for every new market); `countries` lookup table with FK (better once properties reference countries or markets are admin-managed).
- Consequences: The DB does not restrict the code to supported markets; the API does. Moving to a lookup table later is a compatible migration (same codes as FK values).

## DEC-013: Auth tables use integer ids, no public uuid, no soft delete

- Status: Assumed (auth DB draft; Q-013, Q-014)
- Date: 2026-10-28
- Decision: `INT UNSIGNED` ids (`BIGINT UNSIGNED` for `refresh_tokens` and `verification_codes`), no `uuid` column, no `paranoid`. Account deletion is a hard delete with CASCADE to dependent auth rows.
- Consequences: Ids appear in JWT `sub` and possibly URLs; authorization must not depend on ids being secret. Add `uuid` or `deleted_at` by migration if the grill requires them.

## DEC-014: Professional account review status is derived from document rows

- Status: Proposed (auth DB draft; Q-029)
- Date: 2026-10-28
- Context: Figma shows a status badge and a reject reason per document, plus an account headline (Under Review / Active / Unsuccessful).
- Decision: Store status, reason, reviewer and review time per `verification_documents` row; derive the account headline from the latest row per required document kind. No account-level status column.
- Alternatives considered: an account-level status on `professional_profiles` (denormalized; can drift from document statuses).
- Consequences: The admin queue and status screens query documents; add a stored status only if review becomes account-level.

## DEC-015: Verification codes stored as HMAC-SHA256

- Status: Proposed (auth DB draft; Q-009)
- Date: 2026-10-28
- Context: Confirmed requirement: codes stored hashed. A 6-digit code has 10^6 values, so an unkeyed SHA-256 is reversed instantly from a DB leak.
- Decision: `code_hash CHAR(64)` = HMAC-SHA256(code, server secret from env). Online guessing is limited by `attempts`.
- Alternatives considered: bcrypt per code (slower, also fine; would need `CHAR(60)`).

## DEC-016: Verification documents stored in Cloudinary as authenticated assets

- Status: Accepted (storage choice confirmed by the user, 2026-10-29); the column layout is part of the auth DB draft
- Date: 2026-10-29
- Context: Developers upload a government ID, a company registration certificate and a profile photo (PDF/JPG/PNG, max 10 MB). These files are highly sensitive.
- Decision: The backend uploads to Cloudinary with `type: 'authenticated'`, using a server-generated `public_id`; PDFs as `resource_type: 'raw'`, images as `'image'`. The DB stores `cloudinary_public_id` and `cloudinary_resource_type` only, with no URL. Readers get short-lived signed URLs from the backend. Credentials are env vars only (names: Q-030).
- Alternatives considered: storing `secure_url` (a stored URL can leak, and authenticated assets need signing anyway); public uploads (rejected: ID documents must never be public); direct browser uploads with a signed preset (possible later, but the server must still validate type and size).
- Consequences: The MySQL CASCADE does not reach Cloudinary, so account deletion and retention cleanup must call `destroy`. Cloudinary is a third-party processor of personal data.

## DEC-017: Auth scope is buyer and developer; agent deferred

- Status: Accepted (user, 2026-10-29)
- Date: 2026-10-29
- Decision: Build sign-up, verification, login and onboarding for buyers and developers (developer = property owner). `users.role` is ENUM('buyer','developer','admin') and `professional_profiles.business_type` is ENUM('individual','company'). The agent frames in Figma stay in `figma.md` with status `deferred`.
- Consequences: Adding agents later is a new migration that appends `'agent'` and `'agency'` to those ENUMs (a metadata-only change on MySQL 8 when appended at the end), plus a per-role Zod enum for the business type (Q-017).

## DEC-018: Cloudinary file cleanup through an outbox table

- Status: Accepted (user, 2026-10-29)
- Date: 2026-10-29
- Context: DB rows and Cloudinary files can drift: an upload whose DB save fails, records deleted while their files stay, or files left by crashes.
- Decision: (1) Upload, then save; if the save fails, delete the file immediately, and if that fails, queue it. (2) Deleting a user or property queues each file's public id in `pending_file_deletions` inside the same transaction; after commit a worker deletes them with retry and exponential backoff (max 5 attempts, then `status = 'failed'` for review). Cloudinary is never called inside a DB transaction. (3) A daily job lists files under `realestate/<env>/` and queues any that no DB row references and that are older than 24 hours. Every deletion is logged. (4) All uploads go under that prefix.
- Additions to the requested columns: `resource_type` and `delivery_type` (Cloudinary needs both to delete), `reason`, `status` (the review flag), `next_attempt_at` (backoff) and `updated_at`.
- Alternatives considered: deleting from Cloudinary inside the transaction (a rollback cannot undo a deleted file); deleting after commit without a queue (a crash loses the deletion).
- Consequences: Files can outlive their rows for a few minutes (worker) or about a day (orphans). `failed` rows need a person to look at them. Each new module that stores files must add its table to the orphan job's reference lookup.

## DEC-019: One account can hold several roles (user_roles table)

- Status: Accepted (user answer to Q-031, 2026-10-29)
- Date: 2026-10-29
- Decision: The same person can be a buyer and a developer with the same email. Roles move from `users.role` to `user_roles` (user_id, role) with a unique pair. Email stays unique on `users`, so it is one account with one password and one email verification. The access token carries `roles` (a list); `authorize(...roles)` passes when the user holds any listed role, and the frontend `ProtectedRoute` does the same.
- Alternatives considered: one account per (email, role) with `UNIQUE(email, role)` (rejected: the Login screen has no role picker, so an email and password would be ambiguous); a MySQL `SET` column (harder to index and extend).
- Consequences: How an existing buyer adds the developer role is open (Q-032).

## DEC-020: MySQL 8.0.16 or newer is required

- Status: Accepted (user answer to Q-004, 2026-10-29)
- Date: 2026-10-29
- Decision: Support MySQL 8.0.16+ only, targeting 8.4 LTS. No 5.7 and no MariaDB. `server.js` checks the server version after connecting and exits with a clear error on an older server.
- Consequences: Migrations may rely on enforced CHECK constraints, `REGEXP_LIKE` and instant ENUM appends.

## DEC-021: Auth behaviour rules (grill round 1)

- Status: Accepted (user, 2026-10-29: "yes" to all round-1 recommendations)
- Date: 2026-10-29
- Principle: auth works exactly as the Figma screens show; rules Figma does not show are listed here.
- Verification codes: 6 digits, valid 10 minutes, dead after 5 wrong tries. Resend link as in Figma with no countdown; the server allows one resend per 60 seconds and 5 codes per hour per purpose, answers too-early clicks with "Please wait N seconds", and a new code cancels the previous one. Codes are stored as HMAC-SHA256 with `VERIFICATION_CODE_SECRET`.
- Accounts: one account per email, stored lowercase and matched case-insensitively. An unverified user who logs in with the right password gets a new code and the Verify screen; nothing else is reachable until the email is verified. Password 8-72 characters with at least one letter and one digit; Confirm Password must match; full name 2-100 characters after trimming.
- Password reset: Forgot Password → Verify → Reset. An accepted code unlocks Reset for 10 minutes. A successful reset revokes every session and sends the user to Log in with a "Password changed" message.
- Buyer to developer: Sign Up with an existing email answers "This email is already registered. Log in instead." A logged-in buyer starts developer onboarding from a "Become a developer" link (a UI addition not in Figma).
- Social login: Google and Apple are deferred; their buttons stay hidden until built.
- Admins: created only by seed or command, never by sign-up. Admin review screens are a separate, later module.
- Developer onboarding: every Professional info field is required except Company Name, which becomes required when Type of Developer = Company. License / Registration Number is free text (1-50 characters), not unique. Location is free text (2-150). Experience Level is in years; "10+" means more than 10. One ID document list (Driving License, Passport, PAN Card) for all countries.
- Documents: Government ID (with its type) and Profile Photo are always required; the Company Registration Certificate only when Type = Company. Profile Photo accepts JPG/PNG; Government ID and certificate accept PDF/JPG/PNG; 10 MB max. Resubmission re-uploads only the rejected documents; earlier uploads stay as history.
- Country: only buyers choose one, as in Figma, and can change it later.
- Deletion: no self-service account deletion in v1; an admin-only hard delete cascades and queues the user's files (DEC-018). No soft delete, no public uuid (DEC-013 accepted).
- Consequences: Figma copy fixes needed (Profile Photo formats; Forgot Password text pending Q-028). Schema follow-ups after the grill: a CHECK limiting profile_photo to JPG/PNG; Company-dependent rules stay in Zod and the service.

## DEC-022: Auth behaviour rules (grill round 2)

- Status: Accepted (user, 2026-10-29: "yes for now" to all round-2 recommendations)
- Date: 2026-10-29
- Phone (changed by the user the same day): a **contact field only**. Required at sign up, typed in international format such as `+971 50 123 4567` (Figma has no country-code picker), **not unique**, **not a login identifier**, never verified, no SMS. Login is by **email only**; forgot password is by email only. Figma copy to fix: the Log in field "Email/ Phone number" becomes "Email", and Forgot Password's "email address or phone number" becomes "email address".
- Rejection reason: free text per document, 3-500 characters, shown to the developer as written.
- While under review: a developer with pending or rejected documents can log in but sees only the status screens (Pending, or Reject then Resubmit Documents). Developer features unlock when every required document is approved. Buyer features of the same account keep working. The headline comes from the latest upload of each required document: any rejected means "Verification Unsuccessful", all approved means "Your Account is Active!", otherwise "Under Review" (DEC-014 accepted).
- Status screens list every document required for that developer (2 for Individual, 3 for Company), each with its badge. Figma shows only two documents; raise with design.
- "View plan" on the Approved screen opens a "Plans coming soon" placeholder until a plans module exists.
- Wrong passwords: no account lockout. Two limits: the existing per-IP auth limiter, plus a **per-account limit of 10 failed attempts per 15 minutes per email**, kept in memory (no schema change; resets on restart and is per API instance). The error is always "Invalid email or password", also when the limit is hit for an unknown email, so it never reveals which accounts exist.
- Retention (for now; legal requirements in UAE, SG, US and UK not checked): rejected or replaced document files deleted 30 days after the decision; approved documents kept while the account exists; expired or revoked sessions purged after 30 days; verification codes 24 hours after expiry; `failed` file deletions removed 30 days after review.
- Tickets (Q-006, confirmed 2026-10-29 by `/setup-matt-pocock-skills`): local markdown. Tickets stay in `docs/execution/BACKLOG.md` and specs in `docs/execution/specs/`, even though the repo has a GitHub remote. Default triage labels. Conventions in `docs/agents/`.
- DB fixes applied the same day (draft migrations, not run): binary collations on hashes, UUIDs and Cloudinary ids; `USER_ROLES` moved to `shared/`; `User.scope('withPassword')`; CHECK that Profile Photo is JPG/PNG.

## DEC-023: Backend test harness (TASK-017)

- Status: Accepted (implementing agent, 2026-10-29; reversible)
- Context: SPEC-001 tests drive the API over HTTP against `real_estate_test` with fake mailer, storage and clock. Unit suites must stay DB-free and fast.
- Decision: two Jest projects, `unit` (`*.test.js`, parallel) and `integration` (`*.int.test.js`, `--runInBand`); `npm test -w backend` runs both. The integration project migrates once with the real `sequelize-cli` (global setup) and deletes every row of every table before each test, with no per-file code. Three guards refuse a database whose name does not end in `_test`: worker setup, global setup, and the cleanup itself. `createApp({ mailer, storage, clock })` takes production defaults and rejects unknown names or missing methods. Rate limiters live in module-level stores that a shared `beforeEach` resets.
- Mailer interface: `sendVerificationCode({ to, code, purpose })`, confirmed and implemented by TASK-018 (DEC-024).
- The migration round trip (down to zero, then up) is opt-in (`TEST_MIGRATION_ROUNDTRIP=true`), because it drops every table of the test DB and the agent's tooling does not allow it unattended. The default suite checks that every migration is applied and has `up`/`down`.
- Alternatives rejected: per-test transactions rolled back (they don't cover code that opens its own transactions, such as user deletion); TRUNCATE (slower than DELETE on near-empty InnoDB tables); an in-process migrator (it would duplicate sequelize-cli).

## DEC-024: Mailer over nodemailer (TASK-018)

- Status: Accepted (implementing agent, 2026-10-29; reversible)
- Context: SPEC-001 needs one method that emails a 6-digit Verification code for a purpose (`email_verification`, `password_reset`) over Gmail SMTP, port 465, `secure: true`, with credentials from env only and nothing logged.
- Decision: `backend/src/modules/mail/smtp.mailer.js`. `createMailer({ transport, from })` returns `{ sendVerificationCode({ to, code, purpose }) }`; `smtpMailer` (the `createApp` default) wraps it with a nodemailer SMTP transport built by `smtpTransportOptions(env)` (port 465, `secure: true`, nodemailer `logger`/`debug` off). It rejects an unknown purpose, a code that is not 6 digits, and a recipient that is not one plain address (no lists, no line breaks). A transport failure is rethrown as `Failed to send the verification code email` with only nodemailer's `code` and `responseCode` (no original message or `cause`, which can echo the address or login), so callers may log it (Q-037). Under `NODE_ENV=test` the default `smtpMailer` refuses to send, so a test that forgets to inject a fake fails instead of emailing.
- Env: `config/env.js` now exports `parseEnv(source)` and validates `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT` (must be 465), `SMTP_USER_NAME`, `SMTP_USER_PASSWORD`, `MAIL_FROM` (an address or `Name <address>`) and `VERIFICATION_CODE_SECRET` (32+ characters, different from both JWT secrets, as `env.example` already asked). Errors name the variable and the rule, never the value. No defaults, so a missing value stops startup.
- Dependency: `nodemailer` (^10.3.0, MIT-0, no runtime dependencies). No installed package sends SMTP mail; writing an SMTP/TLS client by hand would be riskier.
- Assumptions (low impact, wording only): plain English subject and body per purpose, text plus minimal HTML, no expiry time in the email (TASK-019 owns the 10 minute rule and may add it). The purpose list lives as the template keys in the mailer and a unit test keeps it equal to the `verification_codes.purpose` ENUM; TASK-019 may move it to `shared/` with the integration owner.
- Alternatives rejected: SMTP on 587 with STARTTLS (the decision is 465 secure); a mail API provider (not requested, adds an account and a secret).

## DEC-025: Auth module layout, Verification codes and shared parity cases (TASK-019)

- Status: Accepted (implementing agent, 2026-10-29; reversible). TASK-020 to TASK-030 follow this layout.
- Context: TASK-019 is the first auth endpoint and the first module to use `createApp`'s dependencies; SPEC-001 asks for a thin route layer over deep auth and Verification codes modules, and for parity tests that replay the shared schema tests' invalid payloads.
- Decision (layout): `backend/src/modules/auth/` holds `auth.routes.js` (limiter, `validate`, controller), `auth.controller.js` (HTTP only; sets the refresh cookie), `auth.service.js` (use cases, transactions, mail after commit), `auth.repository.js` (Account queries, roles in the same query), `auth.presenter.js` (`toUserResponse`, the `user` shape), `session.service.js` (`start`: access token plus a refresh token stored by hash; TASK-022 adds rotation) and `verificationCode.service.js`. `index.js` wires them from `{ mailer, clock }`; `routes/index.js` mounts it with one line. Services are factories taking their collaborators, as in the files module.
- Decision (Verification codes): `issue({ userId, purpose }, { transaction })` returns the clear code for the mailer and stores `HMAC-SHA256(code, VERIFICATION_CODE_SECRET)`; `check({ userId, purpose, code }, { transaction })` locks the newest row of the Account and purpose (`created_at DESC, id DESC`) and returns `valid`, `invalid` or `tooManyAttempts`, recording a wrong guess. The caller commits even on failure and throws after the commit. Times come from the injected clock in whole seconds, and `created_at` is set from it, so the 10-minute expiry and "newest" follow the test clock. TASK-020 adds the resend rules inside `issue`.
- Decision (parity): the invalid inputs of each schema move from inline tables in `shared/` tests to `shared/src/testing/`, exported as `@real-estate/shared/testing` (a second package `exports` entry, not part of the main entry). The shared schema test and the backend parity test replay the same rows; the frontend can import them too.
- Assumptions: an unknown email on verify-email answers `codeInvalid` (no Account enumeration); a code is checked only for the purpose of its route; a failed send is logged with the Account id and purpose only (Q-037). `developerVerificationStatus` is `null` until TASK-030.
- Alternatives rejected: retyping the invalid payloads in backend tests (they drift from the shared rules); `check` throwing the HTTP error itself (the attempt count would roll back with the transaction).
