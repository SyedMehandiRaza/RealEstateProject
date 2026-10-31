# STAFF-Q-004: What does "Remove" / "Remove Staff" do?

- **Status:** answered (2026-10-31, recommended option; confirmed final by the user on 2026-10-31, grill round 1)
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

The list has "Remove" and the detail has "Remove Staff" ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816), [13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)); there is no confirmation frame. Status can also be set to "Disable". Other modules (leads assigned to staff) may keep references.

## Options

1. (recommended) Hard delete the staff record; its permissions and property assignments go with it (CASCADE); the linked login account loses its staff role. Modules that reference staff later use `ON DELETE SET NULL` to keep their history. "Disable" is the reversible option.
2. Soft delete (`deleted_at`): the record stays for history and is hidden from the list.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Hard delete of the staff record; its permissions and property assignments go with it (CASCADE); the linked login account loses its staff access. Modules that reference staff later use `ON DELETE SET NULL`. "Disable" is the reversible option. No `deleted_at`.

Decision: [STAFF-DEC-003](../decisions/STAFF-DEC-003-remove-staff-hard-delete.md).
