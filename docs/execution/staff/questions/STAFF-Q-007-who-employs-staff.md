# STAFF-Q-007: Who can add staff, and what happens to staff if that account is deleted?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review); the deletion rule is option 2 (RESTRICT), the user's explicit answer in PROP-DEC-001
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Staff Management sits in the developer sidebar ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816)). The schema needs the owning account for authorization (`staff_members.employer_id`).

## Options

1. (recommended) Only an Active developer (DEC-035) adds and manages staff; `employer_id` -> `users.id` with `ON DELETE CASCADE` (the staff records are the developer's data and personal data of third parties, so they go with the account).
2. `ON DELETE RESTRICT`: staff must be removed first.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Who adds staff: option 1, only an Active developer (DEC-035) adds and manages staff, as `staff_members.employer_id` -> `users.id`. **What happens on account deletion: not the recommended CASCADE.** The user decided explicitly to block the delete: `employer_id` is `ON DELETE RESTRICT` (option 2), and the auth user-deletion service answers 409 CONFLICT while the account employs staff. This cross-module rule is [PROP-DEC-001](../../property/decisions/PROP-DEC-001-block-deleting-owner-accounts.md).

Decision: [STAFF-DEC-006](../decisions/STAFF-DEC-006-employer-is-active-developer.md).
