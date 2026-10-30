# Staff: status

Last updated: 2026-10-31

## Now

- Database draft (not migrated): `backend/src/migrations/20261030212742-create-staff-tables.cjs`, [db.md](../../modules/staff/db.md), [figma.md](../../modules/staff/figma.md). 3 tables.
- Depends on the property migration `20261030212741-create-property-tables.cjs` (FK `staff_property_assignments.property_id` -> `properties.id`): `feature/staff` must contain that file before `db:migrate`.
- STAFF-Q-001 to STAFF-Q-008 answered on 2026-10-31 with the recommended options, **provisionally** (the user will review each one); recorded in STAFF-DEC-001 to STAFF-DEC-006 on the [board](README.md). Exception: `staff_members.employer_id` is `ON DELETE RESTRICT`, not CASCADE, by the user's explicit answer ([PROP-DEC-001](../property/decisions/PROP-DEC-001-block-deleting-owner-accounts.md)).
- Sequelize models (`backend/src/models/staff*.model.js`), shared enums (`shared/src/enums/staff.enums.js`) and `LIMITS.staff` added, with parity tests. Unit tests pass; no MySQL test was run (MySQL login is broken).

## Next actions

- User reviews the provisional answers and gives the full staff role list (STAFF-Q-002), then approves the schema; run the migrations once MySQL works again.
- Integration owner: a staff login role in `user_roles.role` and `USER_ROLES`, plus the invitation flow (STAFF-DEC-001).
- Then `/new-module staff` continues: spec (`/grill-with-docs`), `/shared-validation`, `/to-tickets`.

## Blockers

- Migrations and integration tests wait for a working MySQL login and for the property migration being on `feature/staff`.
