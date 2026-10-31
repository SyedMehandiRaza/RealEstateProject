# PROP-012: Delete a property and queue its files

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-003, PROP-010
- **Cites:** PROP-SPEC-001 §Endpoints #6, PROP-SPEC-001 §Service rules, PROP-DEC-002, PROP-DEC-016, DEC-018
- **Figma:** none

## What to build

Confirming delete in the modal removes the property and everything under it. Every Cloudinary file it owned is queued for deletion in the same transaction, and the worker deletes them after commit.

## Acceptance criteria

- [ ] `DELETE /api/properties/:id` returns 204 with no body; the property and all child rows are gone
- [ ] Every file (floor plans, media incl. videos, documents, update images) is queued in `pending_file_deletions` with reason `record_deleted` and the right resource type
- [ ] Errors: a failure part way leaves the property and no queued rows
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- 409 when another module references the property (later modules)

## Verification

_Filled when done._
