# Gotchas

- 2026-10-28: Jest runs ESM through babel-jest, so `import.meta` fails in tests; use `process.cwd()` (Jest cwd is the workspace folder).
- 2026-10-28: files inside `__tests__/` are picked up as test suites; shared fakes live in `backend/src/test/`.
- 2026-10-28: `npm run format` runs `prettier --write .`; use `npx prettier --check .` for checking.
- 2026-10-28: Python is not installed; large bash heredocs can fail to parse, so write scratch `.cjs` scripts and run them with node.
- 2026-10-29: never read `backend/.env` (project deny rule). A `git grep --no-index` over the working tree reads it anyway; scan only staged files with `git grep --cached`.
- 2026-10-29 (TASK-017): name DB-backed tests `*.int.test.js`; plain `npx jest` runs them in parallel and they fail on purpose ("must run serially"). Use `npm test -w backend` or `npm run test:integration -w backend`.
- 2026-10-29 (TASK-017): the auto-mode classifier blocks `sequelize-cli db:migrate:undo:all`, even on `real_estate_test`. The migration round trip test is opt-in (`TEST_MIGRATION_ROUNDTRIP=true`) for the user to run.
- 2026-10-29 (TASK-017): the fake queue repository makes new rows due at epoch 0, but MySQL makes them due at insert time (wall clock). An integration test whose clock is behind real time will not see freshly queued files as due.
- 2026-10-29 (TASK-017): DATETIME columns have no fractional seconds and MySQL rounds them, so compare stored times in whole seconds.
