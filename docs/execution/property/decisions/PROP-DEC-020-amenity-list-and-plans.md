# PROP-DEC-020: Amenity list paging and filters, and plan rules

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-029
- **Tickets:** amenity API and tab tickets

## Decision

- `GET .../amenities?page=&pageSize=&search=&status=&category=`: newest first (`created_at` desc, `id` desc), `pageSize` default **10** (max 50), name contains (same rules as PROP-DEC-014), `status` in AMENITY_STATUSES, `category` in AMENITY_CATEGORIES ("All Amenities" filter).
- Plans: **1 to 5** per amenity. `subscription` allows only `month`; `time_based` allows `hour` and `day` only. Violations are 422 on `plans.<i>.billingCycle` (`plan.billingCycle.notForPricingType`). `price` >= 0, 2 decimals. Plan name + cycle unique inside the amenity (422 on the duplicate row).
- Add shows the "New amenity added" success modal (13009:11589). Edit (13009:11898) adds a Status select; saving replaces the plans as a set. Delete uses its designed modal (13009:12402), CASCADE to plans.
- Empty states: no amenities, "No amenities yet" with Add Amenity; no match, "No amenities match your filters".
- Name unique per property, case-insensitive: 409 → field `name` with `amenity.name.taken`.

## Why

"$100" (monthly) and "$10hr / $40day" (time based) in the list show which cycles belong to which type.

## Alternatives rejected

- Any cycle for any type: a monthly time-based amenity has no meaning.
