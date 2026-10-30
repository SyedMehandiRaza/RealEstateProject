# Staff: status

Last updated: 2026-10-31

## Now

- Database draft written (not approved, not migrated): `backend/src/migrations/20261030212742-create-staff-tables.cjs`, [db.md](../../modules/staff/db.md), [figma.md](../../modules/staff/figma.md). 3 tables.
- Depends on the property migration `20261030212741-create-property-tables.cjs` (FK `staff_property_assignments.property_id` -> `properties.id`): `feature/staff` must contain that file before `db:migrate`.
- 8 open questions (STAFF-Q-001 to STAFF-Q-008) on the [board](README.md); each has a recommended option, assumed in the draft.

## Next actions

- User answers the STAFF questions; update the migration and db.md, then approve the schema.
- STAFF-Q-001 (staff log in) needs a new `user_roles.role` value from the auth / integration owner.
- Then `/new-module staff` continues: spec (`/grill-with-docs`), `/shared-validation`, `/to-tickets`.

## Blockers

- Schema approval waits for the open questions and for the property migration being on `feature/staff`.
