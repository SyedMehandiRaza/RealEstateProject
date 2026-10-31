# Staff – Figma pages

File: `iREXbZTABmZigGHBpTpOnz` (Real Estate (Claude)), page "Staff management module" (node `13009:17815`).
Used by `/figma-to-module`. Status: `todo` | `in-progress` | `matches-figma` | `needs-design-answer`.
Frames read on 2026-10-31 (metadata + screenshot of every frame). Routes decided in STAFF-DEC-011 (not registered yet). No mobile frames exist, so every page must still be responsive (frontend rules).
Base URL for links: `https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=<id with - instead of :>`.

| Page                    | Node          | Route (proposal)                | Breakpoints in Figma | Status        | Notes                                                                                                                                                                                             |
| ----------------------- | ------------- | ------------------------------- | -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staff Management (list) | `13009:17816` | `/staff`                        | desktop 1440x832     | matches-figma | Banner "Add team members to help manage properties, leads, and daily operations" + Add Staff; Staff List: Name, Role, Email, Phone, Status (Active / Disable), View / Edit / Remove               |
| Add Staff (modal)       | `13009:18190` | `/staff/new`, `/staff/:id/edit` | 546x710              | matches-figma | Full Name, Email, Phone Number, Role (select), Assign Access Permissions (multi-select); Cancel, Add Staff. Also Edit ("Edit Staff", "Save Changes", STAFF-DEC-011)                               |
| Staff Detail (modal)    | `13009:18226` | `/staff/:id`                    | 833x593              | todo          | Avatar, name, role; status dropdown, Edit, Remove Staff; phone, email, status; Assigned Permissions / Access (5 areas, tick or cross); Assigned Property card (View Property) and Assign Property |
| Success: staff added    | `13009:18180` | (modal)                         | 332x261              | matches-figma | "Successfully Added. Your new staff has been added to the staff Management." Done.                                                                                                                |

Canvas extras: `13009:18350` section label "Staff Management"; `13009:18352` a copy of the list banner without its text (not a screen).

## Shared components seen on these pages

- Sidebar and top bar, banner card with illustration, data table, status text colours, modal with close icon, select, success modal (same as property).

## Design questions

- Role and Assign Access Permissions dropdown lists are not designed (STAFF-Q-002, STAFF-Q-003); is permissions a multi-select?
- No Remove confirmation, no Edit frame, no Assign Property picker, no empty / loading / error states, no mobile frames.
- Copy: status dropdown "Acive"; list status "Disable" (stored as `disabled`).

## Answers to the design questions (grill, 2026-10-31)

- Role: single select, "Agent" only (STAFF-Q-010). Permissions: multi-select with checkboxes, at least one (STAFF-DEC-012).
- Edit reuses the Add Staff modal (STAFF-DEC-011). Remove confirmation modal (STAFF-DEC-013). Assign Property picker modal and an "Unassign" link (STAFF-DEC-015). These three have no frame: built from the existing modal styles.
- Empty, loading and error states of the list (STAFF-DEC-010); "Staff member not found" in the Detail and Edit modals (STAFF-DEC-011).
- "Leads Assigned" and the card's second "Active" hidden until CRM exists (STAFF-DEC-009). Avatars show initials (STAFF-DEC-018).
- "Acive" shown as "Active"; list status "Disable" kept as in Figma (STAFF-DEC-014).
- Responsive rules for sizes without a frame: STAFF-SPEC-001.
- Sidebar and top bar: `frontend/src/components/layout/DeveloperLayout` (STAFF-DEC-008).

## Verification notes

- Staff Management (list) and the developer layout, 2026-10-31 (STAFF-011, STAFF-012): screenshot at 1440x832 with a mocked API compared with the Figma frame; table columns measured at Figma x positions (315, 509.75, 704.5, 899.25, 1094, 1226) and header / first row at y 423 / 494; sidebar items at 57 px steps. Responsive shots at 1366x768, 1280x720, 1024x768, 768x1024 and 375x812: no horizontal scroll, no overlap.
- Known differences (by decision): the top-bar avatar shows initials instead of the photo (STAFF-DEC-018); long emails wrap at the column edge ("...gmail.co / m" in Figma breaks after "gmail.", a browser does not break at a dot).
- The banner art is rebuilt from the Figma pieces (`frontend/src/assets/staff/banner/`, positions from get_design_context), because the whole-node exports carry an opaque page background.
- Add Staff, Edit Staff and Successfully Added, 2026-10-31 (STAFF-013): modal at 546 x 709 with Figma positions; success modal 332 wide; the permissions dropdown list (checkboxes) is not designed and follows Select.
