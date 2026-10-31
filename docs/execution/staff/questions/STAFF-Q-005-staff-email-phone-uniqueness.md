# STAFF-Q-005: Must a staff email (or phone) be unique, and in what scope?

- **Status:** answered (2026-10-31, recommended option; confirmed final by the user on 2026-10-31, grill round 1)
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Staff collects Full Name, Email and Phone Number ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)). Nothing says whether the same person can be added twice, or work for two developers.

## Options

1. (recommended) Email unique per employer (the same person can work for two developers, each with their own record); phone not unique. Email stored lowercase like `users.email`.
2. Email unique across the whole platform.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Email unique per employer (`uq_staff_members_employer_id_email`); phone not unique; email stored lowercase like `users.email`.

Decision: [STAFF-DEC-004](../decisions/STAFF-DEC-004-email-unique-per-employer.md).
