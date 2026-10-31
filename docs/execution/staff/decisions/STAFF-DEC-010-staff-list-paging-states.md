# STAFF-DEC-010: Staff list is newest first, 10 per page, with no search or filter

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-013
- **Tickets:** set by /to-tickets

## Decision

- Order: `created_at` DESC, then `id` DESC (served by `idx_staff_members_employer_id_created_at`).
- Pagination: `page` and `pageSize` (the shared `paginationQuerySchema`); default 10 per page in the UI. Page controls appear only when the total is above 10. Any other query parameter is rejected.
- No search, filter or sort controls in this build.
- States: empty keeps the banner and Add Staff, and the table shows "No staff added yet"; loading shows skeleton rows; an error shows the message and a Retry button.

## Why

Figma shows no controls; a developer team is small.

## Alternatives rejected

- Search and a status filter: not designed.
