# PROP-Q-001: Who owns a property, and what happens to it if the owner account is deleted?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Every frame shows "My Properties" for the signed-in account, but no frame says who may create a property or what owns it. The schema needs one owner column for row-level authorization. Frames: My Property ([13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145)), add Property ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644)).

## Options

1. (recommended) `properties.owner_id` -> `users.id`, the Developer account that created it. Only an Active developer (DEC-035 guard) can create, edit or delete. `ON DELETE RESTRICT`: an account with properties cannot be deleted until its properties are handled. Staff act on the owner's properties through the staff module (STAFF-Q-006).
2. Same owner column, `ON DELETE CASCADE`: deleting the account deletes its properties and everything under them.
3. A company/organisation table owns properties and several accounts belong to it. Needs a new table and membership rules that no frame shows.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1 (`owner_id`, RESTRICT).
