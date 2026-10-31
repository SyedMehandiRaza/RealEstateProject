# PROP-006: Mount the property API with Active-developer access and owner check

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-001
- **Cites:** PROP-SPEC-001 §Authorization, PROP-SPEC-001 §Module layout, PROP-DEC-011, PROP-DEC-001
- **Figma:** none

## What to build

The property module is mounted at `/api/properties` with one line in the API router. Every route runs `authenticate`, then `requireActiveDeveloper`, then validation, and routes with `:id` load the property only when the caller owns it. Later tickets add routes to this skeleton without repeating the access rules.

## Acceptance criteria

- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: loading another Developer's property by id and loading a missing id both get 404 `NOT_FOUND` with the same body
- [ ] Validation: a non-numeric or zero `:id` gets 422 `VALIDATION_ERROR` on `id` with the shared message
- [ ] Multipart routes check role and ownership before reading the body (proved by a probe route in the test)

## Out of scope

- Any concrete endpoint (PROP-007 onwards)
- Staff access (PROP-Q-022)

## Verification

_Filled when done._
