# PROP-Q-014: Which property fields are required, and which names must be unique?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Only "Other (optional)" ([13009:11196](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11196)) and "Upload Image (optional)" ([13009:10615](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10615)) are marked optional. Nothing says whether a property name, a configuration name or an amenity name must be unique.

## Options

1. (recommended) Everything not marked optional is required (including the map pin, year built and builder name). Property names are not unique (two towers can share a name). Configuration names and amenity names are unique inside one property.
2. Property name unique per owner as well.
3. Some fields optional: please list them.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1.
