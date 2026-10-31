# PROP-006: Mount the property API with Active-developer access and owner check

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-001
- **Cites:** PROP-SPEC-001 §Authorization, PROP-SPEC-001 §Module layout, PROP-DEC-011, PROP-DEC-001
- **Figma:** none

## What to build

The property module is mounted at `/api/properties` with one line in the API router. Every route runs `authenticate`, then `requireActiveDeveloper`, then validation, and routes with `:id` load the property only when the caller owns it. Later tickets add routes to this skeleton without repeating the access rules.

## Acceptance criteria

- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [x] Permissions: loading another Developer's property by id and loading a missing id both get 404 `NOT_FOUND` with the same body
- [x] Validation: a non-numeric or zero `:id` gets 422 `VALIDATION_ERROR` on `id` with the shared message
- [x] Multipart routes check role and ownership before reading the body (proved by a probe route in the test)

## Out of scope

- Any concrete endpoint (PROP-007 onwards)
- Staff access (PROP-Q-022)

## Verification

- The property module is mounted at `/api/properties` with one line in `backend/src/routes/index.js` (shared file, noted for the merge). Its router runs `authenticate` → `requireActiveDeveloper` on every route. `router.param('id')` validates `:id` with the shared `propertyParamsSchema` (422 `fields.id`), loads the property scoped to the caller (`findOwned`) into `req.property`, or answers 404 `NOT_FOUND` with the same body for another owner's property and for a missing one.
- Test helper `developerSession(app, state)` in `propertyFactories.js`: seeds an Account and logs it in.
- Tests: `backend/src/modules/property/__tests__/propertyAccess.int.test.js`, 11 tests: mounted; 401 with no token and with a bad token; 403 `FORBIDDEN` for a Buyer; 403 `DEVELOPER_NOT_ACTIVE`; the owner loads the property; a foreign id and a missing id get the same 404; 4 bad ids get 422; on a probe multipart route, role and owner are checked before the body handler runs.
- `npm run check`: shared 687, backend unit 473, backend integration 333 passed + 1 skipped, frontend 276; lint, format and build pass.
