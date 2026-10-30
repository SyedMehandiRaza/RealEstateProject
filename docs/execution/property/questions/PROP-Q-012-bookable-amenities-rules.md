# PROP-Q-012: Which rules apply to the bookable amenities of the Amenity tab?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

The Amenity tab (marked "New Feature") lists Amenity Name, Category (Sports, Event, Parking), Type (Monthly, Time Based), Pricing ("$100", "$10hr/ $40day") and Status (Active) ([13009:8335](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8335)). Add/Edit ([13009:11821](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11821), [13009:11898](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11898)) have Amenity Name and Category as dropdowns (the category shows "Monthly", likely a copy error), Description, Features and a Subscription block (Plan "Basic", Billing Cycle "Month", Price, Feature); Amenity Type and image upload are hidden layers. The success modal says "Tenant and buyer can now book this amenity" ([13009:11589](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11589)); booking itself is not designed.

## Options

1. (recommended) The property module owns amenity definitions and their price plans (`property_amenities`, `property_amenity_plans`); bookings belong to a later module. Category `sports | event | parking`; pricing type `subscription | time_based`; billing cycle `hour | day | month`; several plans per amenity; name is free text unique per property; no image (hidden in Figma); status `active | inactive`; delete is permanent (as the modal says).
2. Move amenities to the facility module.
3. Different lists (categories, cycles, a fixed amenity-name list): please give them.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. The property module owns amenity definitions and price plans (`property_amenities`, `property_amenity_plans`); bookings belong to a later module. Category `sports | event | parking`; pricing type `subscription | time_based`; billing cycle `hour | day | month`; several plans per amenity; name free text, unique per property; no image; status `active | inactive`; delete is permanent.

Decision: [PROP-DEC-006](../decisions/PROP-DEC-006-features-and-bookable-amenities.md).
