# STAFF-DEC-012: All five Add/Edit fields are required; permissions need at least one area

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-016
- **Tickets:** set by /to-tickets

## Decision

- Full Name: required, trimmed, 2-100 characters (auth `fullName` rule).
- Email: required, trimmed, lowercase, max 254, email format (auth rule); unique per employer: a duplicate answers 409 `CONFLICT` with `fields.email = ["A staff member with this email already exists"]` (shared message), also when the DB unique index catches a race.
- Phone Number: required, auth rule (international format, spaces allowed while typing, stored without spaces, max 16 stored); shown as stored.
- Role: required, single select of `STAFF_ROLES` ("Agent").
- Assign Access Permissions: required, a multi-select dropdown with checkboxes of the five `STAFF_PERMISSIONS`, at least one, no duplicates; the closed field shows the chosen labels joined by commas.
- Unknown body keys are rejected (`z.strictObject`).

## Why

Every field in Figma is a plain input with no optional marker; a staff member with no area has no purpose.

## Alternatives rejected

- Permissions optional (zero areas): would show five red crosses with nothing to do.
