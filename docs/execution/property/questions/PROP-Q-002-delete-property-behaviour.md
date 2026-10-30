# PROP-Q-002: What does "Delete" on a property do: hard delete, soft delete or archive?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Property Detail has a red Delete button ([13009:7369](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7369)); no confirmation frame for property delete exists. Only the amenity delete says "This action is permanent and cannot be undone" ([13009:12402](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12402)). Other modules (CRM leads, bookings, payments) will reference properties, so deleting one may destroy their history.

## Options

1. (recommended) Hard delete. Property-owned rows (configurations, floor plans, media, documents, features, progress, updates, amenities) go with it (`ON DELETE CASCADE`); their Cloudinary files are queued in `pending_file_deletions` in the same transaction (DEC-018). Staff assignments are removed too. Modules added later (leads, bookings, payments) reference properties with `ON DELETE RESTRICT`, so a property with business history cannot be deleted and the API returns a conflict.
2. Soft delete (`deleted_at`, Sequelize paranoid): rows stay for history, every query filters them out, and unique keys must allow re-use.
3. An archive status (hidden from lists, still readable), with no delete at all.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Hard delete; property-owned rows go with it by `ON DELETE CASCADE`, their Cloudinary files are queued in `pending_file_deletions` in the same transaction (DEC-018), staff assignments are removed too. Later modules (leads, bookings, payments) reference `properties` with `ON DELETE RESTRICT`. No `deleted_at`.

Decision: [PROP-DEC-002](../decisions/PROP-DEC-002-hard-delete-properties-cascade.md).
