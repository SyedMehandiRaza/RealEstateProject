# STAFF-003: Add a staff member with permissions

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-002
- **Cites:** STAFF-SPEC-001 §Endpoints E2; STAFF-DEC-004, STAFF-DEC-012, STAFF-DEC-017
- **Figma:** Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

An Active developer adds a team member with full name, email, phone, role and at least one access permission. The member starts Active with no properties. The developer cannot add the same email twice, nor their own email.

## Acceptance criteria

- [ ] POST `/api/staff` with a valid body returns 201 `data.staffMember` (StaffMember shape, status `active`, permissions in `STAFF_PERMISSIONS` order, `assignedProperties: []`); email stored lowercase, phone without spaces
- [ ] The member and its permission rows are written in one transaction (a failure leaves no row)
- [ ] Validation parity: every `staffMemberCases.invalid` case answers 422 with the same shared message in `error.fields`
- [ ] Errors: an email the employer already uses → 409 `CONFLICT` `fields.email = [staffMessages.email.taken]`, also when two requests race (unique index mapped, never the raw DB text)
- [ ] Errors: the employer's own account email (any case) → 409 `CONFLICT` `fields.email = [staffMessages.email.self]`
- [ ] The same email can be added by another developer (unique per employer)
- [ ] Permissions: an Active developer may call POST `/api/staff`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] No email is sent and `user_id` stays NULL (STAFF-DEC-007); personal data is not logged
- [ ] `npm run check` passes

## Out of scope

- Invitation (STAFF-023)
- The form (STAFF-013)

## Verification

(filled when done)
