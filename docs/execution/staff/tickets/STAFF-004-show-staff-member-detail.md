# STAFF-004: Show a staff member's detail

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-002
- **Cites:** STAFF-SPEC-001 §Endpoints E3, §Shapes; STAFF-DEC-009
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer opens one of their staff members and gets everything the Detail shows: contact details, role, status, granted permission areas and the assigned properties as cards. Another developer's member, or an unknown id, is simply not found.

## Acceptance criteria

- [x] GET `/api/staff/:id` returns 200 `data.staffMember` with permissions in `STAFF_PERMISSIONS` order and `assignedProperties` as PropertyCards (id, name, city, state, propertyStatus, assignedAt), newest assignment first
- [x] No `userId`, `employerId` or image URL is returned
- [x] Errors: unknown id or another developer's member → 404 `NOT_FOUND` with `staffMessages.api.notFound`; `id` not a positive integer → 422 `fields.id = [commonMessages.id.invalid]`
- [x] Permissions: an Active developer may call GET `/api/staff/:id`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] `npm run check` passes

## Out of scope

- Cover image (STAFF-022)
- Leads Assigned (CRM)

## Verification

- Test-first: `getStaff.int.test.js` was red (7 of 10 failing; access tests already passed through the guard), then green.
- `backend/src/modules/staff/__tests__/getStaff.int.test.js`: 10 tests (full StaffMember shape, permissions in shared order, cards newest assignment first with `assignedAt`, no `employerId` / `userId` / image fields; unknown and foreign id → 404 `api.notFound`; 4 invalid ids → 422 `id.invalid`; 401 / 403 / 403).
- `npm run check`: shared 274, backend unit 454, backend integration 374 + 1 skipped, frontend 276; lint, format, build green.
