# PROP-DEC-022: Property Detail derived values, hidden tabs and the image viewer

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-031
- **Tickets:** property detail tickets

## Decision

- **Price Range**: lowest to highest `price` of the `active` configurations (one value when equal; "–" when none is active). **Type line**: the configuration names plus the property type label (for example "2 BHK, 3 BHK · Apartment").
- **Total Units**: `properties.total_units`. Leads, Booking, Units Sold / Rent and the stat cards owned by other modules show "–" (PROP-DEC-014).
- The CRM, Payment, Buyers, Marketing and Facility tabs are **hidden** until their modules exist. Visible tabs: Overview, Update (under construction only), Configuration, Documents, Amenity.
- **Image viewer** (13009:12356): opens from the gallery or the header image, previous / next arrows, thumbnails, "n/N" counter, Esc and the close button close it, keyboard arrows move.
- Files are shown through signed URLs valid **1 hour**, returned in the API responses (DEC-016).

## Why

Showing empty tabs or zero counters would look like real data.

## Alternatives rejected

- Disabled "coming soon" tabs: not designed.
