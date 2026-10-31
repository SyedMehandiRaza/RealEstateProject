# PROP-DEC-005: Required fields, unique names, and no drafts or approval

- **Status:** accepted (user, 2026-10-31, recommended options, confirmed final by the user in the grill, 2026-10-31)
- **Answers:** PROP-Q-014, PROP-Q-015
- **Tickets:** none yet

## Decision

- **Required** (PROP-Q-014): every field not marked optional in Figma is `NOT NULL`, including the map pin (`latitude`, `longitude`), `year_built` and `builder_name`. Optional: the "Other" document slot and the update image.
- **Unique** (PROP-Q-014): property names are not unique. Configuration names (`uq_property_configurations_property_id_name`) and amenity names (`uq_property_amenities_property_id_name`) are unique inside one property. Features are unique per property too (PROP-DEC-006).
- **No drafts, no approval** (PROP-Q-015): the 6-step wizard keeps its data in the browser; Submit creates the property and its child rows in one request and one transaction, and the property is listed at once. No listing-status column.

## Why

Figma marks only two fields optional and shows no draft, publish or approval state. Two towers can share a name, but two "2 BHK" configurations in one property would be ambiguous.

## Alternatives rejected

- Property name unique per owner: blocks legitimate duplicates.
- Draft after each step (`listing_status` draft/published, relaxed NOT NULLs) or Admin approval (pending/approved/rejected plus reviewer columns): not designed.
