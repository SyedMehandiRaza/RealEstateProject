# PROP-008: Create a property from the wizard in one transaction

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-003, PROP-007
- **Cites:** PROP-SPEC-001 §Endpoints #2, PROP-SPEC-001 §Service rules, PROP-DEC-005, PROP-DEC-012, PROP-DEC-017, PROP-DEC-018, PROP-DEC-023
- **Figma:** none

## What to build

When the Developer presses Submit on step 6, the whole property is created at once: details, features, configurations with floor plans, gallery in upload order, documents (status uploaded) and, when under construction, progress at 0% with the possession date. Either everything is saved or nothing is.

## Acceptance criteria

- [ ] `POST /api/properties` with a valid body returns 201 with the detail shape, and every row exists (features, configurations, floor plans, media with sort order by position, documents `uploaded`)
- [ ] An under-construction property gets a progress row at 0% with the possession date; a ready-to-move one gets none
- [ ] Validation parity: every invalid case of `createPropertyCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path
- [ ] Validation: an expired, tampered or other owner's token returns 422 at its slot path with `propertyMessages.uploadToken.invalid`; a token for the wrong purpose likewise
- [ ] Errors: a token whose file is already stored returns 409 at its path with the same message
- [ ] Errors: a failure part way (forced in the test) leaves no property row and no child row
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`

## Out of scope

- Drafts and approval (PROP-DEC-005)
- Wizard pages (PROP-026, PROP-027)

## Verification

_Filled when done._
