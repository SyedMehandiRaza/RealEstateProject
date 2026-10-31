# STAFF-DEC-008: Staff builds the shared developer layout (sidebar and top bar)

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-011
- **Tickets:** set by /to-tickets

## Decision

- `DeveloperLayout` lives in `frontend/src/components/layout/`, built from the Staff Management frame (13009:17816): sidebar with the ten items and the active one highlighted, page title, bell, avatar.
- Working items: Staff Management (`/staff`) and Log out (the existing logout). The other items link to their future routes (`/dashboard`, `/properties`, `/crm`, `/marketing`, `/facility`, `/subscription`, `/support`, `/account`) and show the existing Not Found page until those modules exist. The bell does nothing. The avatar shows the account's initials.
- Responsive: at 1024 px and wider the sidebar is fixed on the left; below 1024 px it collapses behind a menu button in the top bar and opens as an overlay.
- The routes using it are wrapped in the existing `ProtectedRoute`.
- Cross-module: property and facility reuse this component instead of building another. The file is additive (a new folder), so merging into `testing` does not conflict; if property already built one, the second merge keeps one and the other module switches to it.

## Why

The frame needs the shell, no module has built it, and one shared layout avoids three copies.

## Alternatives rejected

- A staff-only wrapper: three copies of the same sidebar.
