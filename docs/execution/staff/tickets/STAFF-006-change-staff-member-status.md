# STAFF-006: Change a staff member's status

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E5; STAFF-DEC-014
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer switches a member between Active and Disable. The change is saved at once and the updated member is returned. A disabled member keeps their permissions and properties.

## Acceptance criteria

- [x] PATCH `/api/staff/:id/status` with `{ status }` returns 200 `data.staffMember` with the new status; permissions and assignments unchanged
- [x] Setting the current status again returns 200 with no change
- [x] Validation parity: every `staffStatusCases.invalid` case answers 422 with the same message
- [x] Errors: unknown or foreign id → 404 `staffMessages.api.notFound`
- [x] Permissions: an Active developer may call PATCH `/api/staff/:id/status`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] `npm run check` passes

## Out of scope

- The dropdown (STAFF-014)

## Verification

- Test-first: `changeStaffStatus.int.test.js` was red (7 of 10 failing), then green.
- `backend/src/modules/staff/__tests__/changeStaffStatus.int.test.js`: 10 tests (disable and re-activate keeping permissions and assignments; same status → 200 no-op; unknown and foreign member → 404, foreign unchanged; 401 / 403 / 403 before validation; 4 parity cases from `staffStatusCases`).
- `npm run check`: shared 274, backend unit 454, backend integration 419 + 1 skipped, frontend 276; lint, format, build green.
