# PROP-Q-001: Who owns a property, and what happens to it if the owner account is deleted?

- **Status:** answered (2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Every frame shows "My Properties" for the signed-in account, but no frame says who may create a property or what owns it. The schema needs one owner column for row-level authorization. Frames: My Property ([13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145)), add Property ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644)).

## Options

1. (recommended) `properties.owner_id` -> `users.id`, the Developer account that created it. Only an Active developer (DEC-035 guard) can create, edit or delete. `ON DELETE RESTRICT`: an account with properties cannot be deleted until its properties are handled. Staff act on the owner's properties through the staff module (STAFF-Q-006).
2. Same owner column, `ON DELETE CASCADE`: deleting the account deletes its properties and everything under them.
3. A company/organisation table owns properties and several accounts belong to it. Needs a new table and membership rules that no frame shows.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. `properties.owner_id` -> `users.id` is the Developer account that created the property; only an Active developer (DEC-035 guard) creates, edits or deletes it. `ON DELETE RESTRICT`. The user also decided explicitly, for both property and staff: deleting a Developer account that owns properties or employs staff is **blocked**, and the auth user-deletion service answers 409 CONFLICT with a shared message instead of a raw FK error.

Decision: [PROP-DEC-001](../decisions/PROP-DEC-001-block-deleting-owner-accounts.md).
