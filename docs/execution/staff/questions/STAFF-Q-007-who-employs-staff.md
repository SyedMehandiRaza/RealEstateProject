# STAFF-Q-007: Who can add staff, and what happens to staff if that account is deleted?

- **Status:** open
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Staff Management sits in the developer sidebar ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816)). The schema needs the owning account for authorization (`staff_members.employer_id`).

## Options

1. (recommended) Only an Active developer (DEC-035) adds and manages staff; `employer_id` -> `users.id` with `ON DELETE CASCADE` (the staff records are the developer's data and personal data of third parties, so they go with the account).
2. `ON DELETE RESTRICT`: staff must be removed first.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/staff/db.md](../../../modules/staff/db.md)): option 1.
