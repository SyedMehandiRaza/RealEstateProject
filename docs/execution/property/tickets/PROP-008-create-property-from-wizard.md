# PROP-008: Create a property from the wizard in one transaction

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-003, PROP-007
- **Cites:** PROP-SPEC-001 §Endpoints #2, PROP-SPEC-001 §Service rules, PROP-DEC-005, PROP-DEC-012, PROP-DEC-017, PROP-DEC-018, PROP-DEC-023
- **Figma:** none

## What to build

When the Developer presses Submit on step 6, the whole property is created at once: details, features, configurations with floor plans, gallery in upload order, documents (status uploaded) and, when under construction, progress at 0% with the possession date. Either everything is saved or nothing is.

## Acceptance criteria

- [x] `POST /api/properties` with a valid body returns 201 with the detail shape, and every row exists (features, configurations, floor plans, media with sort order by position, documents `uploaded`)
- [x] An under-construction property gets a progress row at 0% with the possession date; a ready-to-move one gets none
- [x] Validation parity: every invalid case of `createPropertyCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path
- [x] Validation: an expired, tampered or other owner's token returns 422 at its slot path with `propertyMessages.uploadToken.invalid`; a token for the wrong purpose likewise
- [x] Errors: a token whose file is already stored returns 409 at its path with the same message
- [x] Errors: a failure part way (forced in the test) leaves no property row and no child row
- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`

## Out of scope

- Drafts and approval (PROP-DEC-005)
- Wizard pages (PROP-026, PROP-027)

## Verification

- `POST /api/properties`: `validate(createPropertySchema)` → `service.createProperty`.
  - Each token is read with the caller as owner and its slot's purpose; any failure is 422 `uploadToken.invalid` at its path.
  - Tokens whose files are already stored (checked with the files module's reference lookup) are 409 `CONFLICT` at their paths, and a unique-key race maps the same way.
  - Then one transaction writes the property, features, configurations with floor plans, media (sort order by position), documents (`uploaded`) and, when under construction, progress at 0% with the possession date.
- The detail shape (`property.presenter.js`) is reused by PROP-010. Derived values: price range from Active configurations, cover image (the first image, signed URL), and progress with phase badges, only while under construction. DECIMAL values are sent as JSON numbers.
- Test helpers: `test/propertyUploads.js` (`stageToken`, `createBody`) stage real files through the API.
- Tests:
  - `createProperty.int.test.js`, 133 tests: the full detail response and every child row; progress only for under construction; 119 parity cases from `createPropertyCases` with the exact message at the dotted path; expired, tampered, other owner's and wrong-purpose tokens (422 at the path, no rows); an already-used token (409 at its path); a failure part way leaves no row; 401, 403 and 403 `DEVELOPER_NOT_ACTIVE`.
  - `property.presenter.test.js`, 7 unit tests for the badges, the price range and progress.
- `npm run check`: shared 687, backend unit 480, backend integration 490 passed + 1 skipped, frontend 276; lint, format and build pass.
