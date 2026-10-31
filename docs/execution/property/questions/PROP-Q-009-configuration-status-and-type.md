# PROP-Q-009: What are the configuration status values, and is there a configuration "Type"?

- **Status:** answered (2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

The configuration table shows Status "Active" ([13009:9932](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-9932)); the cards show "Available". The Add Configuration modal has a hidden "Type" select ([13009:10479](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10479)).

## Options

1. (recommended) `status ENUM('active', 'inactive')`, default active; "Available" is derived from `available_units > 0`; no Type field (it is hidden in Figma).
2. A longer status list (for example sold out, coming soon): please list it.
3. Add the Type field: please list its values.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. `status ENUM('active', 'inactive')`, default `active`; "Available" is derived from `available_units > 0`; no Type field.

Decision: [PROP-DEC-007](../decisions/PROP-DEC-007-configuration-status-no-type.md).
