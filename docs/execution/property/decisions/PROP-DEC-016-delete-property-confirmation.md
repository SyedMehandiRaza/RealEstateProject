# PROP-DEC-016: Deleting a property is confirmed with the amenity delete modal

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-025
- **Tickets:** delete-property API and UI tickets

## Decision

- The confirm modal reuses the "Delete GYM Amenity" design ([13009:12402](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12402)): title "Delete <property name>?", text "This action is permanent and cannot be undone.", buttons Cancel and Delete. It opens from the card's trash icon and from the detail header's Delete.
- `DELETE /api/properties/:id` answers 204; 404 when not the caller's property. In one transaction it queues every Cloudinary file of the property (floor plans, media, documents, update images) in `pending_file_deletions` and deletes the row (CASCADE, PROP-DEC-002). 409 CONFLICT is reserved for later modules that reference the property with RESTRICT.
- After success the UI goes to My Properties and shows "Property deleted".
- The same modal component confirms deleting a configuration, a gallery item, an update and an amenity.

## Why

The only delete confirmation designed; one component for every delete.

## Alternatives rejected

- Typing the name to confirm: not designed.
