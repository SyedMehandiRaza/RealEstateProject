# STAFF-007: Remove a staff member

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E6; STAFF-DEC-003, STAFF-DEC-013
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer removes a member for good. Their permissions and property assignments are deleted with them; the properties themselves stay.

## Acceptance criteria

- [x] DELETE `/api/staff/:id` returns 204 with no body; the member, its permission rows and its assignment rows are gone; the properties remain
- [x] Removing again → 404 `staffMessages.api.notFound`; another developer's member → 404 and is not deleted
- [x] Once the developer has no staff (and no properties) the account deletion check of PROP-DEC-001 no longer blocks on staff (covered by an existing auth test or a new one in this module's tests, without changing auth code)
- [x] Permissions: an Active developer may call DELETE `/api/staff/:id`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] Nothing about the removed member is logged
- [x] `npm run check` passes

## Out of scope

- The confirmation modal (STAFF-014)

## Verification

- Test-first: `removeStaff.int.test.js` was red (4 of 8 failing), then green.
- `backend/src/modules/staff/__tests__/removeStaff.int.test.js`: 8 tests (204 empty body; member, permissions and assignments gone, property kept, list updated; already removed → 404 `api.notFound`; foreign member → 404 and kept; invalid id 422; PROP-DEC-001: auth's `deleteUser` refuses 409 `accountHasPropertiesOrStaff` while staff exist and succeeds after the remove, auth code unchanged; 401 / 403 / 403).
- Also fixed a flaky date helper in `listStaff` / `getStaff` tests (one base time per file); staff suite run 3 times: 120/120 each.
- `npm run check`: shared 274, backend unit 454, backend integration 427 + 1 skipped, frontend 276; lint, format, build green.
