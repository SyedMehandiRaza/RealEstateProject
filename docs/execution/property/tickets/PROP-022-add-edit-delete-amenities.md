# PROP-022: Add, edit and delete amenities with plans

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-021
- **Cites:** PROP-SPEC-001 §Endpoints #27–29, PROP-DEC-020
- **Figma:** none

## What to build

The Developer adds an amenity with 1 to 5 plans, edits it (status included, plans replaced as a whole) and deletes it. Plan billing cycles must fit the pricing type, and names are unique per property.

## Acceptance criteria

- [ ] `POST …/amenities` returns 201 with plans; `PUT` returns 200 with plans replaced; `DELETE` returns 204 and removes its plans
- [ ] Validation parity: every invalid case of `createAmenityCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path; likewise `updateAmenityCases`
- [ ] Errors: a taken name (any case) returns 409 with `propertyMessages.api.amenityNameTaken` on `name`
- [ ] Errors: a failure part way through an edit leaves the old plans
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- The tab (PROP-033)

## Verification

_Filled when done._
