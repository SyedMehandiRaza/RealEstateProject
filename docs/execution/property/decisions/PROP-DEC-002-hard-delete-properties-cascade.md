# PROP-DEC-002: Deleting a property is a hard delete that cascades to its own rows

- **Status:** accepted (user, 2026-10-31, recommended option, provisional: user will review)
- **Answers:** PROP-Q-002
- **Tickets:** none yet

## Decision

- Delete removes the `properties` row. Every property-owned table references it with `ON DELETE CASCADE`: configurations (and through them floor plans), media, documents, features, construction progress, updates, amenities (and through them amenity plans), and the staff module's `staff_property_assignments`.
- Before deleting, the service collects every Cloudinary file of the rows that will go (floor plans, media, documents, update images) and queues them in `pending_file_deletions` in the same transaction (DEC-018). The same applies when one configuration, update, media or document row is deleted.
- No soft delete: no `deleted_at`, no `paranoid`.
- Modules added later (leads, bookings, payments) reference `properties` with `ON DELETE RESTRICT`, so a property with business history cannot be deleted and the API answers 409 CONFLICT.

## Why

The amenity delete frame says "permanent and cannot be undone", nothing in Figma shows an archive or a trash, and a hard delete keeps every query and unique key simple. RESTRICT from later modules protects business history without soft delete.

## Alternatives rejected

- Soft delete (`deleted_at`): every query must filter, and the unique keys (configuration name, amenity name) must allow re-use.
- An archive status with no delete: not designed.
