# STAFF-DEC-009: Staff reads the employer's properties itself to assign them

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-012
- **Tickets:** set by /to-tickets

## Decision

- The staff module reads `properties` (and the cover image from `property_media`) read-only through the existing models. It never writes property tables and adds no property route or page.
- Endpoints (shape in the spec): list assignable properties of a staff member (the employer's properties not yet assigned to them), assign one, unassign one. A property that is not the employer's answers 404 (no hint that it exists).
- The Assigned Property card shows name, city and state, the property status badge (Ready to move / Under construction), the cover image (first image of the property by display order, or a placeholder) and "View Property", a link to `/properties/:id` (property's route; Not Found until property is merged). An "Unassign" link is added on each card (not in Figma).
- "Leads Assigned" and the second "Active" are hidden until CRM exists.
- A disabled staff member can still be assigned properties.

## Why

The assignment is staff data; reading the employer's own properties needs no property feature, and waiting for the property API would block the Detail.

## Alternatives rejected

- Wait for property's API: blocks the ticket without need.
