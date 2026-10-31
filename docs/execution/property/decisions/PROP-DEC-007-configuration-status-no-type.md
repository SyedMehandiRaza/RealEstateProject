# PROP-DEC-007: Configuration status is active / inactive, with no Type field

- **Status:** accepted (user, 2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Answers:** PROP-Q-009
- **Tickets:** none yet

## Decision

`property_configurations.status ENUM('active', 'inactive')`, default `active` (`CONFIGURATION_STATUSES`). The "Available" badge is derived from `available_units > 0`, not stored. The hidden "Type" select of Add Configuration is not modelled. `available_units <= total_units` and `total_units >= 1` are CHECKs.

## Why

Only "Active" and "Available" are visible, and the Type select is a hidden layer.

## Alternatives rejected

- A longer status list (sold out, coming soon) or a Type field: no values are designed.
