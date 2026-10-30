# PROP-Q-006: In which unit is "Total Area" entered?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Property step 2 has "Total Area" with no unit ([13009:10825](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10825); its placeholder is copied from the name field). Review & Submit shows "3 Acres" ([13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344)); configurations use "Area (sq.ft)" ([13009:10479](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10479)).

## Options

1. (recommended) A number plus a unit select: `total_area DECIMAL(12,2)` and `total_area_unit ENUM('sq_ft', 'acre')` (the two units visible in Figma). The form gets a unit dropdown (design change).
2. Always square feet (one column, no unit).
3. More units (sq m, hectare, ...): please list them.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1.
