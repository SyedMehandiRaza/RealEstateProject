# STAFF-DEC-001: Staff log in with their own account, linked by a nullable user_id

- **Status:** accepted (user, 2026-10-31, recommended option, confirmed final by the user 2026-10-31 (STAFF-Q-010))
- **Answers:** STAFF-Q-001
- **Tickets:** none yet

## Decision

- `staff_members` is the developer's record of the person. Add Staff sends an invitation; accepting it creates (or links) a `users` row, stored in `staff_members.user_id`. `user_id` is NULL until then.
- `fk_staff_members_users` is `ON DELETE SET NULL`: deleting the member's own account keeps the developer's staff record (and is not blocked by PROP-DEC-001, which covers only the employer).
- A disabled staff member (`status = 'disabled'`) cannot act, even with a linked account.
- `user_id` has no CHECK: MySQL rejects a CHECK on a column written by an `ON DELETE SET NULL` FK.

## Follow-up for the integration owner (not done in this change)

- A login role for staff needs a new value (for example `staff`) in `user_roles.role` (`ENUM('buyer', 'developer', 'admin')`, auth migration) and in `USER_ROLES` in `shared/src/enums/auth.enums.js`, plus the invitation flow in auth. Those are auth/shared foundations owned by the integration owner, so this change does not touch `user_roles`, the auth migration or the auth enums. `STAFF_ROLES` (`['agent']`) is the staff job role, not an account role.

## Why

Access permissions only matter if staff log in, but Add Staff has no password field, so an invitation that links an account later fits the design.

## Alternatives rejected

- Staff never log in (contact list only, `user_id` dropped): makes the permissions meaningless.
