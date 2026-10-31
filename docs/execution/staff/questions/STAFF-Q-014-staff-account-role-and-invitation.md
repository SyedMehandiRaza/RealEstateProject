# STAFF-Q-014: Integration owner: the staff account role and the invitation flow

- **Status:** answered (2026-10-31): deferred to a separate integration-owner change
- **Blocks:** the staff invitation and login ticket (created by /to-tickets), until that change is planned
- **Asked by:** staff session, /grill-with-docs round 1, 2026-10-31

## Context

STAFF-DEC-001 (staff log in) is the target design, but this build stops at records (STAFF-DEC-007). Staff login needs auth and shared foundation changes that the staff session does not make: a new value in `user_roles.role` and `USER_ROLES`, an invitation email (mailer purpose), an accept-invitation page and API that creates or links the `users` row into `staff_members.user_id`, and enforcement of `staff_member_permissions` on the other modules' routes.

## Options

1. (recommended) The integration owner designs it as its own change (role name, invitation token storage and expiry, what a staff member sees after login), after property, facility and staff are merged into `testing`.
2. Drop staff login for good (STAFF-DEC-001 option 2).

## Answer

User, 2026-10-31: "ok yes" (option 1). Staff login (role, invitation, accept page, permission enforcement) is designed by the integration owner as its own change after property, facility and staff are merged into `testing`. Until then staff are records only (STAFF-DEC-007). The staff login ticket stays `blocked` on this.
