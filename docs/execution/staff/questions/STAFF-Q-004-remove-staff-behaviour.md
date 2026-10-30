# STAFF-Q-004: What does "Remove" / "Remove Staff" do?

- **Status:** open
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

The list has "Remove" and the detail has "Remove Staff" ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816), [13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)); there is no confirmation frame. Status can also be set to "Disable". Other modules (leads assigned to staff) may keep references.

## Options

1. (recommended) Hard delete the staff record; its permissions and property assignments go with it (CASCADE); the linked login account loses its staff role. Modules that reference staff later use `ON DELETE SET NULL` to keep their history. "Disable" is the reversible option.
2. Soft delete (`deleted_at`): the record stays for history and is hidden from the list.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/staff/db.md](../../../modules/staff/db.md)): option 1 (no `deleted_at`).
