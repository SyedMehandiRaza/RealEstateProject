# STAFF-008: List properties a staff member can be assigned

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E7; STAFF-DEC-005, STAFF-DEC-009
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

For a given member, an Active developer gets their own properties that are not yet assigned to that member, to fill the Assign Property picker. Other developers' properties never appear.

## Acceptance criteria

- [ ] GET `/api/staff/:id/assignable-properties` returns 200 `data.properties` (PropertyCards without `assignedAt`): the caller's properties minus those assigned to this member, ordered by name then id
- [ ] A developer with no properties, or with all assigned, gets `[]`
- [ ] Properties of other developers never appear; properties assigned to another member of the same developer do appear
- [ ] Errors: unknown or foreign member → 404 `staffMessages.api.notFound`
- [ ] Permissions: an Active developer may call GET `/api/staff/:id/assignable-properties`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] Reads property tables only; no write to any property table
- [ ] `npm run check` passes

## Out of scope

- The picker (STAFF-015)
- Cover image (STAFF-022)

## Verification

(filled when done)
