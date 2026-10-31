# STAFF-016: Seed staff data for e2e and test the list and add journey

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-003, STAFF-013
- **Cites:** STAFF-SPEC-001 §Testing Decisions; STAFF-DEC-010, STAFF-DEC-012
- **Figma:** Staff Management list 13009:17816 (1440x832); Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

The e2e harness can seed an Active developer with staff members and properties. A Playwright journey logs in as that developer, opens Staff Management, adds a member and sees them at the top of the list; parity tests submit invalid input and see the shared messages, and a duplicate email shows the server's message.

## Acceptance criteria

- [ ] The e2e harness gets a test-only seed route (or an extension of the existing one) for staff members and properties, available only in the e2e server, with a test that the regular app does not have it
- [ ] Journey: log in as an Active developer → `/staff` → Add Staff → fill the form → Successfully Added → Done → new member first in the list
- [ ] Client parity: submitting the empty form shows the exact shared required messages; an invalid email and phone show their shared messages
- [ ] Server parity: a duplicate email shows `staffMessages.email.taken` under Email; the developer's own email shows `staffMessages.email.self`
- [ ] Access: a Developer under review sees "Your account is under review" on `/staff`
- [ ] Runs on this folder's e2e ports and `real_estate_staff_test`
- [ ] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Other journeys (STAFF-017, STAFF-018)
- Screenshots (STAFF-019)

## Verification

(filled when done)
