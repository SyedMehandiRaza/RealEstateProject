# STAFF-Q-021: Can a developer add their own email as staff?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing
- **Asked by:** staff session, /grill-with-docs round 3, 2026-10-31

## Context

Harmless while staff are records only (STAFF-DEC-007), but the future invitation would make a developer a staff member of themselves.

## Options

1. (recommended) Refuse: 409 CONFLICT, `fields.email = ["You cannot add yourself as staff"]`, on Add and Edit.
2. Allow it.

## Answer

User, 2026-10-31: "yes for all" (option 1). Decision: [STAFF-DEC-017](../decisions/STAFF-DEC-017-cannot-add-yourself-as-staff.md).
