# STAFF-005: Edit a staff member and replace their permissions

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-003, STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E4; STAFF-DEC-011, STAFF-DEC-012, STAFF-DEC-017
- **Figma:** Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

An Active developer changes a member's name, email, phone, role and permission areas in one save. The new permission set replaces the old one; status and assigned properties stay as they were. The same duplicate and own-email rules as Add apply.

## Acceptance criteria

- [ ] PUT `/api/staff/:id` returns 200 `data.staffMember` with the new values; permissions equal exactly the sent set; status and assignments unchanged
- [ ] Keeping the member's own current email is allowed; another member's email of the same employer → 409 `fields.email = [staffMessages.email.taken]` (also on a race); the employer's own email → 409 `fields.email = [staffMessages.email.self]`
- [ ] Member update and permission replacement happen in one transaction
- [ ] Validation parity: every `staffMemberCases.invalid` case answers 422 with the same message
- [ ] Errors: unknown or foreign id → 404 `staffMessages.api.notFound` (checked before the body's duplicate rule leaks anything)
- [ ] Permissions: an Active developer may call PUT `/api/staff/:id`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] `npm run check` passes

## Out of scope

- Status (STAFF-006)
- The form (STAFF-013)

## Verification

(filled when done)
