# STAFF-014: Build the Staff Detail modal with the status change and Remove confirmation

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-004, STAFF-006, STAFF-007, STAFF-012
- **Cites:** STAFF-SPEC-001 §Pages, §States; STAFF-DEC-011, STAFF-DEC-013, STAFF-DEC-014, STAFF-DEC-018
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

At /staff/:id the Detail modal from Figma shows the initials avatar, name, role, status dropdown, Edit, Remove Staff, the contact strip and the five permission areas with a tick or a cross. Changing the status saves at once. Remove Staff, and Remove in the list, ask for confirmation and then delete the member.

## Acceptance criteria

- [ ] Layout, colours and icons match Figma; avatar shows initials; permissions show a tick for granted areas and a red cross otherwise, in `STAFF_PERMISSIONS` order with the shared labels
- [ ] The status dropdown shows "Active" (not "Acive") and "Disable"; choosing one calls E5, disables the control while saving, updates the Detail and the list; on error it goes back and shows the message
- [ ] Edit opens `/staff/:id/edit`; closing returns to `/staff`
- [ ] Remove (Detail and list) opens a confirmation with `staffMessages.ui.removeTitle(name)` / `removeBody`, Cancel and a red Remove; confirming calls E6 and returns to the refreshed list; a 404 also closes and refreshes; other errors stay in the confirmation
- [ ] Unknown or foreign id shows `staffMessages.api.notFound` with Close; loading shows a skeleton
- [ ] The Assigned Property panel shows the cards from E3 with a placeholder cover, name, city and state, status badge and View Property (link to `/properties/:id`), or `staffMessages.ui.noPropertiesAssigned`; "Leads Assigned" and the second "Active" are not shown
- [ ] From 768 px the two panels sit side by side; below they stack; the modal body scrolls inside when taller than the viewport
- [ ] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [ ] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [ ] `npm run check` passes

## Out of scope

- Assign Property and Unassign (STAFF-015)

## Verification

(filled when done)
