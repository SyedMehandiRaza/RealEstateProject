# STAFF-002: Mount the staff API behind the Active developer guard and list staff

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-001
- **Cites:** STAFF-SPEC-001 §Access, §Endpoints E1; STAFF-DEC-006, STAFF-DEC-010
- **Figma:** Staff Management list 13009:17816 (1440x832)

## What to build

The staff API exists under /api/staff and only an Active developer can use it. GET /api/staff returns the developer's own staff members, newest first, 10 per page by default, with the total for page controls. Another developer's staff never appear.

## Acceptance criteria

- [ ] GET `/api/staff` returns 200 `data: StaffMemberSummary[]` (id, fullName, email, phone, role, status, createdAt) and `meta: { page, pageSize, total }`, only the caller's staff
- [ ] Order is `created_at` DESC then `id` DESC; default page 1, pageSize 10; `pageSize` up to the common max
- [ ] An empty list returns 200 with `data: []` and `total: 0`
- [ ] Permissions: an Active developer may call GET `/api/staff`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] Validation parity: every `staffListQueryCases.invalid` case answers 422 `VALIDATION_ERROR` with the same message in `error.fields` (including `_form` for an unknown key)
- [ ] The router is mounted with one added line in the API router; no auth file changes
- [ ] `npm run check` passes

## Out of scope

- Search, filters, sort (STAFF-DEC-010)
- The page (STAFF-012)

## Verification

(filled when done)
