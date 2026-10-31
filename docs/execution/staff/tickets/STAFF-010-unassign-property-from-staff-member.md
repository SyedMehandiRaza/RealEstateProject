# STAFF-010: Unassign a property from a staff member

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-009
- **Cites:** STAFF-SPEC-001 §Endpoints E9; STAFF-DEC-015
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer removes one property from a member's assignments. The property stays, and it shows up again in the member's assignable list.

## Acceptance criteria

- [x] DELETE `/api/staff/:id/properties/:propertyId` returns 200 `data.staffMember` without that property; the property row is untouched and is listed again by E7
- [x] Errors: property not assigned to this member (including another developer's property) → 404 `staffMessages.api.notAssigned`; unknown or foreign member → 404 `staffMessages.api.notFound`; ids not positive integers → 422 `fields.id` / `fields.propertyId` with the shared messages
- [x] Permissions: an Active developer may call DELETE `/api/staff/:id/properties/:propertyId`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] `npm run check` passes

## Out of scope

- The Unassign link (STAFF-015)

## Verification

- Test-first: `unassignProperty.int.test.js` was red (route without handler), then green.
- `backend/src/modules/staff/__tests__/unassignProperty.int.test.js`: 10 tests (200 without the card, property kept and assignable again; property not assigned to this member, a colleague's or another developer's → 404 `notAssigned`, colleague's assignment kept; unknown and foreign member → 404 `notFound`, its assignment kept; 4 invalid id pairs → 422 with the shared messages; 401 / 403 / 403).
- All nine endpoints of STAFF-SPEC-001 now exist.
- `npm run check`: shared 274, backend unit 454, backend integration 460 + 1 skipped, frontend 276; lint, format, build green.
