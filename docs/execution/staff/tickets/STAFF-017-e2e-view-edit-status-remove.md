# STAFF-017: E2E journeys: view, edit, status change, remove

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-005, STAFF-006, STAFF-007, STAFF-014, STAFF-016
- **Cites:** STAFF-SPEC-001 §Testing Decisions; STAFF-DEC-011, STAFF-DEC-013, STAFF-DEC-014
- **Figma:** Staff Detail 13009:18226 (833x593); Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

Playwright journeys cover the rest of a member's life: open the Detail from View, edit and save, switch status and see it in the list, remove with confirmation, and open a link to a member that no longer exists.

## Acceptance criteria

- [ ] View → Detail shows the seeded member's data and permission ticks
- [ ] Edit (from the list and from the Detail) → change fields and permissions → Save Changes → returns to where it was opened with the new data
- [ ] Status Disable → the list shows red "Disable"; Active → green "Active"; survives a reload
- [ ] Remove from the list and from the Detail → confirmation → member gone after reload; Cancel keeps it
- [ ] Opening `/staff/<removed id>` shows `staffMessages.api.notFound`; refresh on `/staff/:id` and `/staff/:id/edit` reopens the modal; browser back closes it
- [ ] Edit parity: one invalid edit shows the shared message
- [ ] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Assign / unassign (STAFF-018)

## Verification

(filled when done)
