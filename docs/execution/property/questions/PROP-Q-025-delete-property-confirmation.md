# PROP-Q-025: How is deleting a property confirmed?

- **Status:** answered (2026-10-31)
- **Blocks:** the delete-property API and UI tickets
- **Asked by:** grill round 2, 2026-10-31

## Context

No confirmation frame exists for deleting a property; the amenity delete modal ([13009:12402](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12402)) is the nearest design.

## Options

1. (recommended) Reuse the amenity delete modal ("Delete <name>?", "This action is permanent and cannot be undone"), from the card icon and the detail header; 204 then back to My Properties with a success message.
2. A typed-name confirmation.

## Answer

User, 2026-10-31 ("yes for all"): option 1. Recorded in [PROP-DEC-016](../decisions/PROP-DEC-016-delete-property-confirmation.md).
