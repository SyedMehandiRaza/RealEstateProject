# PROP-Q-008: Is the "Amenities" field of Add Property free text, a fixed list, or the bookable amenities?

- **Status:** answered (2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Property step 2 has a single "Amenities" text input ([13009:10825](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10825)); Review shows "Swimming Pool, Gym, Lift, 24x7 Water Supply" ([13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344)) and the overview lists "Amenities & Features" as bullets ([13009:7369](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7369)). Separately, the Amenity tab manages bookable amenities with prices ([13009:8335](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8335)).

## Options

1. (recommended) Separate from bookable amenities: a `property_features` table, one row per item (max 100 chars, unique per property). The form becomes a tag/chips input (design change) instead of one comma-separated string.
2. A fixed list of features (ENUM or lookup table) chosen with checkboxes.
3. The same thing as the bookable amenities of the Amenity tab.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Separate from bookable amenities: `property_features`, one row per item (max 100 characters, unique per property). The form becomes a tag/chips input (design change).

Decision: [PROP-DEC-006](../decisions/PROP-DEC-006-features-and-bookable-amenities.md).
