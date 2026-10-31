# STAFF-002: Mount the staff API behind the Active developer guard and list staff

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-001
- **Cites:** STAFF-SPEC-001 §Access, §Endpoints E1; STAFF-DEC-006, STAFF-DEC-010
- **Figma:** Staff Management list 13009:17816 (1440x832)

## What to build

The staff API exists under /api/staff and only an Active developer can use it. GET /api/staff returns the developer's own staff members, newest first, 10 per page by default, with the total for page controls. Another developer's staff never appear.

## Acceptance criteria

- [x] GET `/api/staff` returns 200 `data: StaffMemberSummary[]` (id, fullName, email, phone, role, status, createdAt) and `meta: { page, pageSize, total }`, only the caller's staff
- [x] Order is `created_at` DESC then `id` DESC; default page 1, pageSize 10; `pageSize` up to the common max
- [x] An empty list returns 200 with `data: []` and `total: 0`
- [x] Permissions: an Active developer may call GET `/api/staff`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] Validation parity: every `staffListQueryCases.invalid` case answers 422 `VALIDATION_ERROR` with the same message in `error.fields` (including `_form` for an unknown key)
- [x] The router is mounted with one added line in the API router; no auth file changes
- [x] `npm run check` passes

## Out of scope

- Search, filters, sort (STAFF-DEC-010)
- The page (STAFF-012)

## Verification

- Test-first: `listStaff.int.test.js` was red (12 failing, no route), then green.
- `backend/src/modules/staff/__tests__/listStaff.int.test.js`: 12 tests (own staff only, newest first, id tie-break, default 10 per page, page/pageSize, empty list; 401, 403 `FORBIDDEN` and 403 `DEVELOPER_NOT_ACTIVE` before validation; 5 parity cases from `staffListQueryCases`).
- Module: `backend/src/modules/staff/` (`index.js`, `staff.routes.js`, `staff.controller.js`, `staff.service.js`, `staff.repository.js`, `staff.presenter.js`); one line added in `backend/src/routes/index.js`. `meta` also carries `totalPages` (existing `paginationMeta` helper; spec updated).
- `npm run check`: shared 274, backend unit 454, backend integration 329 + 1 skipped, frontend 276; lint, format, build green.
