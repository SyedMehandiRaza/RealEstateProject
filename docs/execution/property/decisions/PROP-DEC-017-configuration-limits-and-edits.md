# PROP-DEC-017: Configuration and floor plan limits, edit and delete

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-026
- **Tickets:** configuration API and tab tickets

## Decision

- A property has **1 to 20** configurations: Submit needs at least one; adding a 21st answers 409 CONFLICT (`configurations.max`); deleting the last one answers 409 CONFLICT (`configurations.lastOne`, "A property needs at least one configuration").
- Floor plans are optional, **at most 10** per configuration, PDF/JPG/PNG up to 10 MB; an 11th answers 409. Each floor plan can be deleted (its file is queued for deletion).
- Add Configuration modal (13009:10479) creates with status `active`. Edit uses the same modal, prefilled, plus a Status select (Active / Inactive).
- `available_units` is entered by hand, 0..`total_units` (422 on the field otherwise).
- Delete uses the shared confirm modal (PROP-DEC-016); floor plan files of the deleted configuration are queued for deletion in the same transaction.
- Name unique per property, case-insensitive (the column collation): 409 → field error `name` with `configuration.name.taken`.

## Why

Step 3 opens with one configuration form, so a property always has one; limits keep a page and a request bounded.

## Alternatives rejected

- No minimum: a property with no unit types has no price range.
