---
name: jest-testing
description: Write or fix Jest unit and integration tests for this project (shared Zod schemas, Express services and routes with supertest, React components with React Testing Library). Use when adding tests, raising coverage, or when the user mentions Jest, unit tests, or integration tests.
argument-hint: "<file | module> [unit|integration|component]"
---

# Jest testing

Rules: `.claude/rules/testing.md`. For new behavior, drive it with `/tdd` (red, green, refactor). This skill covers the project-specific setup and patterns.

## Where tests go
- `shared/src/**/__tests__/*.test.js`: schema tests
- `backend/src/modules/<module>/__tests__/*.service.test.js`: unit tests
- `backend/src/modules/<module>/__tests__/*.routes.test.js`: integration tests (supertest + test DB)
- `frontend/src/**/__tests__/*.test.jsx`: component tests (jsdom + React Testing Library + MSW)

## Patterns
**Schema (shared)**
```js
const r = createPropertySchema.safeParse({ ...valid, title: '' });
expect(r.success).toBe(false);
expect(z.flattenError(r.error).fieldErrors.title).toContain(propertyMessages.title.required);
```
Use `test.each` over a table of `[field, badValue, expectedMessage]`, and include boundaries.

**Service unit**: mock the model/repository with `jest.fn()` or `jest.mock`; assert the business rule and the thrown `AppError` code. Do not touch the DB.

**Route integration**: `request(app).post('/api/properties').send(payload)`. Assert the status, the `success` flag, the response shape, and the exact shared messages. Run DB setup once (migrate the `_test` DB, refusing to run if the DB name does not end with `_test`) and clean tables between tests (truncate in FK-safe order, or wrap each test in a transaction that is rolled back).

**React component**: `render`, then `userEvent` to fill or submit, then `findByText(sharedMessage)` and `getByRole`. Mock the API with MSW handlers that return the standard error contract, so server field errors are also tested.

## Good tests
- Test behavior through public interfaces, not implementation details. One reason to fail per test.
- Deterministic: no real time, network, or ordering dependence (use fake timers and seeded data).
- Names describe the behavior: `rejects price of 0 with "Price must be greater than 0"`.

## Run
Run the narrowest first: `npx jest path/to/file -t "name"`, then the workspace suite (`npm test -w backend`), then everything. Report actual results; never claim a pass you did not see.
