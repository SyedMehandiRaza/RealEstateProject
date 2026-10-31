# STAFF-008: List properties a staff member can be assigned

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E7; STAFF-DEC-005, STAFF-DEC-009
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

For a given member, an Active developer gets their own properties that are not yet assigned to that member, to fill the Assign Property picker. Other developers' properties never appear.

## Acceptance criteria

- [x] GET `/api/staff/:id/assignable-properties` returns 200 `data.properties` (PropertyCards without `assignedAt`): the caller's properties minus those assigned to this member, ordered by name then id
- [x] A developer with no properties, or with all assigned, gets `[]`
- [x] Properties of other developers never appear; properties assigned to another member of the same developer do appear
- [x] Errors: unknown or foreign member → 404 `staffMessages.api.notFound`
- [x] Permissions: an Active developer may call GET `/api/staff/:id/assignable-properties`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [x] Reads property tables only; no write to any property table
- [x] `npm run check` passes

## Out of scope

- The picker (STAFF-015)
- Cover image (STAFF-022)

## Verification

- Test-first: `assignableProperties.int.test.js` was red (4 of 7 failing), then green; one more edge test added (member with no assignment).
- `backend/src/modules/staff/__tests__/assignableProperties.int.test.js`: 8 tests (own unassigned properties only, by name then id, other developers' never, colleague's assignments still listed; member with no assignment; empty when none or all assigned; no write method of `Property` called; unknown and foreign member → 404; 401 / 403 / 403).
- `npm run check`: shared 274, backend unit 454, backend integration 435 + 1 skipped, frontend 276; lint, format, build green.
