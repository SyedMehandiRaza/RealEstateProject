# Architecture

## Current state

The monorepo scaffold exists and is tested: `shared/` (common Zod schemas, messages, error codes), `backend/` (Express app, error contract, validation middleware, JWT utilities, Sequelize connection; no tables yet), `frontend/` (React + Vite + Redux Toolkit/RTK Query, routing, auth slice, refresh-on-401), and `e2e/` (Playwright smoke tests). No business modules yet; auth is next.

## Technology stack

- Language: JavaScript (ESM), Node.js 24 (`.nvmrc`)
- Frontend: React 19 + Vite, Redux Toolkit + RTK Query, React Router, react-hook-form + @hookform/resolvers (Zod)
- Backend: Express 5, helmet, cors, cookie-parser, express-rate-limit, pino, jsonwebtoken, bcryptjs
- Validation: Zod 4 in `@real-estate/shared` (DEC-002)
- Database: MySQL with Sequelize 6 and sequelize-cli (`.cjs` migrations/seeders)
- Testing: Jest 30 (+ supertest, React Testing Library, MSW 2, jest-fixed-jsdom), Playwright
- Tooling: ESLint (flat config at root) + Prettier
- Hosting/deployment: unknown

## Repository layout

```
package.json            # workspaces + root scripts (dev, test, test:e2e, lint, format, build)
shared/src/             # schemas/, messages/, errors/ (codes, toFieldErrors), limits.js
backend/src/            # config/, models/, migrations/, seeders/, middlewares/, modules/, routes/, utils/, app.js, server.js
frontend/src/           # app/, config/, services/api/, modules/, components/, pages/, lib/, styles/, assets/, test/
e2e/                    # playwright.config.js, tests/, pages/, fixtures/
```

Detailed per-app layout: `.claude/rules/backend.md`, `.claude/rules/frontend.md`.

## Request flow

Browser → Vite dev server (`/api` proxy) → Express `/api` → `validate(shared schema)` → controller → service → Sequelize → MySQL.
Errors from any layer → `errorHandler` → `{ success: false, error: { code, message, fields? } }`; the frontend maps `fields` to form errors with `applyServerErrors`.

## Auth (DEC-008)

Access token in the JSON response, then in Redux memory and the `Authorization: Bearer` header. Refresh token in the httpOnly cookie `refresh_token` (path `/api/auth`), stored hashed and rotated. RTK Query `baseQueryWithReauth` calls `POST /api/auth/refresh` once on a 401 and retries the request.
**Assumed contract** (to confirm in the auth module): `POST /api/auth/refresh` returns `{ success: true, data: { accessToken, user } }`.

## Module boundaries and ownership

| Module/component                                                | Responsibility                                    | Owner                            | Dependencies       |
| --------------------------------------------------------------- | ------------------------------------------------- | -------------------------------- | ------------------ |
| shared                                                          | Validation schemas, messages, limits, error codes | integration-owner                | zod                |
| backend bootstrap (app.js, routes/index.js, middlewares, utils) | App wiring, error contract, auth primitives       | integration-owner                | shared             |
| migrations                                                      | DB schema history                                 | db-architect / integration-owner | none               |
| frontend bootstrap (app/, services/api, components/routing)     | Store, routing, API base                          | integration-owner                | shared             |
| feature modules                                                 | Per-module API + pages                            | assigned per task                | shared, migrations |

## Environment variables (names only)

