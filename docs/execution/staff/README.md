# Staff: execution board

Prefix `STAFF`. Branch `feature/staff`. Spec: [STAFF-SPEC-001](specs/STAFF-SPEC-001-staff-management.md). Module docs: [docs/modules/staff/](../../modules/staff/) (module spec in [README.md](../../modules/staff/README.md)). Rules: [issue-tracker.md](../../agents/issue-tracker.md).

## Tickets

| ID  | Title | Status | Blocked by |
| --- | ----- | ------ | ---------- |

## Open questions

| ID                                                               | Question                                         | Blocks                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [STAFF-Q-023](questions/STAFF-Q-023-property-cover-image-url.md) | How does staff get a property's cover image URL? | the cover image on the Assigned Property card and the Assign picker (a later ticket); nothing else |

## Answered questions

STAFF-Q-001 to STAFF-Q-008 were answered provisionally on 2026-10-31 and confirmed final by the user the same day (STAFF-Q-010). STAFF-Q-009 to STAFF-Q-022 were answered by the user in `/grill-with-docs` rounds 1-3 (2026-10-31).

| ID                                                                           | Question                                                                                    | Decision                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [STAFF-Q-001](questions/STAFF-Q-001-are-staff-user-accounts.md)              | Are staff members user accounts that log in, or only records kept by the developer?         | [STAFF-DEC-001](decisions/STAFF-DEC-001-staff-log-in-linked-account.md)       |
| [STAFF-Q-002](questions/STAFF-Q-002-staff-role-values.md)                    | What are the values of the staff "Role" dropdown?                                           | [STAFF-DEC-002](decisions/STAFF-DEC-002-staff-role-and-permissions.md)        |
| [STAFF-Q-003](questions/STAFF-Q-003-staff-access-permissions.md)             | Is "Assign Access Permissions" a multi-select of the five areas, with full access per area? | [STAFF-DEC-002](decisions/STAFF-DEC-002-staff-role-and-permissions.md)        |
| [STAFF-Q-004](questions/STAFF-Q-004-remove-staff-behaviour.md)               | What does "Remove" / "Remove Staff" do?                                                     | [STAFF-DEC-003](decisions/STAFF-DEC-003-remove-staff-hard-delete.md)          |
| [STAFF-Q-005](questions/STAFF-Q-005-staff-email-phone-uniqueness.md)         | Must a staff email (or phone) be unique, and in what scope?                                 | [STAFF-DEC-004](decisions/STAFF-DEC-004-email-unique-per-employer.md)         |
| [STAFF-Q-006](questions/STAFF-Q-006-staff-property-assignment-rules.md)      | How are properties assigned to staff?                                                       | [STAFF-DEC-005](decisions/STAFF-DEC-005-many-to-many-property-assignments.md) |
| [STAFF-Q-007](questions/STAFF-Q-007-who-employs-staff.md)                    | Who can add staff, and what happens to staff if that account is deleted?                    | [STAFF-DEC-006](decisions/STAFF-DEC-006-employer-is-active-developer.md)      |
| [STAFF-Q-008](questions/STAFF-Q-008-staff-personal-data-retention.md)        | How long is staff personal data kept?                                                       | [STAFF-DEC-003](decisions/STAFF-DEC-003-remove-staff-hard-delete.md)          |
| [STAFF-Q-009](questions/STAFF-Q-009-staff-login-in-this-build.md)            | Is the staff login and invitation built in this module now?                                 | [STAFF-DEC-001](decisions/STAFF-DEC-001-staff-log-in-linked-account.md)       |
| [STAFF-Q-010](questions/STAFF-Q-010-confirm-provisional-decisions.md)        | Are STAFF-DEC-002 to STAFF-DEC-006 final?                                                   | [STAFF-DEC-001](decisions/STAFF-DEC-001-staff-log-in-linked-account.md)       |
| [STAFF-Q-011](questions/STAFF-Q-011-developer-app-shell.md)                  | Who builds the developer app shell (sidebar and top bar)?                                   | [STAFF-DEC-008](decisions/STAFF-DEC-008-shared-developer-layout.md)           |
| [STAFF-Q-012](questions/STAFF-Q-012-assign-property-without-property-api.md) | How does Assign Property work before the property module is merged?                         | [STAFF-DEC-009](decisions/STAFF-DEC-009-staff-reads-employer-properties.md)   |
| [STAFF-Q-013](questions/STAFF-Q-013-staff-list-paging-empty-state.md)        | How is the staff list ordered and paged, and what are its empty, loading and error states?  | [STAFF-DEC-010](decisions/STAFF-DEC-010-staff-list-paging-states.md)          |
| [STAFF-Q-014](questions/STAFF-Q-014-staff-account-role-and-invitation.md)    | Integration owner: the staff account role and the invitation flow                           | [STAFF-DEC-007](decisions/STAFF-DEC-007-records-only-no-staff-login-yet.md)   |
| [STAFF-Q-015](questions/STAFF-Q-015-staff-routes-modals-edit.md)             | How do View, Edit and Add open, and what is Edit?                                           | [STAFF-DEC-011](decisions/STAFF-DEC-011-staff-routes-modals-edit.md)          |
| [STAFF-Q-016](questions/STAFF-Q-016-staff-form-field-rules.md)               | Which Add/Edit fields are required, and what are their rules?                               | [STAFF-DEC-012](decisions/STAFF-DEC-012-staff-form-field-rules.md)            |
| [STAFF-Q-017](questions/STAFF-Q-017-remove-staff-confirmation.md)            | Does Remove ask for confirmation?                                                           | [STAFF-DEC-013](decisions/STAFF-DEC-013-remove-staff-confirmation.md)         |
| [STAFF-Q-018](questions/STAFF-Q-018-status-change-from-detail-only.md)       | How is the status changed?                                                                  | [STAFF-DEC-014](decisions/STAFF-DEC-014-status-change-from-detail-only.md)    |
| [STAFF-Q-019](questions/STAFF-Q-019-assign-property-picker.md)               | What does the Assign Property picker look like?                                             | [STAFF-DEC-015](decisions/STAFF-DEC-015-assign-property-picker.md)            |
| [STAFF-Q-020](questions/STAFF-Q-020-staff-and-assignment-limits.md)          | Is there a limit on staff or property assignments?                                          | [STAFF-DEC-016](decisions/STAFF-DEC-016-no-staff-or-assignment-limits.md)     |
| [STAFF-Q-021](questions/STAFF-Q-021-developer-own-email-as-staff.md)         | Can a developer add their own email as staff?                                               | [STAFF-DEC-017](decisions/STAFF-DEC-017-cannot-add-yourself-as-staff.md)      |
| [STAFF-Q-022](questions/STAFF-Q-022-staff-avatar-without-photo.md)           | What does the staff avatar show without a photo upload?                                     | [STAFF-DEC-018](decisions/STAFF-DEC-018-initials-avatar.md)                   |

