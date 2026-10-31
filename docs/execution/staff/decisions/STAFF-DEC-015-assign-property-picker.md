# STAFF-DEC-015: Assign Property opens a picker of the employer's unassigned properties

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-019
- **Tickets:** set by /to-tickets

## Decision

- "Assign Property" opens a modal "Assign Property" listing the employer's properties not yet assigned to this member (cover, name, city and state, status badge); select one and press Assign. One property per action.
- Empty picker: "All your properties are already assigned to this staff member", or "You have no properties yet" when the employer has none.
- The Assigned Property panel lists every assigned card, newest assignment first, scrolling inside the panel when it overflows.
- Unassign asks for no confirmation (assigning again restores it).

## Why

No picker frame exists; one at a time matches the single Assign button.

## Alternatives rejected

- Multi-select assign: more UI with no design.
