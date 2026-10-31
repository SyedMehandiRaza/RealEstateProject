# STAFF-006: Change a staff member's status

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E5; STAFF-DEC-014
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer switches a member between Active and Disable. The change is saved at once and the updated member is returned. A disabled member keeps their permissions and properties.

## Acceptance criteria

- [ ] PATCH `/api/staff/:id/status` with `{ status }` returns 200 `data.staffMember` with the new status; permissions and assignments unchanged
- [ ] Setting the current status again returns 200 with no change
- [ ] Validation parity: every `staffStatusCases.invalid` case answers 422 with the same message
- [ ] Errors: unknown or foreign id → 404 `staffMessages.api.notFound`
- [ ] Permissions: an Active developer may call PATCH `/api/staff/:id/status`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] `npm run check` passes

## Out of scope

- The dropdown (STAFF-014)

## Verification

(filled when done)
