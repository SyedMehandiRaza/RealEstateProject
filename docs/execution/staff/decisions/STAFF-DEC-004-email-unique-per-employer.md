# STAFF-DEC-004: A staff email is unique per employer; the phone is not unique

- **Status:** accepted (user, 2026-10-31, recommended option, provisional: user will review)
- **Answers:** STAFF-Q-005
- **Tickets:** none yet

## Decision

- `uq_staff_members_employer_id_email (employer_id, email)`: one staff record per email for each employer. The same person can work for two developers, each with their own record.
- `phone` is not unique.
- `email` is stored lowercase (CHECK `chk_staff_members_email_lowercase`), with the same rules as `users.email` (`LIMITS.staff` equals the auth limits). A duplicate maps to a field error on `email` with a shared message (validation rules), not the raw MySQL text.

## Why

A developer should not add the same person twice, but staff are not exclusive to one developer.

## Alternatives rejected

- Email unique across the platform: blocks a person working for two developers.
