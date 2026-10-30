# PROP-DEC-006: Listing features and bookable amenities are separate tables

- **Status:** accepted (user, 2026-10-31, recommended options, provisional: user will review)
- **Answers:** PROP-Q-008, PROP-Q-012
- **Tickets:** none yet

## Decision

- **Features** (PROP-Q-008): the "Amenities" input of Add Property step 2 ("Swimming Pool, Gym, Lift, 24x7 Water Supply") is stored in `property_features`, one row per item, `name VARCHAR(100)`, unique per property. The form becomes a tag/chips input (design change) instead of one comma-separated string.
- **Bookable amenities** (PROP-Q-012): the Amenity tab is owned by the property module as `property_amenities` and `property_amenity_plans`; bookings belong to a later module.
  - `category ENUM('sports', 'event', 'parking')`, `pricing_type ENUM('subscription', 'time_based')`, `status ENUM('active', 'inactive')` default `active`.
  - Several plans per amenity, `billing_cycle ENUM('hour', 'day', 'month')`, `price DECIMAL(12,2) >= 0`, unique (amenity, plan name, cycle). At least one plan per amenity: service rule.
  - Name is free text, unique per property. No image (hidden layer in Figma). Delete is permanent (CASCADE to its plans).
  - Lists are `AMENITY_CATEGORIES`, `AMENITY_PRICING_TYPES`, `AMENITY_STATUSES`, `AMENITY_BILLING_CYCLES` in `shared/`.

## Why

Features are descriptive bullets of a listing; bookable amenities have prices, status and (later) bookings. Mixing them would give every bullet a price and a status.

## Alternatives rejected

- A fixed feature list (ENUM or lookup) with checkboxes: not designed.
- Features and bookable amenities as one thing, or amenities in the facility module: different data and owners.
