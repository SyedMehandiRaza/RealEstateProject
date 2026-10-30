# Staff

Status: **stub**. The spec is written in the align step (`/grill-with-docs`) of `/new-module staff`. Only the database draft exists so far.

## Purpose and users

A Developer adds team members (staff) "to help manage properties, leads, and daily operations", gives each one access to some areas, and assigns properties to them. (From the Figma page; whether staff log in is STAFF-Q-001.)

## Scope

### In scope (proposed)

- Staff list, Add / Edit staff, staff detail, change status (Active / Disable), Remove, grant access permissions, assign properties.

### Out of scope (proposed)

- Leads assigned to staff ("Leads Assigned"): CRM module.
- The staff member's login and invitation flow: auth / integration owner, after STAFF-Q-001.

## Data

- Tables: see [db.md](db.md) (DRAFT). Migration `backend/src/migrations/20261030212742-create-staff-tables.cjs`.
- Depends on `users` (auth) and `properties` (property migration `20261030212741-create-property-tables.cjs`).
- Data owner: the employer account in `staff_members.employer_id` (provisional, STAFF-Q-007).
- Sensitive data: staff name, email and phone; see db.md, "Personal data and retention".

## UI/design references

[figma.md](figma.md)

## Open questions and assumptions

See the board: [docs/execution/staff/README.md](../../execution/staff/README.md). STAFF-Q-001 to STAFF-Q-008 are answered provisionally (recommended options, 2026-10-31, the user will review them) in STAFF-DEC-001 to STAFF-DEC-006; the employer deletion rule is RESTRICT (PROP-DEC-001).