## Decisions

| ID                                                                            | Decision                                                                                 | Answers                  |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| [STAFF-DEC-001](decisions/STAFF-DEC-001-staff-log-in-linked-account.md)       | Staff log in with their own account, linked by a nullable user_id                        | STAFF-Q-001              |
| [STAFF-DEC-002](decisions/STAFF-DEC-002-staff-role-and-permissions.md)        | Staff role is "agent" for now; permissions are a multi-select of five areas              | STAFF-Q-002, STAFF-Q-003 |
| [STAFF-DEC-003](decisions/STAFF-DEC-003-remove-staff-hard-delete.md)          | Remove Staff is a hard delete, and staff personal data lives only as long as the record  | STAFF-Q-004, STAFF-Q-008 |
| [STAFF-DEC-004](decisions/STAFF-DEC-004-email-unique-per-employer.md)         | A staff email is unique per employer; the phone is not unique                            | STAFF-Q-005              |
| [STAFF-DEC-005](decisions/STAFF-DEC-005-many-to-many-property-assignments.md) | Staff and properties are many-to-many, limited to the employer's properties              | STAFF-Q-006              |
| [STAFF-DEC-006](decisions/STAFF-DEC-006-employer-is-active-developer.md)      | The employer is an Active developer, and an account that employs staff cannot be deleted | STAFF-Q-007              |
| [STAFF-DEC-007](decisions/STAFF-DEC-007-records-only-no-staff-login-yet.md)   | This build keeps staff as records only; staff login comes later                          | STAFF-Q-009              |
| [STAFF-DEC-008](decisions/STAFF-DEC-008-shared-developer-layout.md)           | Staff builds the shared developer layout (sidebar and top bar)                           | STAFF-Q-011              |
| [STAFF-DEC-009](decisions/STAFF-DEC-009-staff-reads-employer-properties.md)   | Staff reads the employer's properties itself to assign them                              | STAFF-Q-012              |
| [STAFF-DEC-010](decisions/STAFF-DEC-010-staff-list-paging-states.md)          | Staff list is newest first, 10 per page, with no search or filter                        | STAFF-Q-013              |
| [STAFF-DEC-011](decisions/STAFF-DEC-011-staff-routes-modals-edit.md)          | Add, Detail and Edit are modals with their own URLs; Edit reuses the Add form            | STAFF-Q-015              |
| [STAFF-DEC-012](decisions/STAFF-DEC-012-staff-form-field-rules.md)            | All five Add/Edit fields are required; permissions need at least one area                | STAFF-Q-016              |
| [STAFF-DEC-013](decisions/STAFF-DEC-013-remove-staff-confirmation.md)         | Remove asks for confirmation in a small modal                                            | STAFF-Q-017              |
| [STAFF-DEC-014](decisions/STAFF-DEC-014-status-change-from-detail-only.md)    | Status changes at once from the Detail dropdown only                                     | STAFF-Q-018              |
| [STAFF-DEC-015](decisions/STAFF-DEC-015-assign-property-picker.md)            | Assign Property opens a picker of the employer's unassigned properties                   | STAFF-Q-019              |
| [STAFF-DEC-016](decisions/STAFF-DEC-016-no-staff-or-assignment-limits.md)     | No limit on staff or property assignments in this build                                  | STAFF-Q-020              |
| [STAFF-DEC-017](decisions/STAFF-DEC-017-cannot-add-yourself-as-staff.md)      | A developer cannot add their own email as staff                                          | STAFF-Q-021              |
| [STAFF-DEC-018](decisions/STAFF-DEC-018-initials-avatar.md)                   | Avatars show initials; no photo upload                                                   | STAFF-Q-022              |

Cross-module: [PROP-DEC-001](../property/decisions/PROP-DEC-001-block-deleting-owner-accounts.md) (an account that owns properties or employs staff cannot be deleted) decides the deletion rule of STAFF-Q-007. STAFF-DEC-008 (shared `DeveloperLayout`) and STAFF-DEC-009 (staff reads `properties` read-only) concern property and facility too.
