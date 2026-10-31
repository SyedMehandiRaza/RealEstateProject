# PROP-021: List and view amenities with filters

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #25–26, PROP-DEC-006, PROP-DEC-020
- **Figma:** none

## What to build

The Amenity tab lists a property's bookable amenities 10 per page with search, status and category filters, and opens one with its plans.

## Acceptance criteria

- [ ] `GET …/amenities` filters by name contains (escaped), `status` and `category`, pages by 10 with meta
- [ ] `GET …/amenities/:amenityId` returns the amenity with its plans
- [ ] Validation: bad filters and pageSize return 422 with the shared `propertyMessages.query.*` message
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Booking an amenity (out of scope)
- Write routes (PROP-022)

## Verification

_Filled when done._
