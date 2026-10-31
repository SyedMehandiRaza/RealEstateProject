# PROP-DEC-013: Video file cleanup is added in the property branch

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-020 (completes the follow-up of PROP-DEC-009)
- **Tickets:** the video-support ticket

## Decision

- A **new** migration extends `pending_file_deletions.resource_type` to `ENUM('image', 'raw', 'video')`, with a working `down` that refuses while video rows exist. The `PendingFileDeletion` model and its tests follow.
- The Cloudinary storage uploads and destroys `resource_type: 'video'`; the fake storage, the deletion worker and the orphan job handle it, each with tests.
- Additive only: no existing migration is edited and no staff file is touched.

## Why

Without it no video or 360 tour can be uploaded, and the user chose not to wait.

## Alternatives rejected

- Wait for the integration owner: blocks the media tickets.

## Implementation note (PROP-002, 2026-10-31)

Built as migration `20261031090000-add-video-and-replaced-to-pending-file-deletions.cjs`. The same migration also adds `'replaced'` to `pending_file_deletions.reason`, because PROP-SPEC-001 (approved) queues a replaced document file with that reason and the ENUM did not have it. Both ENUMs only gain a value; nothing else in the shared table changes.
