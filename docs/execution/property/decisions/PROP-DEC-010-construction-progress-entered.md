# PROP-DEC-010: Construction progress is entered, with a nullable possession date

- **Status:** accepted (user, 2026-10-31, recommended option, provisional: user will review)
- **Answers:** PROP-Q-013
- **Tickets:** none yet

## Decision

- `property_construction_progress` has one row per under-construction property (unique `property_id`), created by the service when a property is or becomes `under_construction`.
- `overall_percent` is entered with its own slider and stored; the four phases (`foundation`, `structure`, `interior`, `finishing`) are fixed columns, each `TINYINT UNSIGNED` 0..100 (CHECK, `LIMITS.property.percent`).
- Phase badges are derived: 100 = Complete, 1-99 = In progress, 0 = none.
- `possession_date DATE NULL`. A "Possession Date" field is added to Add Property step 2 for under-construction properties (design change).

## Why

The Update Progress modal has a separate Overall slider, and Project Overview shows a possession date that no form collects yet.

## Alternatives rejected

- Overall as the average of the four phases (no stored column, read-only slider): the design has an editable overall slider.
