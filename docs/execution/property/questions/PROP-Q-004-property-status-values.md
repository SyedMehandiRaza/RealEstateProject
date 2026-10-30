# PROP-Q-004: What are all the values of "Property Status"?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Property step 1 has a "Property Status" select ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644)) but its list is not designed. Badges show only "Ready to move" and "Under Construction" ([13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145)). Under Construction unlocks the Update tab and progress ([13009:7876](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7876)).

## Options

1. (recommended) Exactly two values: `ready_to_move`, `under_construction`. Adding a value later is a small migration (ENUM change) plus the shared enum.
2. More values (for example new launch, sold out): please list them.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Exactly two values: `ENUM('ready_to_move', 'under_construction')` (`PROPERTY_STATUSES` in shared).

Decision: [PROP-DEC-004](../decisions/PROP-DEC-004-listing-status-location-area-currency.md).
