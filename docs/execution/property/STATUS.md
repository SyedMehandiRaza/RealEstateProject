# Property: status

Last updated: 2026-10-31

## Now

- Database draft (not migrated): `backend/src/migrations/20261030212741-create-property-tables.cjs`, [db.md](../../modules/property/db.md), [figma.md](../../modules/property/figma.md). 10 tables, all property tables in one migration so property and staff can be built on parallel branches.
- PROP-Q-001 to PROP-Q-016 answered on 2026-10-31 with the recommended options, **provisionally** (the user will review each one); recorded in PROP-DEC-001 to PROP-DEC-010 on the [board](README.md). The user decided explicitly that an account that owns properties or employs staff cannot be deleted (PROP-DEC-001); the auth user-deletion service now answers 409 for it.
- Sequelize models (`backend/src/models/property*.model.js`), shared enums (`shared/src/enums/property.enums.js`) and `LIMITS.property` added, with parity tests against the migration text and a model-vs-migration test. Unit tests pass; no MySQL test was run (MySQL login is broken).
- Open: PROP-Q-017 (formats of the update image), found by the review.

## Next actions

- User reviews the provisional answers, then approves the schema; run the migrations and the integration tests once MySQL works again.
- Integration owner: `'video'` in `pending_file_deletions.resource_type` and video support in `cloudinaryStorage` (PROP-DEC-009) before the media-upload ticket; a MySQL integration test for the 409 account-deletion case (PROP-DEC-001).
- Then `/new-module property` continues: spec (`/grill-with-docs`), `/shared-validation`, `/to-tickets`.

## Blockers

- Migrations and integration tests wait for a working MySQL login.
- Video and 360 tour uploads wait for the integration owner's `pending_file_deletions` change.
