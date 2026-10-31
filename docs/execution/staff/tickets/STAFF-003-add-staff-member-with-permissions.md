# STAFF-003: Add a staff member with permissions

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-002
- **Cites:** STAFF-SPEC-001 §Endpoints E2; STAFF-DEC-004, STAFF-DEC-012, STAFF-DEC-017
- **Figma:** Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

An Active developer adds a team member with full name, email, phone, role and at least one access permission. The member starts Active with no properties. The developer cannot add the same email twice, nor their own email.

## Acceptance criteria

- [x] POST `/api/staff` with a valid body returns 201 `data.staffMember` (StaffMember shape, status `active`, permissions in `STAFF_PERMISSIONS` order, `assignedProperties: []`); email stored lowercase, phone without spaces
- [x] The member and its permission rows are written in one transaction (a failure leaves no row)
- [x] Validation parity: every `staffMemberCases.invalid` case answers 422 with the same shared message in `error.fields`
- [x] Errors: an email the employer already uses → 409 `CONFLICT` `fields.email = [staffMessages.email.taken]`, also when two requests race (unique index mapped, never the raw DB text)
- [x] Errors: the employer's own account email (any case) → 409 `CONFLICT` `fields.email = [staffMessages.email.self]`
- [x] The same email can be added by another developer (unique per employer)
- [x] Permissions: an Active developer may call POST `/api/staff`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] No email is sent and `user_id` stays NULL (STAFF-DEC-007); personal data is not logged
- [x] `npm run check` passes

## Out of scope

- Invitation (STAFF-023)
- The form (STAFF-013)

## Verification

- Test-first: `createStaff.int.test.js` was red (32 of 35 failing; the 3 access tests already passed through STAFF-002's guard), then green.
- `backend/src/modules/staff/__tests__/createStaff.int.test.js`: 35 tests (201 shape, lowercase email and phone without spaces stored, `user_id` NULL, no mail; permissions in shared order; new member first in the list; duplicate email any case → 409 `email.taken`; same email for another developer; concurrent duplicate → one 201 and one 409; own email → 409 `email.self`; transaction rollback when the permission insert fails; 401 / 403 / 403 before validation; 23 parity cases from `staffMemberCases`).
- Repository gains the detail query (permissions and assignments loaded with `separate`, assignments newest first), presenter `toStaffMember` / `toPropertyCard`.
- `npm run check`: shared 274, backend unit 454, backend integration 364 + 1 skipped, frontend 276; lint, format, build green.
