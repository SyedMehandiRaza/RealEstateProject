# STAFF-Q-008: How long is staff personal data kept?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review)
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

`staff_members` stores a third person's full name, email and phone, entered by the developer ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)).

## Options

1. (recommended) Kept while the staff record exists; deleted with the record on Remove or when the employer account is deleted; never logged.
2. Kept for a fixed period after removal (for audit): please give the period.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1, adjusted to PROP-DEC-001. Staff personal data is kept while the staff record exists and deleted with it on Remove; never logged. Because an account that employs staff cannot be deleted (PROP-DEC-001), the developer removes the staff records before the account is deleted; nothing is kept after removal.

Decision: [STAFF-DEC-003](../decisions/STAFF-DEC-003-remove-staff-hard-delete.md).
