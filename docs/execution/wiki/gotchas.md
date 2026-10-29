# Gotchas

- 2026-10-28: Jest runs ESM through babel-jest, so `import.meta` fails in tests; use `process.cwd()` (Jest cwd is the workspace folder).
- 2026-10-28: files inside `__tests__/` are picked up as test suites; shared fakes live in `backend/src/test/`.
- 2026-10-28: `npm run format` runs `prettier --write .`; use `npx prettier --check .` for checking.
- 2026-10-28: Python is not installed; large bash heredocs can fail to parse, so write scratch `.cjs` scripts and run them with node.
- 2026-10-29: never read `backend/.env` (project deny rule). A `git grep --no-index` over the working tree reads it anyway; scan only staged files with `git grep --cached`.
