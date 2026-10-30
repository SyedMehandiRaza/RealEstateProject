# Staff: execution board

Prefix `STAFF`. Branch `feature/staff`. Spec: [STAFF-SPEC-001](specs/). Module docs: [docs/modules/staff/](../../modules/staff/). Rules: [issue-tracker.md](../../agents/issue-tracker.md).

## Tickets

| ID  | Title | Status | Blocked by |
| --- | ----- | ------ | ---------- |

## Open questions

| ID  | Question | Blocks |
| --- | -------- | ------ |

## Answered questions

Answered 2026-10-31 with the recommended option of each question, provisionally: the user will review each one.

| ID                                                                      | Question                                                                                    | Decision                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [STAFF-Q-001](questions/STAFF-Q-001-are-staff-user-accounts.md)         | Are staff members user accounts that log in, or only records kept by the developer?         | [STAFF-DEC-001](decisions/STAFF-DEC-001-staff-log-in-linked-account.md)       |
| [STAFF-Q-002](questions/STAFF-Q-002-staff-role-values.md)               | What are the values of the staff "Role" dropdown?                                           | [STAFF-DEC-002](decisions/STAFF-DEC-002-staff-role-and-permissions.md)        |
| [STAFF-Q-003](questions/STAFF-Q-003-staff-access-permissions.md)        | Is "Assign Access Permissions" a multi-select of the five areas, with full access per area? | [STAFF-DEC-002](decisions/STAFF-DEC-002-staff-role-and-permissions.md)        |
| [STAFF-Q-004](questions/STAFF-Q-004-remove-staff-behaviour.md)          | What does "Remove" / "Remove Staff" do?                                                     | [STAFF-DEC-003](decisions/STAFF-DEC-003-remove-staff-hard-delete.md)          |
| [STAFF-Q-005](questions/STAFF-Q-005-staff-email-phone-uniqueness.md)    | Must a staff email (or phone) be unique, and in what scope?                                 | [STAFF-DEC-004](decisions/STAFF-DEC-004-email-unique-per-employer.md)         |
| [STAFF-Q-006](questions/STAFF-Q-006-staff-property-assignment-rules.md) | How are properties assigned to staff?                                                       | [STAFF-DEC-005](decisions/STAFF-DEC-005-many-to-many-property-assignments.md) |
| [STAFF-Q-007](questions/STAFF-Q-007-who-employs-staff.md)               | Who can add staff, and what happens to staff if that account is deleted?                    | [STAFF-DEC-006](decisions/STAFF-DEC-006-employer-is-active-developer.md)      |
| [STAFF-Q-008](questions/STAFF-Q-008-staff-personal-data-retention.md)   | How long is staff personal data kept?                                                       | [STAFF-DEC-003](decisions/STAFF-DEC-003-remove-staff-hard-delete.md)          |

## Decisions

| ID                                                                            | Decision                                                                                 | Answers                  |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| [STAFF-DEC-001](decisions/STAFF-DEC-001-staff-log-in-linked-account.md)       | Staff log in with their own account, linked by a nullable user_id                        | STAFF-Q-001              |
| [STAFF-DEC-002](decisions/STAFF-DEC-002-staff-role-and-permissions.md)        | Staff role is "agent" for now; permissions are a multi-select of five areas              | STAFF-Q-002, STAFF-Q-003 |
| [STAFF-DEC-003](decisions/STAFF-DEC-003-remove-staff-hard-delete.md)          | Remove Staff is a hard delete, and staff personal data lives only as long as the record  | STAFF-Q-004, STAFF-Q-008 |
| [STAFF-DEC-004](decisions/STAFF-DEC-004-email-unique-per-employer.md)         | A staff email is unique per employer; the phone is not unique                            | STAFF-Q-005              |
| [STAFF-DEC-005](decisions/STAFF-DEC-005-many-to-many-property-assignments.md) | Staff and properties are many-to-many, limited to the employer's properties              | STAFF-Q-006              |
| [STAFF-DEC-006](decisions/STAFF-DEC-006-employer-is-active-developer.md)      | The employer is an Active developer, and an account that employs staff cannot be deleted | STAFF-Q-007              |

Cross-module: [PROP-DEC-001](../property/decisions/PROP-DEC-001-block-deleting-owner-accounts.md) (an account that owns properties or employs staff cannot be deleted) decides the deletion rule of STAFF-Q-007.
