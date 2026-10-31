# PROP-002: Support video files in storage and file deletions

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Shared foundations touched, PROP-DEC-009, PROP-DEC-013, DEC-018
- **Figma:** none

## What to build

A video uploaded to Cloudinary can later be deleted reliably like images and raw files. A new additive migration lets `pending_file_deletions.resource_type` hold `video`; storage, the fake storage, the deletion worker and the orphan job handle the video resource type. The migration is reviewed with `/db-design-review` before the ticket closes.

## Acceptance criteria

- [ ] A new migration adds `video` to the `resource_type` allowed values; `db:migrate` and `db:migrate:undo` both run on this folder's databases (never `undo:all`)
- [ ] Queuing a deletion with resource type `video` is stored and accepted; any other unknown type is rejected by the CHECK constraint
- [ ] The deletion worker destroys a queued video with resource type `video` (fake storage records the call) and removes the row
- [ ] The orphan job lists and checks video assets (`ASSET_KINDS` includes video)
- [ ] Storage upload accepts `resourceType: video`; the fake storage supports it
- [ ] `/db-design-review` run on the migration; findings fixed or recorded

## Out of scope

- Video upload endpoints (PROP-015)
- Property file references in the orphan job (PROP-003)
- Any staff table

## Verification

_Filled when done._
