# Property: status

Last updated: 2026-10-31

## Now

- Database draft written (not approved, not migrated): `backend/src/migrations/20261030212741-create-property-tables.cjs`, [db.md](../../modules/property/db.md), [figma.md](../../modules/property/figma.md). 10 tables, all property tables in one migration so property and staff can be built on parallel branches.
- 16 open questions (PROP-Q-001 to PROP-Q-016) on the [board](README.md); each has a recommended option, assumed in the draft.

## Next actions

- User answers the PROP questions; update the migration and db.md, then approve the schema.
- PROP-Q-011 needs the integration owner (video support in `pending_file_deletions`) before the media-upload ticket.
- Then `/new-module property` continues: spec (`/grill-with-docs`), `/shared-validation`, `/to-tickets`.

## Blockers

- Schema approval waits for the open questions.
