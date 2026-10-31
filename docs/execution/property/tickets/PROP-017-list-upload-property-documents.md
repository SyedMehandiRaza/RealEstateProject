# PROP-017: List and upload property documents

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-004, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #16–17, PROP-DEC-008, PROP-DEC-019
- **Figma:** none

## What to build

The Documents tab lists the property's documents with category and status, filterable by status and category, plus the types that can still be added. The Developer uploads one document per type, and up to 5 of type Other.

## Acceptance criteria

- [ ] `GET …/documents` returns documents with category derived from type, and `addableTypes`; filters by `status` and `category`
- [ ] `POST …/documents` returns 201 with status `uploaded`
- [ ] Validation: unknown type, bad filter and file rules return 422 with the shared message; nothing is uploaded
- [ ] Errors: a second document of a taken type returns 409 with `propertyMessages.api.documentTypeTaken`; a 6th Other returns 409 with `propertyMessages.api.documentOtherMax`
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Deleting documents and admin review (out of scope)
- Replace and URL (PROP-018)

## Verification

_Filled when done._
