# Testing and Verification Rules

- Identify the appropriate tests and checks before implementation. Prefer test-first (`/tdd`): red, green, refactor, one vertical slice at a time.
- Add or update tests for behavior changes and bug fixes where practical.
- Run the narrowest relevant tests first, then broader checks when feasible.
- Run project-defined lint, type-check, build, and test commands where available.
- Do not state that tests passed unless they were actually run and passed.
- If checks cannot run, state why and what remains unverified.
- Test error paths, boundary cases, permissions, and invalid input as appropriate.
- Avoid tests that depend on production systems or mutate shared data.
- Use isolated test fixtures and clean up test data safely.

## Tools and locations
- `shared/`: Jest unit tests for every Zod schema (valid case, each rule failing, exact message asserted).
- `backend/`: Jest unit tests for services (DB mocked or test DB), and integration tests with `supertest` against `app.js` and a dedicated MySQL test database (`*_test`), migrated before the run and cleaned per test.
- `frontend/`: Jest + React Testing Library + `@testing-library/user-event` for components and forms. Mock HTTP with MSW.
- `e2e/`: Playwright against the running frontend and backend with a seeded test database. Cover the main happy path for each page plus validation-message parity.
- Never point any test at a non-test database. The test DB name must end with `_test`, and setup must refuse to run otherwise.
- Validation parity is required: see `.claude/rules/validation.md`.
