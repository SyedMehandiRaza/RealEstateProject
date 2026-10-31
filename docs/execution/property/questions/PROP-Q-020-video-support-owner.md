# PROP-Q-020: Who adds video support to the shared file cleanup?

- **Status:** answered (2026-10-31)
- **Blocks:** media upload of videos and 360 tours
- **Asked by:** grill round 1, 2026-10-31

## Context

`pending_file_deletions.resource_type` accepts only `image` and `raw` (PROP-DEC-009 left the change to the integration owner), so no video can be uploaded yet.

## Options

1. (recommended) Do it in feature/property: a new additive migration adds `'video'`, plus video upload/delete in the Cloudinary storage, fakes and tests. No staff file is touched.
2. Leave videos blocked until someone else does it.

## Answer

User, 2026-10-31 ("yes to all"): option 1. Recorded in [PROP-DEC-013](../decisions/PROP-DEC-013-video-cleanup-in-property-branch.md).
