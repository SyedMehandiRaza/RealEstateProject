# STAFF-022: Show property cover images on the staff cards

- **Status:** blocked (waiting for STAFF-Q-023)
- **Module:** staff
- **Blocked by:** None; waiting for STAFF-Q-023
- **Cites:** STAFF-Q-023, STAFF-DEC-009
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

The Assigned Property cards and the Assign picker show the property's first image instead of the placeholder, through the delivery-URL method property or the files module provides.

## Acceptance criteria

- [ ] `PropertyCard` gets `coverImageUrl` (first image by `sort_order`, then id; null without images) from the storage delivery-URL method
- [ ] Cards and picker show it, with the placeholder when null
- [ ] No Cloudinary call inside a DB transaction; URLs are not logged
- [ ] `npm run check` passes

## Out of scope

- Building the delivery-URL method itself (property / files module)

## Verification

(filled when done)
