# PROP-002: Support video files in storage and file deletions

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Shared foundations touched, PROP-DEC-009, PROP-DEC-013, DEC-018
- **Figma:** none

## What to build

A video uploaded to Cloudinary can later be deleted reliably like images and raw files. A new additive migration lets `pending_file_deletions.resource_type` hold `video`; storage, the fake storage, the deletion worker and the orphan job handle the video resource type. The migration is reviewed with `/db-design-review` before the ticket closes.

## Acceptance criteria

- [x] A new migration adds `video` to the `resource_type` allowed values; `db:migrate` and `db:migrate:undo` both run on this folder's databases (never `undo:all`)
- [x] Queuing a deletion with resource type `video` is stored and accepted; any other unknown type is rejected by the CHECK constraint
- [x] The deletion worker destroys a queued video with resource type `video` (fake storage records the call) and removes the row
- [x] The orphan job lists and checks video assets (`ASSET_KINDS` includes video)
- [x] Storage upload accepts `resourceType: video`; the fake storage supports it
- [x] `/db-design-review` run on the migration; findings fixed or recorded

## Out of scope

- Video upload endpoints (PROP-015)
- Property file references in the orphan job (PROP-003)
- Any staff table

## Verification

- Migration `backend/src/migrations/20261031090000-add-video-and-replaced-to-pending-file-deletions.cjs` adds `video` to `resource_type` and also `replaced` to `reason`, which the spec needs for replaced documents (noted in PROP-DEC-013). Both are ENUM columns (no CHECK); MySQL refuses unknown values. `down` refuses while a row uses a new value. Ran `db:migrate` on `real_estate_property` and `real_estate_property_test`. On `real_estate_property` I ran `db:migrate:undo` and checked the columns went back, then `db:migrate` again. A video row made `down` refuse; the row was removed afterwards.
- The model `PendingFileDeletion` matches the migration. The orphan job `ASSET_KINDS` gains `video`.
- Storage `upload` and `destroy` and the fake storage already pass any `resourceType` through to Cloudinary, so they needed no change. The worker test proves a video is destroyed with `resourceType: video`.
- Tests: `pendingFileDeletion.repository.int.test.js` +2 (video and replaced are queued; MySQL refuses unknown values); `orphanCleanup.job.test.js` +1 (old videos queued); `fileDeletion.service.test.js` +1 (video destroyed).
- `/db-design-review` (by hand, against the skill checklist): no blocker. Values are appended at the end of each ENUM, so the change is metadata-only on MySQL 8. Reversible with a guard. The model matches. No applied migration was edited. `db.md` updated.
- `npm run check`: shared 687, backend unit 456, backend integration 318 passed + 1 skipped, frontend 276; lint, format and build pass.
