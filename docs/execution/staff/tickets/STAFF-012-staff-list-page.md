# STAFF-012: Build the Staff List page with empty, loading and error states

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-002, STAFF-011
- **Cites:** STAFF-SPEC-001 §Pages, §States, §Responsive rule; STAFF-DEC-010
- **Figma:** Staff Management list 13009:17816 (1440x832)

## What to build

At /staff an Active developer sees the banner with Add Staff and the Staff List table from Figma, filled from the API: name, role, email, phone, coloured status and the View / Edit / Remove links. Page controls appear past 10 members. Loading, empty and error states are shown as the spec says.

## Acceptance criteria

- [x] `/staff` is registered with one added line in the app routes, behind `ProtectedRoute` (developer) and inside the developer layout with the title "Staff Management"
- [x] Rows show labels from `staffMessages.labels` (role "Agent"; status "Active" green / "Disable" red as in Figma)
- [x] View opens `/staff/:id`, Edit opens `/staff/:id/edit`, Remove opens the Remove confirmation (STAFF-014; until then the link navigates to `/staff/:id`), Add Staff opens `/staff/new`
- [x] Page controls appear only when `total` > 10 and change `page`
- [x] Empty: `staffMessages.ui.emptyList` in the table area with the banner kept; loading: 3 skeleton rows; error: the API message or `staffMessages.ui.loadFailed` with a Retry button that refetches
- [x] A Developer not Active sees the 403 message in the error state
- [x] Below 768 px each member is a card (name, role, email, phone, status, actions); the banner illustration is hidden
- [x] RTK Query `staffApi` injected into `baseApi` with the list endpoint; RTL + MSW tests cover data, empty, loading, error/Retry and pagination
- [x] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [x] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [x] `npm run check` passes

## Out of scope

- The modals (STAFF-013, STAFF-014)

## Verification

- Test-first: `StaffListPage.test.jsx` was red (module missing), then green.
- `frontend/src/modules/staff/pages/StaffListPage/__tests__/StaffListPage.test.jsx`: 9 tests (banner copy and Add Staff link; rows with shared labels and coloured status; column headers; View / Edit links and Remove button per member; request `page=1&pageSize=10` and no page controls up to 10; page controls and next page above 10; empty state with banner kept; skeleton while loading; 403 message with Retry that reloads; network failure → `ui.loadFailed`; logged-out visitor → Log in).
- Files: `modules/staff/api/staffApi.js` (`listStaff`, tag added with `enhanceEndpoints`, `baseApi` unchanged), `modules/staff/routes.jsx` (one line added in `app/routes.jsx`), `pages/StaffListPage/`, `components/StaffBannerArt.jsx` (banner art rebuilt from 30 Figma pieces in `assets/staff/banner/`), shared `components/ui/Pagination.jsx`.
- Screenshot check against Figma 13009:17816 at 1440x832 (mocked API): columns at x 315 / 509.75 / 704.5 / 899.25 / 1094 / 1226, header text y 423, first row y 494, banner text and button at Figma positions, waves and illustration as in Figma. Known differences: initials avatar (STAFF-DEC-018); long email wraps at the column edge, not after the dot.
- Responsive (shots at 1366x768, 1280x720, 1024x768, 768x1024, 375x812): no horizontal scroll, no overlap. Rule refined while building: the table becomes cards when the list card is under 860 px wide (container query), two or more per row; spec and module README updated.
- Remove opens the member's Detail until STAFF-014 adds the confirmation.
- `npm run check`: shared 274, backend unit 454, backend integration 460 + 1 skipped, frontend 296; lint, format, build green.
