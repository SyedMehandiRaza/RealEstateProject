# Property

Status: **stub**. The spec is written in the align step (`/grill-with-docs`) of `/new-module property`. Only the database draft exists so far.

## Purpose and users

A Developer lists the properties they own and manages each one: configurations (unit types), media, documents, construction progress and updates, and bookable amenities. (From the Figma page; the owner rule is PROP-Q-001.)

## Scope

### In scope (proposed)

- My Properties list, Property Detail (Overview, Update, Configuration, Documents, Amenity tabs), 6-step Add Property wizard, edit and delete.

### Out of scope (proposed, PROP-Q-003)

- CRM / leads, payments, buyers and bookings, marketing and facility tabs of Property Detail: other modules, shown here through their APIs.

## Data

- Tables: see [db.md](db.md) (DRAFT). Migration `backend/src/migrations/20261030212741-create-property-tables.cjs`.
- Data owner: the Developer account in `properties.owner_id` (ASSUMED, PROP-Q-001).
- Sensitive data: see db.md, "Personal data and retention".

## UI/design references

[figma.md](figma.md)

## Open questions and assumptions

See the board: [docs/execution/property/README.md](../../execution/property/README.md) (PROP-Q-001 to PROP-Q-016).
