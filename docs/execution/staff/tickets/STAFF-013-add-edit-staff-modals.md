# STAFF-013: Build the Add Staff and Edit Staff modals and the success modal

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-003, STAFF-005, STAFF-012
- **Cites:** STAFF-SPEC-001 §Pages, §States; STAFF-DEC-011, STAFF-DEC-012, STAFF-DEC-017
- **Figma:** Add Staff 13009:18190 (546x710); success 13009:18180 (332x261)

## What to build

At /staff/new the Add Staff modal from Figma opens over the list; Add Staff saves and shows the Successfully Added modal, whose Done returns to the list. At /staff/:id/edit the same form opens prefilled as Edit Staff with Save Changes. Every field shows the shared message for client and server errors.

## Acceptance criteria

- [x] Fields Full Name, Email, Phone Number, Role (single select, "Agent") and Assign Access Permissions (multi-select dropdown with checkboxes of the five areas; the closed field shows the chosen labels joined by commas) match Figma
- [x] Form uses react-hook-form with `zodResolver(staffMemberSchema)`; every `staffMemberCases.invalid` case that a user can type shows its exact message under the field (frontend parity test)
- [x] Server 409 errors (`email.taken`, `email.self`) and any 422 `fields` are shown under the field via `applyServerErrors`; other errors in a form-level alert
- [x] Submit is disabled while saving; Cancel, the close icon and Escape close without saving
- [x] Add success shows `staffMessages.ui.addedTitle` / `addedBody` (Figma 13009:18180); Done goes to `/staff` and the list shows the new member first
- [x] Edit is prefilled from E3, titled "Edit Staff" with "Save Changes"; after saving it returns to where it was opened (`/staff/:id` or `/staff`) with fresh data and no success modal; 404 shows `staffMessages.api.notFound`
- [x] Modals are full width minus 16 px below their Figma width and scroll inside when taller than the viewport, with the header visible
- [x] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [x] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [x] `npm run check` passes

## Out of scope

- Status on the form (STAFF-DEC-014)

## Verification

- Test-first: `StaffFormModal.test.jsx` was red (21 of 21 failing), then green.
- `frontend/src/modules/staff/pages/StaffFormModal/__tests__/StaffFormModal.test.jsx`: 21 tests. Add: Figma fields, placeholders and buttons over the list; empty submit shows the five required messages and sends nothing; 8 typed `staffMemberCases` show their exact shared message (client parity); multi-select joins labels in shared order and toggles; valid submit posts the normalized body, shows Successfully Added, Done returns to the list; server 409 `email.taken` / `email.self` under Email (server parity); 500 in the form alert; submit disabled while saving; Cancel, close icon and Escape close without saving. Edit: prefilled from GET, PUT body, returns to the list with no success modal; returns to `/staff/:id` when opened from the Detail (`state.returnTo`); 404 shows `api.notFound`.
- New shared UI: `components/ui/Modal.jsx` (dialog, Escape unless a control handled it, focus in and back, fixed header with scrolling body) and `components/ui/MultiSelect.jsx` (multi-select combobox with checkboxes, Select's look). `TextInput` / `Select` borders read `--field-border-color` (default unchanged) so the staff form uses the lighter Figma border.
- Screenshot check (mocked API): Add Staff at 1440x832 is 546 x 709 with title, labels, inputs and buttons at Figma y positions (44 / 97 / 116 / 628); success modal 332 wide as 13009:18180 ("Done." as in Figma); 1280x720 keeps the header and scrolls the form inside; 375x812 full width minus 16 px; no horizontal scroll.
- `npm run check`: shared 274, backend unit 454, backend integration 460 + 1 skipped, frontend 317; lint, format, build green.
