# PROP-011: Edit a property's details and status

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-010
- **Cites:** PROP-SPEC-001 §Endpoints #5, PROP-SPEC-001 §Service rules, PROP-DEC-015
- **Figma:** none

## What to build

From the Edit page the Developer changes the step 1–2 fields, including the status. Changing to under construction creates progress at 0%; changing back to ready to move keeps the progress and updates hidden. The possession date is only accepted while under construction.

## Acceptance criteria

- [x] `PUT /api/properties/:id` returns 200 with the updated detail; features are replaced as a set
- [x] Status change to `under_construction` creates a progress row at 0% when none exists and stores `possessionDate`; back to `ready_to_move` keeps the rows
- [x] Validation parity: every invalid case of `updatePropertyCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path
- [x] Validation: `possessionDate` with `ready_to_move` returns 422 with `propertyMessages.possessionDate.notAllowed`
- [x] Errors: a failure part way leaves the old values and features unchanged
- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [x] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Editing configurations, media and documents (their tabs)
- The page (PROP-028)

## Verification

- `PUT /api/properties/:id`: `:id` guard → `validate(updatePropertySchema)` → `service.editProperty`. One transaction locks the property row (`FOR UPDATE`), updates the columns and replaces the features as a set. When under construction, it creates progress at 0% if missing and sets or clears the possession date. On ready to move it leaves progress and updates untouched (hidden by the presenter). It answers with the detail shape.
- Tests: `editProperty.int.test.js`, 112 tests: save and features replaced; becoming under construction creates progress; back to ready to move keeps progress and updates, and switching again shows them; the possession date is cleared when absent; 103 parity cases from `updatePropertyCases` (including `possessionDate.notAllowed`); a failure part way keeps the old values; 404 for another owner and a missing id with nothing changed; 401, 403 and 403 `DEVELOPER_NOT_ACTIVE`.
- `npm run check`: shared 687, backend unit 480, backend integration 625 passed + 1 skipped, frontend 276; lint, format and build pass.
