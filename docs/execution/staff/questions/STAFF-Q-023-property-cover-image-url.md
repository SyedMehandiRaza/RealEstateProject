# STAFF-Q-023: How does staff get a property's cover image URL?

- **Status:** open
- **Blocks:** the cover image on the Assigned Property card and the Assign picker (a later ticket); nothing else
- **Asked by:** staff session, /to-spec, 2026-10-31

## Context

STAFF-DEC-009 shows the first image of the property as the card's cover. Property media live in Cloudinary as `cloudinary_public_id` with no stored URL; property's db.md says "the backend signs delivery URLs". No delivery-URL method exists in the storage interface on `feature/staff` (it has `newPublicId`, `upload`, `destroy`), and the property module, which owns that rule, is not built here.

## Options

1. (recommended) Show a placeholder image in this build. When property (or the files module) adds the delivery-URL method to the storage interface, a staff ticket adds `coverImageUrl` to `PropertyCard` using it.
2. The staff module adds a delivery-URL method to the shared storage interface itself (a files-module foundation change, owned by the integration owner).

## Answer

(open)
