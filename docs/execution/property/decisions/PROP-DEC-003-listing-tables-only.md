# PROP-DEC-003: The property module owns only the listing tables

- **Status:** accepted (user, 2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Answers:** PROP-Q-003
- **Tickets:** none yet

## Decision

The property module's migration creates only the listing tables: `properties`, `property_configurations`, `property_configuration_floor_plans`, `property_media`, `property_documents`, `property_features`, `property_construction_progress`, `property_updates`, `property_amenities`, `property_amenity_plans`. The CRM / leads, payments, buyers and bookings, marketing and facility tabs of Property Detail, and the counters on the stat cards, belong to their own modules, which have their own tables with FKs to `properties` (`ON DELETE RESTRICT`, PROP-DEC-002). Property Detail reads that data through those modules' APIs.

## Why

The sidebar already lists CRM, Marketing, Facility Management and Subscription as modules, and a facility module exists. Building their tables here would make one very large migration and overlap with them.

## Alternatives rejected

- Build leads, bookings, payments and marketing tables in the property module now: overlaps other modules and is not needed for the listing screens.
