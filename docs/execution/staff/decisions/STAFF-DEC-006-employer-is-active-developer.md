# STAFF-DEC-006: The employer is an Active developer, and an account that employs staff cannot be deleted

- **Status:** accepted (user, 2026-10-31). Who adds staff is the provisional recommended option of STAFF-Q-007 (user will review); the deletion rule is the user's explicit answer, recorded in PROP-DEC-001.
- **Answers:** STAFF-Q-007
- **Tickets:** none yet

## Decision

- Only an Active developer (DEC-035 guard) adds and manages staff; `staff_members.employer_id` -> `users.id` is that account and is used for row-level authorization.
- `fk_staff_members_employer_users` is `ON DELETE RESTRICT` (not the CASCADE recommended in STAFF-Q-007). The auth user-deletion service answers 409 CONFLICT with `authMessages.api.accountHasPropertiesOrStaff` while the account employs staff. See [PROP-DEC-001](../../property/decisions/PROP-DEC-001-block-deleting-owner-accounts.md), which decides this rule for both modules.

## Why

The user chose to block the deletion of a Developer account that still has properties or staff, rather than cascade through business data and third-party personal data.

## Alternatives rejected

- `ON DELETE CASCADE` (the recommendation of STAFF-Q-007): replaced by the user's explicit answer, PROP-DEC-001.
