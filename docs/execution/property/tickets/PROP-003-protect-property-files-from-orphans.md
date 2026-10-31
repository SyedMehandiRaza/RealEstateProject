# PROP-003: Protect property files from the orphan cleanup job

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-001, PROP-002
- **Cites:** PROP-SPEC-001 §Shared foundations touched, DEC-018
- **Figma:** none

## What to build

The orphan cleanup job deletes Cloudinary files that no table references. After this ticket it also checks the property file tables (floor plans, media, documents, update images), so files of live properties are never deleted, while unsubmitted wizard uploads older than the grace period still are.

## Acceptance criteria

- [ ] A file referenced by a floor plan, media item, document or update image is reported as referenced and is not deleted by the job
- [ ] A staged upload under `properties/<owner>/staging` with no row is deleted after the grace period, and kept before it
- [ ] Existing verification-document behaviour is unchanged (existing orphan tests still pass)

## Out of scope

- Uploading files (PROP-007, PROP-011 onwards)

## Verification

_Filled when done._
