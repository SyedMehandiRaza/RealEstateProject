# STAFF-004: Show a staff member's detail

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-002
- **Cites:** STAFF-SPEC-001 §Endpoints E3, §Shapes; STAFF-DEC-009
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

An Active developer opens one of their staff members and gets everything the Detail shows: contact details, role, status, granted permission areas and the assigned properties as cards. Another developer's member, or an unknown id, is simply not found.

## Acceptance criteria

- [ ] GET `/api/staff/:id` returns 200 `data.staffMember` with permissions in `STAFF_PERMISSIONS` order and `assignedProperties` as PropertyCards (id, name, city, state, propertyStatus, assignedAt), newest assignment first
- [ ] No `userId`, `employerId` or image URL is returned
- [ ] Errors: unknown id or another developer's member → 404 `NOT_FOUND` with `staffMessages.api.notFound`; `id` not a positive integer → 422 `fields.id = [commonMessages.id.invalid]`
- [ ] Permissions: an Active developer may call GET `/api/staff/:id`; no token → 401 `UNAUTHORIZED`; a Buyer-only account → 403 `FORBIDDEN`; a Developer under review → 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review"); the refusal happens before validation
- [ ] `npm run check` passes

## Out of scope

- Cover image (STAFF-022)
- Leads Assigned (CRM)

## Verification

(filled when done)
