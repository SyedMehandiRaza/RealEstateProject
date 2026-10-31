# PROP-012: Delete a property and queue its files

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-003, PROP-010
- **Cites:** PROP-SPEC-001 §Endpoints #6, PROP-SPEC-001 §Service rules, PROP-DEC-002, PROP-DEC-016, DEC-018
- **Figma:** none

## What to build

Confirming delete in the modal removes the property and everything under it. Every Cloudinary file it owned is queued for deletion in the same transaction, and the worker deletes them after commit.

## Acceptance criteria

- [x] `DELETE /api/properties/:id` returns 204 with no body; the property and all child rows are gone
- [x] Every file (floor plans, media incl. videos, documents, update images) is queued in `pending_file_deletions` with reason `record_deleted` and the right resource type
- [x] Errors: a failure part way leaves the property and no queued rows
- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [x] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- 409 when another module references the property (later modules)

## Verification

- `DELETE /api/properties/:id`: `:id` guard → `service.deleteProperty`. One transaction locks the property row, collects every file it owns (floor plans, media including videos, documents, update images), queues them with `fileDeletion.enqueue(..., { reason: 'record_deleted', transaction })` and deletes the property; child rows go by ON DELETE CASCADE. The answer is 204 with no body. Cloudinary is not called during the request: the worker deletes the files after commit.
- The property module now builds its own file deletion service on the injected storage, as auth does.
- Tests: `deleteProperty.int.test.js`, 7 tests: 204 with no body; every child table empty; every file queued with the right resource type (image, raw, video) and reason, and no destroy call during the request; the owner's other property and its files are untouched; a failure part way keeps the property and queues nothing; 404 for another owner and a missing id with nothing deleted; 401, 403 and 403 `DEVELOPER_NOT_ACTIVE`.
- The "409 when another module references the property" case is out of scope (later modules).
- `npm run check`: shared 687, backend unit 480, backend integration 632 passed + 1 skipped, frontend 276; lint, format and build pass.
