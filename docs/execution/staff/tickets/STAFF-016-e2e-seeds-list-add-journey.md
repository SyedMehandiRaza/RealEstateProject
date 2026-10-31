# STAFF-016: Seed staff data for e2e and test the list and add journey

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-003, STAFF-013
- **Cites:** STAFF-SPEC-001 §Testing Decisions; STAFF-DEC-010, STAFF-DEC-012
- **Figma:** Staff Management list 13009:17816 (1440x832); Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

The e2e harness can seed an Active developer with staff members and properties. A Playwright journey logs in as that developer, opens Staff Management, adds a member and sees them at the top of the list; parity tests submit invalid input and see the shared messages, and a duplicate email shows the server's message.

## Acceptance criteria

- [x] The e2e harness gets a test-only seed route (or an extension of the existing one) for staff members and properties, available only in the e2e server, with a test that the regular app does not have it
- [x] Journey: log in as an Active developer → `/staff` → Add Staff → fill the form → Successfully Added → Done → new member first in the list
- [x] Client parity: submitting the empty form shows the exact shared required messages; an invalid email and phone show their shared messages
- [x] Server parity: a duplicate email shows `staffMessages.email.taken` under Email; the developer's own email shows `staffMessages.email.self`
- [x] Access: a Developer under review sees "Your account is under review" on `/staff`
- [x] Runs on this folder's e2e ports and `real_estate_staff_test`
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Other journeys (STAFF-017, STAFF-018)
- Screenshots (STAFF-019)

## Verification

- Test-first: `backend/src/test/__tests__/e2eStaffSeeds.int.test.js` was red (no route), then green (2 tests: seeds properties, staff dated in order, assignments; 404 unknown employer, 400 unseeded property). `e2eMode.test.js` now also checks the regular app has no `POST /seed/staff`.
- Harness: `POST /api/__e2e/seed/staff` (`backend/src/test/e2eStaffSeeds.js`, reuses the STAFF-001 factories; e2e server only) and `harness.seedStaff(employerEmail, { properties, staff })`. Page object `e2e/pages/staff/StaffPage.page.js`.
- `e2e/tests/staff/staff-list-add.spec.js`: 12 tests, all passing against the real API on this folder's ports and `real_estate_staff_test` (41.9 s): list with seeded member → Add Staff → Successfully Added → Done → new member first with its values; empty form shows the 5 required messages with no request (client parity); 7 typed `staffMemberCases` show their exact shared message (client parity); duplicate email → `email.taken` and own email → `email.self` from the API (server parity); a Developer under review sees "Your account is under review".
- Note: a first run failed with 502 from the Vite proxy because a dev server I had started for screenshots (proxying to the dev API) was still listening on 5474 and Playwright reused it; stopped, then green.
- `npm run check`: shared 274, backend unit 455, backend integration 462 + 1 skipped, frontend 337; lint, format, build green.
