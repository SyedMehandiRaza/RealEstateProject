# STAFF-DEC-017: A developer cannot add their own email as staff

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-021
- **Tickets:** set by /to-tickets

## Decision

- On Add and Edit, an email equal (case-insensitively; emails are stored lowercase) to the developer's own account email answers 409 `CONFLICT` with `fields.email = ["You cannot add yourself as staff"]` (shared message). Existing error code; checked in the service against the account in the database.

## Why

The future invitation (STAFF-DEC-001) would otherwise make a developer a staff member of themselves.

## Alternatives rejected

- Allow it: harmless now, a broken state once staff log in.
