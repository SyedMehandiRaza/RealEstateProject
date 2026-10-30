# STAFF-Q-001: Are staff members user accounts that log in, or only records kept by the developer?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review)
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Staff Management says "Add team members to help manage properties, leads, and daily operations" and gives each member access permissions ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816), [13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)), which only matter if they log in. Add Staff has no password field ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)). A login needs a role in `user_roles.role` (`ENUM('buyer', 'developer', 'admin')`), and the Agent role is deferred (DEC-017). This design does not change `user_roles`.

## Options

1. (recommended) Staff log in. `staff_members` is the developer's record of the person; Add Staff sends an invitation email, and accepting it creates (or links) a `users` row, stored in `staff_members.user_id`. The auth/integration owner adds a new role value (for example `staff`) to `user_roles.role` and the shared enum. A disabled staff member cannot act.
2. Staff never log in: `staff_members` is only a contact list, and permissions are informational. `user_id` would be dropped.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Staff log in. `staff_members` is the developer's record of the person; Add Staff sends an invitation, and accepting it creates (or links) a `users` row stored in `staff_members.user_id` (nullable until then). A disabled staff member cannot act. The new account role (for example `staff`) in `user_roles.role` and the shared enum is **not added in this change**: it is a follow-up for the integration owner (see STAFF-DEC-001).

Decision: [STAFF-DEC-001](../decisions/STAFF-DEC-001-staff-log-in-linked-account.md).
