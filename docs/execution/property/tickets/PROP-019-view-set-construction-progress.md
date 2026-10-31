# PROP-019: View and set construction progress

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #20–21, PROP-DEC-010, PROP-DEC-021
- **Figma:** none

## What to build

For an under-construction property the Developer sees the overall and phase percentages with badges and the possession date, and saves all five percentages at once.

## Acceptance criteria

- [ ] `GET …/progress` returns the progress shape with phase badges
- [ ] `PUT …/progress` with all five values returns 200 and the new values
- [ ] Validation parity: every invalid case of `updateProgressCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path
- [ ] Errors: either route on a ready-to-move property returns 409 with `propertyMessages.api.notUnderConstruction`
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Updates (PROP-020)
- The tab (PROP-032)

## Verification

_Filled when done._
