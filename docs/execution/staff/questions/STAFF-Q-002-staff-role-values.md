# STAFF-Q-002: What are the values of the staff "Role" dropdown?

- **Status:** open
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Staff has a "Role" select with no list designed ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)); every row shows "Agent" ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816)). "Agent" is also a deferred account role in the Glossary (DEC-017), which may be a naming clash.

## Options

1. (recommended) Please give the list. Until then the column is `ENUM('agent')`; adding values is a small migration plus the shared enum.
2. Drop Role and rely only on access permissions.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/staff/db.md](../../../modules/staff/db.md)): `role ENUM('agent')`.
