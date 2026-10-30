# PROP-Q-013: Is overall construction progress entered or computed, and where is the possession date entered?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Update Progress has an "Overall Progress" slider and four phase sliders (Foundation, Structure, Interior, Finishing) with Complete / In progress badges ([13009:10526](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10526)). Project Overview shows "65% Complete" and "Dec 2026 Possession Date" ([13009:7876](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7876)); no form has a possession date field.

## Options

1. (recommended) Overall is entered with its own slider and stored; the four phases are fixed; badges are derived (100 = Complete, 1-99 = In progress, 0 = none). A "Possession Date" field is added to Add Property step 2 for under-construction properties (design change); stored as a DATE, nullable.
2. Overall is the average of the four phases (no stored column, slider read-only).

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1 (`property_construction_progress`, one row per property).
