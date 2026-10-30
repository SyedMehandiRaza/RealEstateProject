# STAFF-Q-008: How long is staff personal data kept?

- **Status:** open
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

`staff_members` stores a third person's full name, email and phone, entered by the developer ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)).

## Options

1. (recommended) Kept while the staff record exists; deleted with the record on Remove or when the employer account is deleted; never logged.
2. Kept for a fixed period after removal (for audit): please give the period.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/staff/db.md](../../../modules/staff/db.md)): option 1.
