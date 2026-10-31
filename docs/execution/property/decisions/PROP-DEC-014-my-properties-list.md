# PROP-DEC-014: My Properties list order, search, paging and empty states

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-021
- **Tickets:** list-properties API and page tickets

## Decision

- `GET /api/properties?page=&pageSize=&search=`: the signed-in owner's properties, newest first (`created_at` desc, then `id` desc).
- `search`: trimmed, max 100 characters, case-insensitive "name contains"; empty means no filter. LIKE wildcards in the text are escaped.
- `page` >= 1 (default 1), `pageSize` 1..50 (default 12). Response `meta: { page, pageSize, total }`. A page past the end answers 200 with an empty list.
- No other filters.
- Empty states: no properties at all, "You haven't listed any properties yet" with Add New Property; no search match, "No properties match "<text>"".
- Counters owned by other modules (Enquiries, Visit, Booking, Units Sold / Rent, Leads, Total Earnings) show "–" until those modules exist.

## Why

Matches the designed search and the Amenity table pager, without inventing filters.

## Alternatives rejected

- Infinite scroll: not designed. Zeros for counters: they look like real data.
