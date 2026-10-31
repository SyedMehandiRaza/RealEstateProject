# STAFF-014: Build the Staff Detail modal with the status change and Remove confirmation

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-004, STAFF-006, STAFF-007, STAFF-012
- **Cites:** STAFF-SPEC-001 §Pages, §States; STAFF-DEC-011, STAFF-DEC-013, STAFF-DEC-014, STAFF-DEC-018
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

At /staff/:id the Detail modal from Figma shows the initials avatar, name, role, status dropdown, Edit, Remove Staff, the contact strip and the five permission areas with a tick or a cross. Changing the status saves at once. Remove Staff, and Remove in the list, ask for confirmation and then delete the member.

## Acceptance criteria

- [x] Layout, colours and icons match Figma; avatar shows initials; permissions show a tick for granted areas and a red cross otherwise, in `STAFF_PERMISSIONS` order with the shared labels
- [x] The status dropdown shows "Active" (not "Acive") and "Disable"; choosing one calls E5, disables the control while saving, updates the Detail and the list; on error it goes back and shows the message
- [x] Edit opens `/staff/:id/edit`; closing returns to `/staff`
- [x] Remove (Detail and list) opens a confirmation with `staffMessages.ui.removeTitle(name)` / `removeBody`, Cancel and a red Remove; confirming calls E6 and returns to the refreshed list; a 404 also closes and refreshes; other errors stay in the confirmation
- [x] Unknown or foreign id shows `staffMessages.api.notFound` with Close; loading shows a skeleton
- [x] The Assigned Property panel shows the cards from E3 with a placeholder cover, name, city and state, status badge and View Property (link to `/properties/:id`), or `staffMessages.ui.noPropertiesAssigned`; "Leads Assigned" and the second "Active" are not shown
- [x] From 768 px the two panels sit side by side; below they stack; the modal body scrolls inside when taller than the viewport
- [x] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [x] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [x] `npm run check` passes

## Out of scope

- Assign Property and Unassign (STAFF-015)

## Verification

- Test-first: `StaffDetailModal.test.jsx` was red (12 of 12 failing), then green; one more red→green cycle for "Escape closes only the top dialog" (fixed in the shared Modal with a stack of open dialogs).
- `frontend/src/modules/staff/pages/StaffDetailModal/__tests__/StaffDetailModal.test.jsx`: 14 tests (initials, name, role, contact strip, five areas with Granted / Not granted icons in shared order; property cards with location, Ready to move / Under construction badge, View Property → `/properties/:id`, no Leads Assigned; empty message; status change saves at once (PATCH body) and updates strip and dropdown; failed change keeps the old value and shows the alert; Edit carries `returnTo: /staff/:id`; Remove after confirmation returns to the list; Cancel keeps it; Escape closes only the confirmation; 404 on delete returns to the list; other delete errors stay in the confirmation; unknown member shows `api.notFound` with Close) + 1 list test (Remove from the list asks, deletes and refreshes to the empty state).
- New: `RemoveStaffModal` (shared by list and Detail), `PropertyCard` (placeholder cover, STAFF-Q-023), `Select` gained `ariaLabel` (no visible label); `changeStaffStatus` puts the returned member into the Detail cache, `removeStaff` invalidates the list.
- Screenshot check at 1440x832 (mocked API): 833 px wide, header, contact strip (y 167, 92 tall) and panels (y 299) at Figma offsets; status shown "Active" (Figma typo "Acive" fixed). 1280x720 fits; 768x1024 and 375x812: panels stack, status gets its own row, the close icon stays visible while the body scrolls; no horizontal scroll. Assumed colour for the Under construction badge (not designed).
- `npm run check`: shared 274, backend unit 454, backend integration 460 + 1 skipped, frontend 330; lint, format, build green.
