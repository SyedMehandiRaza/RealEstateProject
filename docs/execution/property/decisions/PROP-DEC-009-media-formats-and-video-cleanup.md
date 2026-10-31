# PROP-DEC-009: Gallery media formats, order and video file cleanup

- **Status:** accepted (user, 2026-10-31, recommended options, confirmed final by the user in the grill, 2026-10-31)
- **Answers:** PROP-Q-016, PROP-Q-011
- **Tickets:** none yet

## Decision

- **Formats and sizes** (PROP-Q-016): images JPG/PNG up to 10 MB; videos and 360 tours MP4 up to 40 MB (`PROPERTY_MEDIA_TYPES`, `PROPERTY_MEDIA_MIME_TYPES`, `LIMITS.property.maxFileBytes` / `maxVideoBytes`). CHECKs tie `mime_type` and `cloudinary_resource_type` to `media_type`.
- **Order** (PROP-Q-016): gallery order is `sort_order`; the first image is the cover. No separate cover flag.
- **Visibility** (PROP-Q-016): files stay `authenticated` Cloudinary assets with short-lived signed URLs (DEC-016) until a public buyer site needs otherwise. Maximum counts per property are set in `shared/` with the upload ticket.
- **Video cleanup** (PROP-Q-011): `pending_file_deletions.resource_type` is extended to `ENUM('image', 'raw', 'video')` and `cloudinaryStorage` learns to upload and delete videos, before the media-upload ticket. `property_media.cloudinary_resource_type` already allows `video`.

## Follow-up for the integration owner (not done in this change)

- Add a new migration that extends `pending_file_deletions.resource_type` with `'video'` (plus the `PendingFileDeletion` model and its tests), and video support in `cloudinaryStorage` and the file-deletion worker. This is a shared table and shared file code, owned by the integration owner, so this change does not touch `pending_file_deletions`, its model or the auth migration.
- Until it is done, no video or 360 tour may be uploaded: deleting a property with a video row would queue `resource_type = 'video'`, which `pending_file_deletions` rejects, and the whole delete transaction would fail. The media-upload ticket is blocked by this follow-up.

## Why

These are the formats and limits Figma shows, minus the copy errors (PDF as an image, 10 MB for MP4 in the gallery modal). Private delivery keeps the DEC-016 pattern until a buyer site exists.

## Alternatives rejected

- Public (`upload`) delivery for listing media: needs a delivery-type column and is not needed before a buyer site.
- A separate cover-image flag: "first image" is enough.
- Upload videos as `raw` (PROP-Q-011 option 2): no streaming or thumbnails.
