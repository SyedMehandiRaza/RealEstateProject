# Staff – Figma pages

File: `iREXbZTABmZigGHBpTpOnz` (Real Estate (Claude)), page "Staff management module" (node `13009:17815`).
Used by `/figma-to-module`. Status: `todo` | `in-progress` | `matches-figma` | `needs-design-answer`.
Frames read on 2026-10-31 (metadata + screenshot of every frame). Routes are proposals, not registered yet. No mobile frames exist, so every page must still be responsive (frontend rules).
Base URL for links: `https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=<id with - instead of :>`.

| Page                    | Node          | Route (proposal)  | Breakpoints in Figma | Status | Notes                                                                                                                                                                                             |
| ----------------------- | ------------- | ----------------- | -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staff Management (list) | `13009:17816` | `/staff`          | desktop 1440x832     | todo   | Banner "Add team members to help manage properties, leads, and daily operations" + Add Staff; Staff List: Name, Role, Email, Phone, Status (Active / Disable), View / Edit / Remove               |
| Add Staff (modal)       | `13009:18190` | (modal on /staff) | 546x710              | todo   | Full Name, Email, Phone Number, Role (select), Assign Access Permissions (select); Cancel, Add Staff. Also used for Edit (assumed)                                                                |
| Staff Detail (modal)    | `13009:18226` | (modal on /staff) | 833x593              | todo   | Avatar, name, role; status dropdown, Edit, Remove Staff; phone, email, status; Assigned Permissions / Access (5 areas, tick or cross); Assigned Property card (View Property) and Assign Property |
| Success: staff added    | `13009:18180` | (modal)           | 332x261              | todo   | "Successfully Added. Your new staff has been added to the staff Management." Done.                                                                                                                |

Canvas extras: `13009:18350` section label "Staff Management"; `13009:18352` a copy of the list banner without its text (not a screen).

## Shared components seen on these pages

- Sidebar and top bar, banner card with illustration, data table, status text colours, modal with close icon, select, success modal (same as property).

## Design questions

- Role and Assign Access Permissions dropdown lists are not designed (STAFF-Q-002, STAFF-Q-003); is permissions a multi-select?
- No Remove confirmation, no Edit frame, no Assign Property picker, no empty / loading / error states, no mobile frames.
- Copy: status dropdown "Acive"; list status "Disable" (stored as `disabled`).
