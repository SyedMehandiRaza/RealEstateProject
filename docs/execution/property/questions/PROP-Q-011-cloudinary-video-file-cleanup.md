# PROP-Q-011: Can pending_file_deletions accept Cloudinary videos (resource_type video)?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`); the media-upload ticket (videos and 360 tours)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Property media includes MP4 videos and 360 tours ([13009:11051](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11051)). Cloudinary stores videos with `resource_type = 'video'`, but `pending_file_deletions.resource_type` is `ENUM('image', 'raw')` and `cloudinaryStorage` only handles image and raw (DEC-016, DEC-018). This is a change to a shared table owned by the integration owner; this design does not touch it.

## Options

1. (recommended) The integration owner adds a migration that extends `pending_file_deletions.resource_type` to `ENUM('image', 'raw', 'video')` and teaches `cloudinaryStorage` to upload and delete videos, before the media-upload ticket.
2. Upload videos as `raw` (no streaming or thumbnails, but no shared change).

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1; `property_media.cloudinary_resource_type` already allows `video`.
