# STAFF-009: Assign a property to a staff member

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-008
- **Cites:** STAFF-SPEC-001 §Endpoints E8; STAFF-DEC-005, STAFF-DEC-016
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer assigns one of their own properties to a member, also a disabled one. The updated member is returned with the new card first. A property of another developer is not found, and assigning twice is refused.

## Acceptance criteria

- [x] POST `/api/staff/:id/properties` with `{ propertyId }` returns 201 `data.staffMember` with the property first in `assignedProperties`
- [x] Works for a disabled member
- [x] Validation parity: every `assignPropertyCases.invalid` case answers 422 with the same message
- [x] Errors: property unknown or not the caller's → 404 `staffMessages.api.propertyNotFound`; already assigned → 409 `CONFLICT` with `error.message = staffMessages.api.alreadyAssigned` and no `fields`, also on a race; unknown or foreign member → 404 `staffMessages.api.notFound`
- [x] The ownership check and the insert run in one transaction
- [x] Permissions: an Active developer may call POST `/api/staff/:id/properties`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] `npm run check` passes

## Out of scope

- Multi-assign (STAFF-DEC-015)

## Verification

- Test-first: `assignProperty.int.test.js` was red (12 of 15 failing), then green.
- `backend/src/modules/staff/__tests__/assignProperty.int.test.js`: 15 tests (201 with the new card first; disabled member; unknown and foreign property → 404 `propertyNotFound`, nothing written; already assigned → 409 `alreadyAssigned` without fields; concurrent assign → one 201 and one 409; unknown and foreign member → 404 `notFound`; 401 / 403 / 403 before validation; 6 parity cases from `assignPropertyCases`).
- Member row locked, ownership checked and the assignment inserted in one transaction; the unique pair decides duplicates.
- `npm run check`: shared 274, backend unit 454, backend integration 450 + 1 skipped, frontend 276; lint, format, build green.
