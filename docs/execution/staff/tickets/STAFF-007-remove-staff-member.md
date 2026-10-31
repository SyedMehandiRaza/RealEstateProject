# STAFF-007: Remove a staff member

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-004
- **Cites:** STAFF-SPEC-001 §Endpoints E6; STAFF-DEC-003, STAFF-DEC-013
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer removes a member for good. Their permissions and property assignments are deleted with them; the properties themselves stay.

## Acceptance criteria

- [ ] DELETE `/api/staff/:id` returns 204 with no body; the member, its permission rows and its assignment rows are gone; the properties remain
- [ ] Removing again → 404 `staffMessages.api.notFound`; another developer's member → 404 and is not deleted
- [ ] Once the developer has no staff (and no properties) the account deletion check of PROP-DEC-001 no longer blocks on staff (covered by an existing auth test or a new one in this module's tests, without changing auth code)
- [ ] Permissions: an Active developer may call DELETE `/api/staff/:id`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] Nothing about the removed member is logged
- [ ] `npm run check` passes

## Out of scope

- The confirmation modal (STAFF-014)

## Verification

(filled when done)
