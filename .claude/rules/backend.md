# Backend Rules (Node.js + Express)

## Layout (per module)
```
backend/src/modules/<module>/
  <module>.routes.js       # Express router: paths, auth, validate(schema), controller
  <module>.controller.js   # HTTP only: read req, call service, send response
  <module>.service.js      # business rules, transactions; no req/res
  <module>.repository.js   # optional: complex Sequelize queries
  __tests__/               # unit (service) + integration (supertest) tests
backend/src/models/        # Sequelize models (one file per table, `define<Model>(sequelize)`), registered in models/index.js
backend/src/migrations/    # sequelize-cli migrations, CommonJS `.cjs` (package is ESM)
backend/src/seeders/       # sequelize-cli seeders, `.cjs`, synthetic data only
backend/src/middlewares/   # validate, authenticate/authorize, errorHandler, notFound, rateLimiter
backend/src/config/        # env.js (Zod-validated env), database.cjs (shared by app and sequelize-cli)
backend/src/utils/         # AppError, jwt (sign/verify/hashToken), password (bcryptjs), cookies, response, logger
backend/src/routes/index.js  # mounts module routers under /api
backend/src/app.js         # createApp(): builds the app (no listen), used by tests
backend/src/server.js      # connects DB, listens, graceful shutdown
```

## Auth (JWT)
- Access token: short-lived (`JWT_ACCESS_EXPIRES_IN`), returned in the JSON body, sent as `Authorization: Bearer`. Use `authenticate` then `authorize(...roles)`.
- Refresh token: `signRefreshToken()` gives `{ token, jti, expiresAt }`; set it only as the httpOnly cookie `refresh_token` (`refreshCookieOptions`, path `/api/auth`). Store only `hashToken(token)` in the DB; rotate on every refresh and revoke on logout or when reuse is detected.
- Never put tokens or password hashes in responses or logs.

## Conventions
- Validation: `validate({ body, params, query })` middleware using schemas from `shared/`. Controllers receive already-parsed data (`req.validated`).
- Errors: throw `new AppError(code, { message?, fields? })` with a code from `ERROR_CODES` in `shared` (status comes from the code); a single error-handling middleware formats every response per `.claude/rules/validation.md`. Never send raw error messages or stacks to clients.
- Async handlers must forward errors to `next` (Express 5 does this natively; on Express 4 use a wrapper).
- Success response shape: `{ "success": true, "data": ..., "meta"?: { page, pageSize, total } }`.
- Use Sequelize transactions for multi-row writes. Use parameterized queries only; no string-built SQL.
- Security baseline: `helmet`, CORS allow-list from env, rate limiting on auth routes, body-size limit, password hashing (argon2 or bcrypt), authorization checked in the service or route layer, never only on the client.
- Config: read env once in `config/`, validate it with Zod, and fail fast on startup. Document variable names in `docs/ARCHITECTURE.md` and keep values in `backend/.env` (never committed); `backend/env.example` lists the names.
- Logging: structured logger (for example `pino`); never log passwords, tokens or full personal data.
- Pagination: `page`/`pageSize` query params validated in shared schemas, with a max page size.
