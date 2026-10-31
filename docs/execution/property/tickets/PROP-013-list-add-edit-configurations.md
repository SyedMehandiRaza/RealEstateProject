# PROP-013: List, add and edit configurations

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #7–9, PROP-DEC-007, PROP-DEC-017
- **Figma:** none

## What to build

The Configuration tab lists a property's configurations in created order with their floor plans, and the Developer adds or edits one (name, area, price, units, available units, and status when editing). Names are unique per property, ignoring case, and a property holds at most 20.

## Acceptance criteria

- [ ] `GET …/configurations` returns them in created order with `isAvailable` and floor plans (signed URLs)
- [ ] `POST …/configurations` returns 201; `PUT …/configurations/:configurationId` returns 200 including status
- [ ] Validation parity: every invalid case of `createConfigurationCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path; likewise `updateConfigurationCases`
- [ ] Errors: a name taken in the same property (any case) returns 409 with `propertyMessages.api.configurationNameTaken` on `name`
- [ ] Errors: adding a 21st returns 409 with `propertyMessages.api.configurationsMax`; two racing adds at 19 leave 20 (row lock)
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Delete and floor plans (PROP-014)
- The tab (PROP-030)

## Verification

_Filled when done._
