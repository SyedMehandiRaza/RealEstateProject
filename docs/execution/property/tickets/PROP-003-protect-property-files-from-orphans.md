# PROP-003: Protect property files from the orphan cleanup job

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-001, PROP-002
- **Cites:** PROP-SPEC-001 §Shared foundations touched, DEC-018
- **Figma:** none

## What to build

The orphan cleanup job deletes Cloudinary files that no table references. After this ticket it also checks the property file tables (floor plans, media, documents, update images), so files of live properties are never deleted, while unsubmitted wizard uploads older than the grace period still are.

## Acceptance criteria

- [x] A file referenced by a floor plan, media item, document or update image is reported as referenced and is not deleted by the job
- [x] A staged upload under `properties/<owner>/staging` with no row is deleted after the grace period, and kept before it
- [x] Existing verification-document behaviour is unchanged (existing orphan tests still pass)

## Out of scope

- Uploading files (PROP-007, PROP-011 onwards)

## Verification

- The orphan reference lookup now checks every table that stores a Cloudinary file: verification documents plus the 4 property file tables (floor plans, media, documents, update images). The list is `FILE_MODELS` in the files repository, and a test fails if a model with a `cloudinaryPublicId` column is missing from it.
- Tests: `backend/src/modules/files/__tests__/orphanReferences.int.test.js`, 4 tests: live property files of every resource type are kept (11 were queued before the fix); abandoned staging uploads, image and video, are queued after 24 h and a young one is kept; verification documents are still kept; the guard on the model list.
- `npm run check`: shared 687, backend unit 456, backend integration 322 passed + 1 skipped, frontend 276; lint, format and build pass.
