# STAFF-DEC-003: Remove Staff is a hard delete, and staff personal data lives only as long as the record

- **Status:** accepted (user, 2026-10-31, recommended options, provisional: user will review; retention adjusted to PROP-DEC-001)
- **Answers:** STAFF-Q-004, STAFF-Q-008
- **Tickets:** none yet

## Decision

- **Remove** (STAFF-Q-004): hard delete of the `staff_members` row. Its permissions and property assignments go with it (`ON DELETE CASCADE`). The linked login account loses its staff access (it is no longer referenced by any staff record). "Disable" is the reversible option. No `deleted_at`.
- Modules that reference staff later (for example leads assigned to a staff member) use `ON DELETE SET NULL` to keep their own history.
- **Retention** (STAFF-Q-008): `full_name`, `email` and `phone` are kept while the staff record exists and deleted with it on Remove; never logged. Because an account that employs staff cannot be deleted (PROP-DEC-001), the developer removes the staff records before the account goes; nothing is kept after removal.

## Why

No frame shows a staff archive, and Disable already covers "keep but stop access". Keeping third-party personal data no longer than the record is the safest default.

## Alternatives rejected

- Soft delete (`deleted_at`) for history.
- A fixed retention period after removal (audit): no period was given.
