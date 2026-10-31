# PROP-011: Edit a property's details and status

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-010
- **Cites:** PROP-SPEC-001 §Endpoints #5, PROP-SPEC-001 §Service rules, PROP-DEC-015
- **Figma:** none

## What to build

From the Edit page the Developer changes the step 1–2 fields, including the status. Changing to under construction creates progress at 0%; changing back to ready to move keeps the progress and updates hidden. The possession date is only accepted while under construction.

## Acceptance criteria

- [ ] `PUT /api/properties/:id` returns 200 with the updated detail; features are replaced as a set
- [ ] Status change to `under_construction` creates a progress row at 0% when none exists and stores `possessionDate`; back to `ready_to_move` keeps the rows
- [ ] Validation parity: every invalid case of `updatePropertyCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path
- [ ] Validation: `possessionDate` with `ready_to_move` returns 422 with `propertyMessages.possessionDate.notAllowed`
- [ ] Errors: a failure part way leaves the old values and features unchanged
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Editing configurations, media and documents (their tabs)
- The page (PROP-028)

## Verification

_Filled when done._
