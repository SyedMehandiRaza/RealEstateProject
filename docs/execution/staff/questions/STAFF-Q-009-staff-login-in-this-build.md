# STAFF-Q-009: Is the staff login and invitation built in this module now?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing (the follow-up is STAFF-Q-014)
- **Asked by:** staff session, /grill-with-docs round 1, 2026-10-31

## Context

STAFF-DEC-001 says staff log in through an invitation. That needs a new account role in `user_roles` (auth migration and `USER_ROLES` in the shared auth enums), an invitation email and an accept page: auth and integration-owner files, which this session must not edit.

## Options

1. (recommended) Records only in this build: Add Staff sends no email, `user_id` stays NULL, permissions are stored and shown but not enforced (no one logs in as staff). Invitation and staff login are one blocked ticket plus a question to the integration owner.
2. Build the invitation and staff login here, editing auth and the shared auth enums.

## Answer

User, 2026-10-31: "yes" (option 1). STAFF-DEC-001 stays the target design. Decision: [STAFF-DEC-007](../decisions/STAFF-DEC-007-records-only-no-staff-login-yet.md).