Backend (`backend/env.example`): `NODE_ENV`, `PORT`, `LOG_LEVEL`, `CORS_ORIGINS`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_NAME_TEST`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CERTIFICATE_STORAGE` (only `cloudinary`), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT` (only 465), `SMTP_USER_NAME`, `SMTP_USER_PASSWORD`, `MAIL_FROM`, `VERIFICATION_CODE_SECRET` (32+ characters, not equal to a JWT secret). All are validated at startup by `parseEnv` in `backend/src/config/env.js`; the error names the variable, never the value.
Frontend (`frontend/env.example`): `VITE_API_URL`.
E2E: `E2E_WEB_URL`, `E2E_API_URL`, `E2E_WITH_API`.

## Environments

- Local development: local MySQL; separate `<db>_test` database for tests (Jest setup refuses other names; see "Backend tests")
- Integration/test, Staging, Production: unknown

## Backend tests (TASK-017)

Two Jest projects in `backend/jest.config.js`. `npm test -w backend` (and the root `npm test`) runs both: unit first in parallel, then integration serially (`--runInBand`).

| Project     | Files           | Database                                                                                 |
| ----------- | --------------- | ---------------------------------------------------------------------------------------- |
| unit        | `*.test.js`     | none: in-memory fakes from `backend/src/test/` only                                      |
| integration | `*.int.test.js` | `real_estate_test` (`DB_NAME_TEST`), migrated once per run and emptied before every test |

How to write an integration test:

1. Name the file `<thing>.int.test.js` inside a `__tests__/` folder. Nothing else is needed for the database: `src/test/globalSetup.js` refuses any database whose name does not end in `_test` and runs `sequelize-cli db:migrate`, and `src/test/integrationSetup.js` deletes every row of every table (except `sequelize_meta`/`sequelize_data`) before each test and closes the connection after the file.
2. Build the app with `createTestApp()` from `src/test/testApp.js`. It returns `{ app, mailer, storage, clock }`: the app built by `createApp({ mailer, storage, clock })` with a fake mailer (`mailer.lastCodeFor(email, purpose?)` reads the code from the "email", `failNextSends(n)` simulates SMTP failures), the in-memory Cloudinary fake (`storage.calls`, `storage.assets`) and a test clock (`clock.advance(ms)`, `clock.set(date)`). Pass any of them to replace one fake.
3. Drive it with supertest (`request(app).post(...)`), then assert on the response, `mailer.messages`, rows via `models`, and queued file deletions (`models.PendingFileDeletion`).

Rules:

- `createApp()` without arguments uses the real dependencies (`cloudinaryStorage`, `systemClock` from `src/utils/clock.js`, `smtpMailer` from `src/modules/mail/smtp.mailer.js`, DEC-024). Under `NODE_ENV=test` the real mailer refuses to send. An unknown dependency name or one missing a method throws, so a typo cannot fall back to the real service.
- Services read the time from the injected `clock.now()`, never `new Date()`, so boundaries (9:59 vs 10:00) are testable.
- Rate limiters are created with `createLimiter` in `middlewares/rateLimiter.js`; every suite resets them in a `beforeEach` (`src/test/setupAfterEnv.js`).
- Integration files must run serially (they share one database); a parallel run fails with a clear error.
- A repository with an in-memory fake gets a contract suite run against both (example: `src/test/queueRepositoryContract.js`).
- The migration round trip (all down, then up) drops every test table, so it is opt-in: `$env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend`.
- Validation parity (DEC-025): the invalid inputs of each shared schema live once in `shared/src/testing/` and are imported as `@real-estate/shared/testing` (`signUpCases`, `verifyCodeCases`, ...; each `{ valid, invalid: [{ name, input, field, message }] }`). The shared schema test and the backend parity test (`modules/<module>/__tests__/<module>Validation.test.js`, a unit test: validation answers before any query) replay the same rows. Add a schema's cases there when its first route is built.
- Auth journeys for integration tests: `src/test/authFlows.js` (`signUp(app, overrides)`, `signUpAndVerify(app, mailer, overrides)`).

## Architecture constraints

- Validation rules and messages exist only in `shared/`.
- Schema changes only through migrations.
- UI matches Figma; tokens come from Figma variables.

## Files and background jobs (DEC-016, DEC-018)

- Cloudinary is the file store. Every upload goes under `realestate/<NODE_ENV>/` as an `authenticated` asset; the adapter (`backend/src/modules/files/cloudinary.storage.js`) refuses public ids outside that prefix.
- `pending_file_deletions` is an outbox: records are deleted and their files queued in one transaction; Cloudinary is never called inside a transaction.
- `server.js` starts two in-process jobs (`modules/files/fileJobs.js`): the deletion worker every minute (retry with backoff, max 5 attempts, then `failed` for review) and the orphan cleanup once a day. They run in every API instance. Both are idempotent, but the worker has no row locking yet, so two instances may try the same file (harmless: a missing file counts as deleted).
- Startup checks the MySQL version (`utils/mysqlVersion.js`) and exits below 8.0.16.
