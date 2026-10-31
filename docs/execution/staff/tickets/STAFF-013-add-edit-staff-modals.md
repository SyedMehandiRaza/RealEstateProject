# STAFF-013: Build the Add Staff and Edit Staff modals and the success modal

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-003, STAFF-005, STAFF-012
- **Cites:** STAFF-SPEC-001 §Pages, §States; STAFF-DEC-011, STAFF-DEC-012, STAFF-DEC-017
- **Figma:** Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

At /staff/new the Add Staff modal from Figma opens over the list; Add Staff saves and shows the Successfully Added modal, whose Done returns to the list. At /staff/:id/edit the same form opens prefilled as Edit Staff with Save Changes. Every field shows the shared message for client and server errors.

## Acceptance criteria

- [ ] Fields Full Name, Email, Phone Number, Role (single select, "Agent") and Assign Access Permissions (multi-select dropdown with checkboxes of the five areas; the closed field shows the chosen labels joined by commas) match Figma
- [ ] Form uses react-hook-form with `zodResolver(staffMemberSchema)`; every `staffMemberCases.invalid` case that a user can type shows its exact message under the field (frontend parity test)
- [ ] Server 409 errors (`email.taken`, `email.self`) and any 422 `fields` are shown under the field via `applyServerErrors`; other errors in a form-level alert
- [ ] Submit is disabled while saving; Cancel, the close icon and Escape close without saving
- [ ] Add success shows `staffMessages.ui.addedTitle` / `addedBody` (Figma 13009:18180); Done goes to `/staff` and the list shows the new member first
- [ ] Edit is prefilled from E3, titled "Edit Staff" with "Save Changes"; after saving it returns to where it was opened (`/staff/:id` or `/staff`) with fresh data and no success modal; 404 shows `staffMessages.api.notFound`
- [ ] Modals are full width minus 16 px below their Figma width and scroll inside when taller than the viewport, with the header visible
- [ ] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [ ] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [ ] `npm run check` passes

## Out of scope

- Status on the form (STAFF-DEC-014)

## Verification

(filled when done)
