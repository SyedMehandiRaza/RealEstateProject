# STAFF-011: Build the shared developer layout (sidebar and top bar)

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** None (can start immediately)
- **Cites:** STAFF-SPEC-001 §Pages, §Responsive rule; STAFF-DEC-008, STAFF-DEC-018
- **Figma:** Staff Management list 13009:17816 (1440x832): sidebar and top bar

## What to build

Every developer page gets the sidebar and top bar from Figma: the logo text, the ten menu items with the current one highlighted, Log out at the bottom, the page title, a bell and an initials avatar. On narrow screens the sidebar hides behind a menu button. Only Staff Management and Log out lead somewhere real for now.

## Acceptance criteria

- [ ] The sidebar shows Dashboard, My Properties, CRM, Marketing, Staff Management, Facility Management, Subscription, Support, Account and Log out with the Figma icons, spacing, colours and active state (tokens from `tokens.css`, assets downloaded from Figma)
- [ ] Staff Management links to `/staff` and is highlighted on any `/staff` route; the other items link to their future routes; Log out uses the existing logout and goes to Log in
- [ ] The top bar shows the page title passed by the page, the bell (no action) and the developer's initials (STAFF-DEC-018: first letters of the first and last words)
- [ ] At 1024 px and wider the sidebar is fixed on the left; below 1024 px a menu button opens it as an overlay with a backdrop; Escape, backdrop click and choosing an item close it; focus returns to the menu button
- [ ] The layout component lives with the shared components (STAFF-DEC-008) and is tested with RTL (items, active state, initials, toggle, logout)
- [ ] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [ ] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [ ] `npm run check` passes

## Out of scope

- The pages of other modules
- Notifications behind the bell

## Verification

(filled when done)
