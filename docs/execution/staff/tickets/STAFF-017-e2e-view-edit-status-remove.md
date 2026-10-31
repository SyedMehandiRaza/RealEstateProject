# STAFF-017: E2E journeys: view, edit, status change, remove

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-005, STAFF-006, STAFF-007, STAFF-014, STAFF-016
- **Cites:** STAFF-SPEC-001 §Testing Decisions; STAFF-DEC-011, STAFF-DEC-013, STAFF-DEC-014
- **Figma:** Staff Detail 13009:18226 (833x593); Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

Playwright journeys cover the rest of a member's life: open the Detail from View, edit and save, switch status and see it in the list, remove with confirmation, and open a link to a member that no longer exists.

## Acceptance criteria

- [x] View → Detail shows the seeded member's data and permission ticks
- [x] Edit (from the list and from the Detail) → change fields and permissions → Save Changes → returns to where it was opened with the new data
- [x] Status Disable → the list shows red "Disable"; Active → green "Active"; survives a reload
- [x] Remove from the list and from the Detail → confirmation → member gone after reload; Cancel keeps it
- [x] Opening `/staff/<removed id>` shows `staffMessages.api.notFound`; refresh on `/staff/:id` and `/staff/:id/edit` reopens the modal; browser back closes it
- [x] Edit parity: one invalid edit shows the shared message
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Assign / unassign (STAFF-018)

## Verification

- `e2e/tests/staff/staff-detail.spec.js`: 9 tests, all passing against the real API (whole staff suite 21 / 21): View opens the Detail with values and Granted / Not granted ticks; Edit from the list saves and returns to the list (survives reload); Edit from the Detail returns to the Detail with the new email; Edit client parity (`phone.invalid`); Edit server parity (colleague's email → `email.taken`); status Disable / Active from the Detail, shown in the list, survives reload; Remove from the list: Cancel keeps, Remove deletes (after reload too); Remove Staff from the Detail returns to the list and the old URL shows `api.notFound`; refresh on `/staff/:id` keeps the modal, Back closes it, `/staff/:id/edit` opens prefilled.
- First run: 4 failures from two page loads in a row (the second load aborted the app-start refresh after the server had rotated the token, so the session was lost: auth behaviour under DEC-028 / DEC-039, also for a real user who reloads twice within a second). The page object's `visit()` now waits for the layout before the next load. Reported as a risk, not changed (auth code).
- No production code changed in this ticket. Lint and format green (two unused test arguments fixed); Jest suites unchanged since STAFF-016 (green).
