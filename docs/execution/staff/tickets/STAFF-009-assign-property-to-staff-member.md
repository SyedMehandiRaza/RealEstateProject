# STAFF-009: Assign a property to a staff member

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-008
- **Cites:** STAFF-SPEC-001 §Endpoints E8; STAFF-DEC-005, STAFF-DEC-016
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer assigns one of their own properties to a member, also a disabled one. The updated member is returned with the new card first. A property of another developer is not found, and assigning twice is refused.

## Acceptance criteria

- [ ] POST `/api/staff/:id/properties` with `{ propertyId }` returns 201 `data.staffMember` with the property first in `assignedProperties`
- [ ] Works for a disabled member
- [ ] Validation parity: every `assignPropertyCases.invalid` case answers 422 with the same message
- [ ] Errors: property unknown or not the caller's → 404 `staffMessages.api.propertyNotFound`; already assigned → 409 `CONFLICT` with `error.message = staffMessages.api.alreadyAssigned` and no `fields`, also on a race; unknown or foreign member → 404 `staffMessages.api.notFound`
- [ ] The ownership check and the insert run in one transaction
- [ ] Permissions: an Active developer may call POST `/api/staff/:id/properties`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] `npm run check` passes

## Out of scope

- Multi-assign (STAFF-DEC-015)

## Verification

(filled when done)
