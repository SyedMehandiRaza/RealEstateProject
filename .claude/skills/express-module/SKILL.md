---
name: express-module
description: Implement or extend a backend module in Express (routes, controller, service, Sequelize data access) using the shared Zod schemas, the standard error contract, and test-first Jest/supertest tests. Use when adding API endpoints, a new backend module, or CRUD for a resource.
argument-hint: "<module-name> [endpoint or ticket]"
---

# Express module

Rules: `.claude/rules/backend.md`, `.claude/rules/validation.md`, `.claude/rules/database.md`. Use context7 for up-to-date Express, Sequelize and Zod APIs when unsure.

## Prerequisites (stop and ask if missing)
- Module spec with acceptance criteria: `docs/modules/<module>/README.md`
- Approved DB design: `docs/modules/<module>/db.md` (otherwise run `/db-design`)
- Shared schemas and messages for every input (otherwise run `/shared-validation`)
- The API contract written in the module README's Interfaces section: method, path, auth/role, request schema, response shape, status codes and error codes

## Steps (one endpoint = one vertical slice, test-first with /tdd)
1. **Red**: write a supertest integration test in `backend/src/modules/<module>/__tests__/<module>.routes.test.js` for the happy path, then for each failure: 422 with the exact shared messages in `error.fields`, 401/403 for auth, 404, and 409 for unique conflicts.
2. **Green**:
   - `<module>.routes.js`: `router.post('/', auth(...), validate({ body: createXSchema }), controller.create)`
   - `<module>.controller.js`: read `req.validated`, call the service, `res.status(201).json({ success: true, data })`
   - `<module>.service.js`: business rules, ownership/authorization checks, transactions; throw `AppError` with shared codes; map `SequelizeUniqueConstraintError` to a 409 or field error using the shared message
   - Register the router in the app's route index. This is a shared file: keep the change to one line and mention it in your report.
3. **Unit-test** non-trivial service logic separately (mock the repository/model).
4. **Refactor** with all tests green.
5. List endpoints: validated `page`/`pageSize`/sort allow-list/filters, `findAndCountAll` with `limit`/`offset`, `meta` in the response, `include` with explicit `attributes` (no password or hash columns), and no N+1.
6. Update the module README (Interfaces section) and `docs/execution/<module>/STATUS.md`.

## Done when
- [ ] Tests for success, validation (exact messages), auth, not-found and conflict pass
- [ ] No inline schema or message in backend code
- [ ] No sensitive fields in responses or logs
- [ ] Docs updated
