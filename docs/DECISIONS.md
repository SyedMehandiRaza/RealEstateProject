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
- Assumptions: an unknown email on verify-email answers `codeInvalid` (no Account enumeration); a code is checked only for the purpose of its route; a failed send is logged with the Account id and purpose only (Q-037). `developerVerificationStatus` is `null` until TASK-030 (filled since TASK-030, DEC-035).
- Alternatives rejected: retyping the invalid payloads in backend tests (they drift from the shared rules); `check` throwing the HTTP error itself (the attempt count would roll back with the transaction).

## DEC-026: Resend rules inside Verification codes `issue` (TASK-020)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies DEC-021's resend rules as DEC-025 planned.
- Decision: `verificationCodes.issue` refuses a new code for an Account and purpose when 5 codes were created in the last rolling hour (`created_at > now - 1 h`, so a code stops counting exactly 60:00 after it was issued) or the newest is less than 60 s old. It throws `ResendRefusedError` (an `AppError` with `TOO_MANY_REQUESTS`, 429) carrying `resendLimit` or `resendTooSoon(n)`, `n` = whole seconds left, rounded up (1 at 59 s, 60 right after the previous code). The hourly cap is checked first. The first code (sign-up) counts toward both rules. A new code cancels older ones through the existing newest-only rule in `check`; no rows are updated.
- Concurrency: the caller locks the Account row (`repository.lockUserByEmail`, `SELECT ... FOR UPDATE`) in the same transaction before `issue`, so two resends for one Account cannot both pass the cooldown.
- POST `/api/auth/verify-email/resend` answers 200 `{ sent: true }` for unknown and already-verified emails without a code or email (Q-037 applies to a failed send). A refused resend is a 429 with no `fields`.
- For TASK-021 (unverified login) and TASK-023 (password resend/forgot): call `issue` and catch `ResendRefusedError` where the rules should only skip the email instead of failing the request.
- Known trade-off: a 429 tells the caller the email has an unverified Account (accepted by SPEC-001's contract).
- Alternatives rejected: `issue` returning a status value (every caller, including sign-up, would need to branch; nothing is written on refusal, so throwing is safe, unlike `check`); invalidating older codes with an UPDATE (newest-only already does it).

## DEC-027: Log in, the login attempt limiter and EMAIL_NOT_VERIFIED (TASK-021)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's login flow order and DEC-022's per-account limit.
- Decision (limiter): `modules/auth/loginAttemptLimiter.js`, one instance per app built from the injected clock. `tryAttempt(email)` refuses when the email has 10 failures in the rolling 15 minutes (a failure stops counting exactly 15:00 after it); otherwise it counts the attempt as a failure at once, and `succeeded(email)` clears the count when the password is right. Counting before the bcrypt compare means parallel guesses cannot slip past the limit; a request that dies on an unexpected error also counts. Refused attempts are not counted, so a block ends 15 minutes after the 10th failure. Since TASK-050 (DEC-039, Q-040) a successful password reset also clears the email's count (`clear(email)`). Emails whose failures all expired are swept at most once per window, so memory holds only recently failing emails. Tests reset every instance with `resetLoginAttemptLimiters()` in `test/setupAfterEnv.js`, next to `resetRateLimiters()`. No `createApp` dependency was added: a fresh app gets a fresh limiter.
- Decision (flow): limit check → `User.scope('withPassword')` with roles in one query → bcrypt compare (against `DUMMY_PASSWORD_HASH`, cost 12, for unknown emails) → count the failure or clear it → unverified: lock the Account row, `verificationCodes.issue`, catch `ResendRefusedError` (no email inside the cooldown or past the hourly cap), mail after commit (Q-037 on failure), answer 403 `EMAIL_NOT_VERIFIED` → otherwise start a session. A hit limit is refused before any query or compare. Every failure is 401 `UNAUTHORIZED` with `invalidCredentials`.
- Decision (shared): `ERROR_CODES.EMAIL_NOT_VERIFIED` = 403 with `authMessages.api.emailNotVerified` ("... We have sent you a new code"); the same message is shown when the resend rules skipped the email, since the previous code still works. `loginCases` join `@real-estate/shared/testing`.
- Decision (`/me`): GET `/api/auth/me` with `authenticate`, no per-IP limiter (not a public route); an Account deleted since the token was issued gets 401 `UNAUTHORIZED`.
- Known trade-offs: the count is per API instance and lost on restart (DEC-022); a correct password on an unverified email reveals the Account exists (only to someone who knows the password).
- Alternatives rejected: counting after the compare (race between parallel guesses); a lazily computed dummy hash (the first unknown-email login would be slower); adding the limiter to `createApp`'s dependencies (a bootstrap change with no test that needs it).

## DEC-028: Refresh token rotation, reuse detection and logout (TASK-022)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies DEC-008 and SPEC-001's `/refresh` and `/logout` rows.
- Decision (rotation): `session.service.js` adds `consume(token, { transaction })`, `end(token)` and `revokeAll(userId)`. `consume` verifies the JWT against the injected clock (`verifyRefreshToken(token, { now })`), finds the row by `token_hash` with `SELECT ... FOR UPDATE`, checks `sub` and `jti`, then: revoked → revoke every active token of the Account and report a reuse; `expires_at <= now` → invalid; otherwise revoke it. `authService.refresh` runs `consume`, loads the Account with its roles in one query and `sessions.start`s the next session in the same transaction; any outcome but valid commits first and then answers 401 `UNAUTHORIZED` (so the reuse revocation is kept). The response stays the frontend contract: 200 `{ accessToken, user }` plus the rotated cookie; the new access token carries the Account's current roles (TASK-026 relies on this).
- Decision (cookie): a 401 from `/refresh` also clears the `refresh_token` cookie; other errors (such as the DB being down) keep it. Anything but a non-empty string cookie (cookie-parser turns `j:` cookies into objects) counts as no token.
- Decision (logout): POST `/api/auth/logout` revokes the presented token if it is a known active one, always clears the cookie and answers 204 with no body, with or without a cookie. It never triggers reuse detection (Q-038).
- Decision (tabs, TASK-046): the frontend runs every refresh inside `navigator.locks.request('auth-refresh', ...)` when the Web Locks API exists, so tabs of one origin never refresh at the same moment. A tab that waited still calls `/refresh`: the cookie jar is shared, so its request carries the cookie the previous tab just received (one extra rotation, no reuse). No token is passed between tabs. Without the API (old browsers, jsdom) the in-tab sharing remains and two tabs can still collide.
- Decision (when the client refreshes, TASK-049): a 401 triggers the refresh only when the request carried an access token (the `Authorization` header on `result.meta.request`) and was not POST `/auth/refresh` itself. This replaced a list of public auth paths that every new public route had to join. A logged-in user calling a public route (rare: the pages are for logged-out users) would send the header, and its 401 would cost one refresh and one retry, with the same 401 as the answer. At app start `restoreSession` runs one refresh through the same `refreshAccessToken` (in-tab sharing and the lock apply); protected routes wait for it, public pages do not, a failure logs out silently, and a login that finished meanwhile is kept.
- Decision (limits): `/refresh` and `/logout` are not behind a per-IP limiter (the public routes have one per route group since TASK-050, DEC-039); every page load refreshes. A forged token is refused by the signature check before any query.
- Assumption (Q-038), superseded by DEC-039 (TASK-050): any revoked token presented to `/refresh` is a reuse, since the table cannot tell rotated, logged-out and reset-revoked tokens apart without a migration. Now: a token whose `revoked_at` is less than 30 s before now (injected clock, `REUSE_GRACE_MS` in `session.service.js`) answers 401 and clears the cookie but revokes nothing else (`SESSION_CHECK.recentlyRevoked`); at 30 s or later it is still a reuse that revokes every session. This applies to rotated, logged-out and reset-revoked tokens alike. `revoked_at` has no fractions and is stored rounded down, so the effective window is 29 to 30 s.
- Alternatives rejected: a `replaced_by` or `revoked_reason` column (schema change not allowed for this ticket); deleting rows on logout (db.md says logout sets `revoked_at`); `TOKEN_EXPIRED` for an expired refresh token (SPEC-001 says 401 `UNAUTHORIZED`; the client only checks for a token).

## DEC-029: Password reset codes and the reset token (TASK-023)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's `/password/forgot`, `/password/resend` and `/password/verify` rows and its "Reset permission".
- Decision (codes): POST `/password/forgot` (`forgotPasswordSchema`) and POST `/password/resend` (`resendCodeSchema`) are one use case, `authService.requestPasswordReset`: lock the Account row, `verificationCodes.issue` a `password_reset` code within the resend rules (429 `resendTooSoon(n)` / `resendLimit`, counted per purpose, so the sign-up code does not slow it), mail it after commit, answer 200 `{ sent: true }`. Unknown emails get the same body and no email. It shares the private `resendCode` helper with `resendVerification`. A failed send answers as on success (Q-037).
- Decision (verify): POST `/password/verify` (`verifyCodeSchema`) checks the newest `password_reset` code with `verificationCodes.check` (wrong, expired, used, older or unknown email → 422 `codeInvalid`; from the 5th wrong guess → `codeTooManyAttempts`) and returns 200 `{ resetToken }`. No session starts and the email is not marked verified. An `email_verification` code is not accepted, nor the reverse.
- Decision (token): `modules/auth/resetToken.js`, `createResetTokens({ parentSecret, clock })` with `issue({ userId, passwordHash })`, `read(token)` → `{ userId, fingerprint }` or null, and `matchesPassword(claims, passwordHash)` (constant time) for TASK-024. An HS256 JWT: `purpose: 'password_reset'`, `sub` the Account id, `iat` from the injected clock, `exp` 10 min later (valid at 9:59, refused at 10:00). `pwd` is an HMAC-SHA256 fingerprint of the current bcrypt hash, never the hash. Signing and fingerprint keys are derived from `JWT_ACCESS_SECRET` with HKDF (distinct `info` strings), so no new env var, and a reset token never passes `verifyAccessToken` (and an access token never passes `read`).
- Assumption (Q-039): an Account that never verified its email also gets a reset code; otherwise it could never recover a forgotten password (login needs the right password before it re-sends a verification code). Verifying a reset code does not verify the email.
- Known trade-off (from SPEC-001, not changed): forgot/resend answer 429 for a known email inside the cooldown, while an unknown email always gets 200, so repeated requests can tell a registered email apart. Same as verify-email resend (TASK-020).
- Alternatives rejected: a new `RESET_TOKEN_SECRET` env var (touches env.js, env.example and every environment for no security gain over HKDF); signing with `JWT_ACCESS_SECRET` directly (a reset token would then be a 10-minute access token at `authenticate`); a reset-token table or column (no schema change allowed).

## DEC-030: Reset password (TASK-024)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's `/password/reset` row and its "Reset permission".
- Decision (flow): POST `/password/reset` (`resetPasswordSchema`, per-IP limiter) runs `authService.resetPassword`: `resetTokens.read` (signature, purpose, 10-min expiry by the injected clock), bcrypt-hash the new password outside the transaction, then in one transaction lock the Account row with its hash (`repository.lockUserWithPasswordById`, `User.scope('withPassword')` + `FOR UPDATE`), check `resetTokens.matchesPassword`, store the new hash and `sessions.revokeAll(userId)`. 200 `{ message: authMessages.api.passwordChanged }`, no cookie and no session: the client goes to Log in.
- Decision (refusal): an invalid, expired or used token, one signed for another purpose or key, and one for an Account that no longer exists all answer 401 `UNAUTHORIZED` with `error.message = authMessages.resetToken.required` and no `fields` (SPEC-001). A missing or empty `resetToken` fails validation first: 422 with `fields.resetToken = [resetToken.required]`. The frontend (TASK-036) handles both the same way.
- Decision (single use): the row lock makes two concurrent resets with one token run in turn; the second sees the new hash and gets 401. A reset to the same password as before is allowed (no rule forbids it), and it still kills the token, because bcrypt salts every hash.
- Assumption (Q-040): access tokens already issued are stateless and stay valid until they expire (`JWT_ACCESS_EXPIRES_IN`, 15 min by default); only refresh tokens are revoked. The per-account login limiter is not cleared by a reset (superseded by DEC-039, TASK-050: a successful reset now clears the email's failed-login count after the commit; a refused reset leaves it).
- Alternatives rejected: hashing inside the transaction (holds the row lock for about 0.3 s of bcrypt); a `fields.resetToken` 422 for a refused token (SPEC-001 says 401); starting a session on success (SPEC-001 and the Figma flow return to Log in).

## DEC-031: Select country (TASK-025)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's PUT `/me/country` row and the TASK-035 frontend pin.
- Decision (route): PUT `/api/auth/me/country` runs `authenticate`, `authorize('buyer')`, then `validate({ body: selectCountrySchema })`, then `authService.selectCountry`, which loads the Account with its roles, sets `preferred_country_code` and returns 200 `{ user }` (the same `user` shape as `/me`). No per-IP limiter (signed-in route, like `/me`). Any later call replaces the country.
- Decision (authorization): the Buyer check uses the roles in the access token. Roles are only ever added (TASK-026), never removed, so a token that says Buyer is never stale in a way that matters; an Account that gains the Buyer role later needs a refreshed token. `authorize` runs before `validate`, so a non-Buyer gets 403 `FORBIDDEN` whatever it sends, and a Buyer gets 422 `fields.countryCode = [countryCode.invalid]` outside AE/SG/US/GB. An Account deleted since its token was issued → 401 `UNAUTHORIZED`.
- Decision (parity): `selectCountryCases` join `@real-estate/shared/testing`; the backend parity test sends them with a signed Buyer access token for an Account that need not exist (validation answers before any query).
- Alternatives rejected: checking the role in the service from the database (one more rule site; validation would then answer before the 403); a dedicated repository update returning affected rows (mysql2's affected-row count for an unchanged value is driver-flag dependent).

## DEC-032: Become a developer (TASK-026)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's POST `/me/roles/developer` row and DEC-021 ("Become a developer" for a logged-in Buyer).
- Decision (response): 201 `{ user }` with `roles` now including `developer`, and **no new access token and no cookie change**. SPEC-001 says "the client then uses a fresh access token": the client calls POST `/refresh`, which already puts the Account's current roles into the next access token (DEC-028). Until then the old token still works for Buyer routes and is refused by Developer-only routes (403).
- Decision (rules): `authenticate` only, no body, no per-IP limiter. `authService.becomeDeveloper` locks the Account row (`repository.lockUserById`), answers 401 `UNAUTHORIZED` if it was deleted and 403 `FORBIDDEN` if its email is not verified (no session should exist for such an Account), then `repository.addRole(userId, 'developer')`. The unique index `uq_user_roles_user_id_role` makes "already a Developer" (including an Account that signed up as one, and the loser of two concurrent requests) a 409 `CONFLICT` with the default message. The check is against the database, not the token, because the token's roles may predate the change. No Buyer role is required: any verified Account without the Developer role qualifies. No professional profile or document rows are created.
- Alternatives rejected: returning a new access token (or a full session) in the response (a second way to mint tokens next to `/refresh`, and SPEC-001's row returns `{ user }` only); a dedicated shared message for "already a Developer" (SPEC-001 names only the code; the default `CONFLICT` message is used until the UI needs one).

## DEC-033: Professional info and the Verification status function (TASK-027)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's PUT `/me/professional-profile` row and the TASK-038 frontend pin.
- Decision (route): PUT `/api/auth/me/professional-profile` runs `authenticate`, `authorize('developer')` (roles from the access token, as DEC-031), then `validate({ body: professionalInfoSchema })`, then `onboardingService.saveProfessionalProfile`. No per-IP limiter (signed-in route). 200 `{ profile }` with the request field names: `{ id, companyName, developerType, licenseNumber, experienceLevel, location }`, `companyName` null when not given (the schema turns an empty or blank one into "not given").
- Decision (create or replace): in one transaction the Account row is locked (`repository.lockUserById`; gone → 401), then the profile is created or updated in place (same id), so `uq_professional_profiles_user_id` is never hit by two concurrent PUTs. Document rows are untouched, also when the Type of Developer changes (the required kinds follow the current type).
- Decision (layout): Developer onboarding lives in the auth module as `onboarding.service.js` (Professional info; TASK-028 adds documents) and `onboarding.repository.js`, wired in `modules/auth/index.js` next to the auth service, rather than growing `auth.service.js`. `auth.presenter.js` adds `toProfileResponse`.
- Decision (Verification status): `verificationStatus.js` is the pure function SPEC-001 describes, built here because TASK-027 needs "Active": `requiredDocumentKinds(developerType)`, `latestDocumentByKind(rows)` (newest `created_at`, then highest id) and `verificationStatus({ developerType, documents })` → `{ status: 'under_review' | 'active' | 'unsuccessful', documents: [{ documentKind, status, rejectionReason, fileName, sizeBytes }] }`, one entry per required kind in `DOCUMENT_KINDS` order (the TASK-030 pin's shape). No rows means Under Review. TASK-028's 201 and TASK-030's GET reuse it.
- Assumption (Q-033, option a): Professional info is editable until Active; an Active Developer gets 409 `CONFLICT` with the default message (SPEC-001 names no rule). Under Review and Unsuccessful Developers can edit.
- Alternatives rejected: an upsert keyed on `user_id` (MySQL `INSERT ... ON DUPLICATE KEY` hides whether the row existed and still needs the Active check first); returning the DB column names (`organizationName`, `businessType`; the page reads the form's names).

## DEC-034: Verification documents, first submission (TASK-028)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Upload order changed by DEC-038 (parallel). Applies SPEC-001's POST `/me/documents` row and "Documents in one request", DEC-018, DEC-022 and the TASK-039 frontend pin.
- Dependency: `multer` (^2.4.0, MIT; busboy, type-is, append-field), pre-approved in SPEC-001. Express 5 does not parse multipart, and no installed package does. 2.4.0 rather than the latest 2.5.0, which was a week old.
- Decision (parsing, `documentUpload.js`): POST `/api/auth/me/documents` runs `authenticate`, `authorize('developer')`, then the `documentUpload` middleware, so a non-Developer's body is never parsed. multer memory storage with `.fields()` of the three kinds (one file each); limits `fileSize = LIMITS.auth.maxFileBytes` (exactly 10 MB passes), 3 files, 1 text field, 1 KB per field, `defParamCharset: 'utf8'` (non-ASCII file names arrive as typed). Each file part becomes `{ documentKind: <part name>, idDocumentType (Government ID only), fileName, mimeType: <part type>, sizeBytes }` and is checked with `documentUploadSchema`; then its first bytes are sniffed (`%PDF-`, PNG, JPEG signatures), and a mismatch is `mimeType.invalid`. Errors go to `fields["documents.<kind>.<field>"]`, all files together. multer's size limit → `documents.<kind>.sizeBytes = [sizeBytes.max]`; an unknown file part, a second file of a kind, or an extra text field → `_form = [unknownField]`; an unreadable multipart body → 400 `BAD_REQUEST`. `idDocumentType` without a Government ID file → `fields.idDocumentType = [idDocumentType.notAllowed]`.
- Decision (rules, `onboarding.service.js` `checkSubmission`): no Professional info → 403 `FORBIDDEN` (401 if the Account is gone). A sent kind whose latest document is pending or approved → 409 `CONFLICT` with `authMessages.api.documentAlreadySubmitted` in `error.message` (no `fields`), checked first. A sent kind the Type of Developer does not require (a certificate from an Individual) → 422 `[unknownField]` at `documents.<kind>.file`. Every required kind with no document yet must be sent: 422 `[authMessages.documents.required[kind]]` ("Upload your <document name>", Q-036) at `documents.<kind>.file`. A kind whose latest document is rejected may be sent again; that path is TASK-029's to test. A request with no files asks for every kind that can still be sent, or is a 409 when none can.
- Decision (storage and transaction): the rules run before any upload, so a refused request uploads nothing. Files go one by one through `uploadAndSave` (nested, so each compensation covers the files before it) under `documents/<profile id>/` with the injected `storage` (PDF `raw`, images `image`, authenticated). After the last upload, one transaction locks the profile row (`SELECT ... FOR UPDATE`), reads the document rows again, re-runs the rules (so of two racing submissions one gets 409) and `bulkCreate`s the rows with `created_at` from the injected clock in whole seconds. Cloudinary is never called inside it. If the transaction or a later upload fails, every uploaded file is deleted now or queued in `pending_file_deletions` (`save_failed`), newest first. 201 `{ verification }` is `verificationStatus()` over the rows (DEC-033), the TASK-030 GET shape.
- Decision (wiring): `createAuthRouter` now takes `storage` from `createApp`'s dependencies (`routes/index.js` already passed them all) and builds its own `createFileUploadService` / `createFileDeletionService` on it, rather than the files module's Cloudinary singletons. `createTestApp()`'s fake storage now issues a different public id per file (`createFakeStorage({ uniqueIds: true })`), since one request stores up to three files and `cloudinary_public_id` is unique.
- Decision (shared): `authMessages.documents.required` (one message per `DOCUMENT_KINDS` entry) and `authMessages.api.documentAlreadySubmitted` (Q-036 wording, assumed); `documentUploadCases` join `@real-estate/shared/testing`. The backend parity test sends each case that a real file part can express (9 of 18).
- Assumptions (low impact, reversible): a certificate from an Individual is refused rather than stored; the 409 carries no `fields`, so the page shows it as the form-level alert (as its tests expect); the route has no per-IP limiter, like the other signed-in routes.
- Known trade-off: the request is parsed into memory (up to about 30 MB per request) before the per-file checks; the per-IP limiter does not cover this route.
- Alternatives rejected: disk storage (ID documents would touch the server disk); uploading in parallel (simpler compensation when sequential, at most 3 files); one transaction around the uploads (DEC-018 forbids Cloudinary inside a transaction); `fields` for the 409 (the slot of a pending kind is not shown on the page).
- Resubmission (TASK-029, 2026-10-29): tested with no code change. A kind whose latest document is rejected is accepted, alone or with other rejected kinds; a subset is fine (SPEC-001 only says "only kinds whose latest document is rejected"), and the kinds left out stay rejected, so the headline stays Unsuccessful. The rejected row stays as history (db.md, Q-022) and its file is neither destroyed nor queued: a row still references it, and deleting superseded files belongs to the retention job (Q-026, TASK-016). If the resubmission fails after its upload, only the new file is deleted or queued (DEC-018). A Developer who switched to Company while Unsuccessful must send the certificate with the resubmission (it has no document yet).

## DEC-035: Verification status endpoint, user field and the Active developer guard (TASK-030)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies SPEC-001's GET `/me/verification` row, the `user` shape, "Access guard" and "New shared error codes", and the TASK-030 frontend pin. What the Account reads load changed by DEC-038.
- Decision (endpoint): GET `/api/auth/me/verification` runs `authenticate`, `authorize('developer')`, then `onboardingService.getVerification`: 200 `{ status, documents }` = `verificationStatus()` over the profile's rows (DEC-033), the same body as POST `/me/documents`'s `verification`. Buyer-only → 403 `FORBIDDEN`; deleted Account → 401.
- Assumption (low impact, reversible): a Developer without Professional info gets 403 `FORBIDDEN` (as on POST `/me/documents`): with no Type of Developer the required kinds are unknown, and guessing Individual would show 2 slots to a future Company. The Upload and status pages already show a 403 as the form alert.
- Decision (`user.developerVerificationStatus`): `null` without the Developer role, otherwise the headline (`under_review` / `active` / `unsuccessful`). A Developer without Professional info is `under_review` (no documents, as `verificationStatus` answers). `auth.repository` loads the profile (`id`, `businessType`) and its documents (`id`, `documentKind`, `status`, `createdAt`) in the same query as the Account and roles (`findUserByEmail`, `findUserForLogin`, `findUserById`), so login stays one SELECT; `toUserResponse` throws if the include is missing rather than answer a wrong status.
- Decision (guard): `requireActiveDeveloper` (`modules/auth/activeDeveloper.js`, exported ready-wired from `modules/auth/index.js`) goes after `authenticate`: no user → 401, no Developer role in the token → 403 `FORBIDDEN`, otherwise the status is derived from the database on each request (never stored, DEC-014) and anything but Active, including no Professional info, → 403 `DEVELOPER_NOT_ACTIVE`. SPEC-001 names it for later modules such as properties, so no current route uses it; it is tested on a test route.
- Decision (shared, integration-owner foundation): `ERROR_CODES.DEVELOPER_NOT_ACTIVE` = 403 with `authMessages.api.documentsUnderReview` ("Your account is under review"), added like `EMAIL_NOT_VERIFIED` with a test in `shared/src/errors/__tests__/codes.test.js`. The same message is used for Unsuccessful Developers, as SPEC-001 names one message for the code.
- Alternatives rejected: a separate query for the status in each auth use case (an extra round trip on login and refresh); storing the status (DEC-014); a middleware in `backend/src/middlewares/` (it needs the auth module's repository and status rule).

## DEC-036: E2E harness, a separate e2e start mode (TASK-042)

- Status: Accepted (implementing agent, 2026-10-29; reversible). Applies DEC-023's seam (`createApp({ mailer, storage, clock })`) to the running server Playwright uses.
- Decision (mechanism): a separate entry point, `npm run start:e2e -w backend` (`backend/src/test/e2eServer.js`), not an env switch. It refuses to start under any `NODE_ENV` but `test` (production and development exit 1 before the app loads), then applies the test env (`applyTestEnv`: dummy JWT/SMTP/Cloudinary values and `DB_NAME_TEST=real_estate_test` unless set, before `backend/.env` is read, so real SMTP and Cloudinary credentials are never loaded), refuses a database whose name does not end in `_test`, migrates it with `sequelize-cli`, and listens. `createE2eApp` (`backend/src/test/e2eApp.js`) builds `createApp` with the capture mailer (`createFakeMailer`: codes kept in memory, never sent), fake storage (`createFakeStorage`, nothing reaches Cloudinary) and the real clock, behind the test-only routes at `/api/__e2e`: `GET /status`, `POST /reset` (empties every table through `resetDatabase`, plus rate limiters, login attempt counts, captured mail and stored files), `GET /mail/latest?email=&purpose=`, `GET /storage`, `POST /seed/accounts`, `POST /seed/document-reviews`. File jobs do not run in this mode. `server.js`, `app.js` and `routes/index.js` import nothing from `src/test/`, so development and production never have these routes (`e2eMode.test.js` checks both the 404s and the imports).
- Decision (seeds, `backend/src/test/e2eSeeds.js`): `seedAccount` writes a Buyer or Developer straight into the DB (bcrypt hash, verified by default, Professional info by default for Developers, documents by one status or a `{ kind: status }` map, dated a minute back); `setDocumentReview` sets the review status of the latest document of a kind, or of every kind, satisfying the table CHECKs. Review is admin-only with no API, so it is seeded. The harness routes check their input by hand: they are developer-facing test tools, not user-facing forms, so no shared schema or message.
- Decision (Playwright): `e2e/playwright.config.js` starts its own frontend on 5174 (Vite proxy pointed at the e2e API with `API_PROXY_TARGET`) and the e2e API on 5100, and waits for `/api/__e2e/status`, which only the e2e server answers; a dev server (5173/5000, real mailer, dev DB) is never reused. With the API, tests run one at a time (`workers: 1`) and `e2e/fixtures/harness.js` resets the data before each test. E2E and `npm run test:integration` share `real_estate_test` and must not run at the same time. UI-only mode (`E2E_WITH_API=false`) starts only the frontend and skips harness tests.
- Alternatives rejected: `MAILER=capture` / `CERTIFICATE_STORAGE=fake` env values with a production refusal in `parseEnv` (the fakes and test routes would then be importable from the production entry point, one misconfigured variable away from being live); e2e connecting to MySQL itself (needs a new dependency in `e2e/` and a second copy of the CHECK rules); a separate e2e database (the DB user cannot create databases, and the brief names `real_estate_test` as the only test database); parallel workers with per-test data (each test empties the shared DB).

## DEC-037: Branch flow feature → testing → main

- Status: Accepted (user, 2026-10-30).
- Decision: `main` holds only code the user has tested manually and approved. Claude works and pushes only on `feature/<module>`. The user asks for a feature branch to be merged into `testing` (`--no-ff`, `npm run check` again, then push). They test manually on `testing`, then ask for `testing` to be merged into `main`. Rules: `.claude/rules/git-workflow.md`.
- Alternatives rejected: merging feature branches straight into `main` (no step for manual testing of combined modules).

## DEC-038: Code-review fixes in the auth backend (TASK-048)

- Status: Accepted (implementing agent, 2026-10-30; reversible). Changes DEC-034 (upload order) and DEC-035 (what the Account reads load). No API change.
- Decision (Account reads): `auth.repository` `findUserByEmail`, `findUserForLogin` and `findUserById` read the Account with its roles in one SELECT. Only for a Developer, a second SELECT (in the caller's transaction) loads the profile (`id`, `businessType`) and, of its documents, only the latest row of each kind (`id`, `documentKind`, `status`, `createdAt`): a `NOT EXISTS` anti-join on a newer row of the same profile and kind by `created_at`, then `id` (the `verificationStatus` order), served by `idx_verification_documents_profile_kind_created_at`. A Buyer's login, verify, `/me` and refresh no longer touch `professional_profiles` or `verification_documents`, and a refresh no longer joins the whole document history while it holds the refresh-token row lock. `user.developerVerificationStatus` is unchanged (`auth.repository.int.test.js`).
- Decision (uploads): `fileUploads.uploadAllAndSave(files, save)` (files module) starts every upload at once (`Promise.allSettled`). If any fails, every upload that succeeded is deleted now or queued as `save_failed`, save is not called, and the first failure in file order is thrown; otherwise save runs once with the files in request order, and if it fails every file is compensated the same way. `submitDocuments` uses it with its existing transaction as save, so Cloudinary is still never called inside a transaction (DEC-018). This replaces DEC-034's "one by one, newest first" and its rejected alternative "uploading in parallel": the compensation is no harder with `allSettled`, and a 3-file request no longer waits for the uploads in turn.
- Decision (helpers): `toWholeSeconds` (`utils/time.js`) and `constantTimeEqual` (`utils/constantTimeEqual.js`, length check then `crypto.timingSafeEqual`) replace the copies in `onboarding.service.js`, `verificationCode.service.js`, `resetToken.js` and `test/e2eSeeds.js`.
- Alternatives rejected: `ROW_NUMBER() OVER (PARTITION BY ...)` in a derived table (Sequelize cannot put it in an include, and an unfiltered window ranks every profile's rows); one `findOne` per kind (three queries); keeping the include but limiting it to Developers (a role is only known after the Account is read).

## DEC-039: Auth answers after the code review

- Status: Accepted (user, 2026-10-30, answered in chat)
- Date: 2026-10-30
- Landing (Q-034): resume onboarding at the first unfinished step. Buyer: Select a country if none is saved, else home. Developer: Professional info, then Documents, then the Status screen until Active, then home. An Account with both roles follows the developer flow until Active. Built in TASK-041.
- Become a developer (Q-035): the Agent tab stays hidden; the link is deferred to design (it belongs on the buyer home). TASK-037 stays blocked on design. The API (DEC-032) is ready.
- Refresh reuse (Q-038): a refresh token revoked less than 30 s ago answers 401 without revoking every session (covers a lost Set-Cookie or a browser without `navigator.locks`); older reuse still revokes all sessions. No migration. TASK-050.
- After a reset (Q-040): a successful reset clears the per-account login lockout. Resetting to the same password stays allowed. Access tokens still expire normally (`JWT_ACCESS_EXPIRES_IN`). TASK-050.
- Rate limits (Q-041): one per-IP limiter per route group (sign-up/verify, login, password reset), 20 requests per 15 minutes each, replacing the single shared limiter. The per-account login limit (10 / 15 min) stays. TASK-050.
- Unverified login message (Q-042): unchanged.
- Confirmed assumptions: Q-033 (edit until Active, 409 after), Q-036 (document messages), Q-037 (mail failure answers as success), Q-039 (unverified Accounts can reset).
- Responsive auth pages (rule from commit bc6f7c5): at least 1024 px wide the hero and card sit side by side (the hero shrinks first); below 1024 px the hero is hidden and the card fills the width (max about 560 px, centred) with the logo and "Back to home" at the top. On short screens the spacing compresses and the page scrolls only when the form cannot fit. Recorded in `docs/modules/auth/figma.md`. TASK-051.

## DEC-040: Security-review fixes (TASK-053)

- Status: Accepted (implementing agent, 2026-10-30; reversible). Fixes from the 2026-10-30 security review. No API shape change.
- Trust proxy: `app.set('trust proxy', env.TRUST_PROXY)`. `TRUST_PROXY` is `false` (default: X-Forwarded-For is ignored, so a client cannot rotate it for a fresh per-IP budget) or a hop count 1-99, set only when exactly that many proxies add the header. Replaces the hard-coded `1`.
- Logs: `utils/logger.js` has an `err` serializer (`serializeError`, also given to pino-http, which would otherwise use pino's) that logs a Sequelize or driver error as a whitelist only: `type`, the driver's `code`, `errno`, `sqlState`, the message with every quoted value replaced by `'?'`, and the stack frames. `parameters`, `sql`, `original`, `parent` and the driver message are never logged (they carry email, phone, name and the bcrypt hash); the same paths are also in pino's `redact` list. Other errors keep pino's standard serializer.
- Document upload (POST `/me/documents`), in this order after `authenticate` and `authorize('developer')`: a declared `Content-Length` above `MAX_DOCUMENTS_BODY_BYTES` (3 x 10 MB + 64 KiB) → 400 `BAD_REQUEST` (as an oversized JSON body) with `Connection: close`, body unread; a per-Account limiter keyed on `req.user.id`, **10 submissions per hour (assumption, not a confirmed business rule)** → 429 `TOO_MANY_REQUESTS`, every attempt counted; one upload in flight per Account (`oneRequestAtATime`, in memory per app instance, freed when the response ends or the connection closes) → 429; an eligibility check (`assertCanSubmitDocuments`: 401 without the Account, 403 without Professional info, 409 `documentAlreadySubmitted` when no required kind can be sent); only then multer parses the body. The full rules still run after parsing. Existing messages and codes only. The two "racing submissions" tests now race through two app instances, where only the profile row lock decides.
- Refresh grace window: `auth.service.refresh` throws `RefreshRefusedError` (session.service.js) with the `SESSION_CHECK` case; `keepsCookie` is true for `recentlyRevoked`, and the controller then answers 401 without clearing the cookie. Every other refusal still clears it. Sessions revoked by a reuse a moment ago are also inside the window, so they get the 401 without the clear too (their cookie is dead either way).
- Tokens: `parseEnv` refuses `JWT_REFRESH_SECRET` equal to `JWT_ACCESS_SECRET` (next to the existing `VERIFICATION_CODE_SECRET` check). Access tokens carry `typ: "access"`, refresh tokens `typ: "refresh"`. `verifyAccessToken` requires `typ === "access"`: one issued before this change has no `typ` and is refused, which only costs a silent refresh (15 min lifetime). `verifyRefreshToken` refuses any other `typ` but accepts a missing one, so refresh cookies issued before the change (up to 7 days) keep working; the hashed `refresh_tokens` lookup already ties them to a session. Follow-up: once 7 days have passed since deployment, the missing-`typ` allowance can be removed.
- E2E: `backend/src/test/e2eServer.js` listens on 127.0.0.1 only (its `/api/__e2e` routes must never be reachable from the network); `e2e/playwright.config.js` defaults `E2E_API_URL` to `http://127.0.0.1:5100`.
- Alternatives rejected: redacting the DB error paths only (the driver message and `sql` can still carry values under other keys); parsing the error message in the controller to spot the grace case; rejecting refresh tokens without `typ` now (logs every existing session out for no gain); a 413 code (none exists in `ERROR_CODES`; BAD_REQUEST matches the JSON body limit).

## DEC-041: Password-reset guessing cap (TASK-054)

- Status: Accepted (implementing agent, 2026-10-30; reversible). Applies Q-044 (user, 2026-10-30: yes). No migration: uses `verification_codes.attempts`, `created_at` and `purpose`.
- Rule: a dead code is a `password_reset` code with `attempts >= MAX_ATTEMPTS` (5 wrong guesses, the `codeTooManyAttempts` case). When 3 dead codes of one Account were created less than 24 h apart (newest `created_at` minus oldest < 24 h), `verificationCodes.issue` refuses every new `password_reset` code for that Account until 24 h after the newest of the three was created (refused at 23:59:59, allowed at 24:00:00, injected clock). Wrong guesses below 5 do not count; `email_verification` codes are never counted or paused; each Account is counted on its own. `DEAD_RESET_CODES_CAP` and `RESET_PAUSE_MS` in `verificationCode.service.js`.
- Why the newest code's `created_at`: the table has no "died at" (`updated_at` is written by Sequelize's wall clock, not the injected clock, and the ticket keeps to `attempts`/`created_at`/`purpose`). A code only takes guesses before `expires_at` (10 min), so it dies within 10 min of its `created_at`, and the pause lasts 23:50 to 24:00 after the third code died. A rolling "3 dead codes created in the last 24 h" was rejected: three codes spread over a day (0 h, 12 h, 23 h) would pause for only 1 h, not the 24 h Q-044 asked for. Effect: at most 3 dead codes (15 guesses) plus one live code per Account per pause, instead of about 600 guesses a day.
- Answer (forgot and resend, DEC-029 kept): a known email under the pause gets 429 `TOO_MANY_REQUESTS` with the new `authMessages.api.resetCodesPaused` ("Too many wrong codes. For your security, new codes are paused for up to 24 hours"), no code and no email, through the existing `ResendRefusedError`. An unknown email still gets 200 `{ sent: true }`. The pause is checked before the hourly cap and the 60 s cooldown (longest refusal first, as DEC-026). It is a constant: "up to 24 hours" stays true without telling the exact time left. The frontend shows any 429 message as returned (ForgotPasswordPage, VerifyResetCodePage resend); no frontend change.
- Known trade-offs: (1) enumeration is no worse than DEC-029 (a known email already gets 429 inside the cooldown); (2) anyone who knows the email can pause that Account's password reset for 24 h by asking for codes and guessing wrong (3 x 5 requests, inside the per-IP limit of 20 / 15 min), a denial of reset accepted with Q-044; log in with the current password is not affected; (3) the check reads the dead codes of the last 48 h on the existing `idx_verification_codes_user_id_purpose_created_at` index, under the Account row lock the caller already holds.
- Retention constraint: the planned purge of `verification_codes` (24 h after `expires_at`, db.md) would end a pause early; when it is built, it must keep `password_reset` rows for at least 48 h after `created_at` (db.md updated).
- E2E: `seedAccount({ deadResetCodes: 0..3 })` writes dead codes dated 2 to 4 minutes back, so the e2e suite (real clock) need not wait out the 60 s cooldowns.
- Alternatives rejected: a new column or table for the pause (migration not allowed); counting `updated_at` as the death time (wall clock, untestable with the fake clock); a 403 or a 200 that silently skips the email (the user would not know to wait; DEC-029 already answers refusals with 429).
