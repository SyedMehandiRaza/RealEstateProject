# STAFF-012: Build the Staff List page with empty, loading and error states

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-002, STAFF-011
- **Cites:** STAFF-SPEC-001 §Pages, §States, §Responsive rule; STAFF-DEC-010
- **Figma:** Staff Management list 13009:17816 (1440x832)

## What to build

At /staff an Active developer sees the banner with Add Staff and the Staff List table from Figma, filled from the API: name, role, email, phone, coloured status and the View / Edit / Remove links. Page controls appear past 10 members. Loading, empty and error states are shown as the spec says.

## Acceptance criteria

- [ ] `/staff` is registered with one added line in the app routes, behind `ProtectedRoute` (developer) and inside the developer layout with the title "Staff Management"
- [ ] Rows show labels from `staffMessages.labels` (role "Agent"; status "Active" green / "Disable" red as in Figma)
- [ ] View opens `/staff/:id`, Edit opens `/staff/:id/edit`, Remove opens the Remove confirmation (STAFF-014; until then the link navigates to `/staff/:id`), Add Staff opens `/staff/new`
- [ ] Page controls appear only when `total` > 10 and change `page`
- [ ] Empty: `staffMessages.ui.emptyList` in the table area with the banner kept; loading: 3 skeleton rows; error: the API message or `staffMessages.ui.loadFailed` with a Retry button that refetches
- [ ] A Developer not Active sees the 403 message in the error state
- [ ] Below 768 px each member is a card (name, role, email, phone, status, actions); the banner illustration is hidden
- [ ] RTK Query `staffApi` injected into `baseApi` with the list endpoint; RTL + MSW tests cover data, empty, loading, error/Retry and pagination
- [ ] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [ ] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [ ] `npm run check` passes

## Out of scope

- The modals (STAFF-013, STAFF-014)

## Verification

(filled when done)
