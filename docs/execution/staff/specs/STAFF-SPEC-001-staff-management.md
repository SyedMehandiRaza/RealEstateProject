# STAFF-SPEC-001: Staff management

- **Status:** ready-for-agent (2026-10-31), awaiting the user's approval of the endpoints and pages
- **Module docs:** [docs/modules/staff/README.md](../../../modules/staff/README.md), [db.md](../../../modules/staff/db.md), [figma.md](../../../modules/staff/figma.md)
- **Decisions:** STAFF-DEC-001 to STAFF-DEC-018 ([board](../README.md)); cross-module PROP-DEC-001, DEC-035 (Active developer guard)

## Problem Statement

An Active developer has no place to record the people who help them run their properties. They cannot list their team, keep each member's contact details and role, note which areas each member is responsible for, or say which properties each member looks after. When someone leaves, the developer has no way to disable or remove them.

## Solution

A "Staff Management" area in the developer app (sidebar and top bar shared with the other developer modules). The developer sees their staff list, adds a member through a modal, opens a member's detail to see their permissions and assigned properties, edits them, switches them between Active and Disable, assigns or unassigns their own properties, and removes a member after a confirmation. Each developer only ever sees their own staff. Staff members do not log in yet: they are records kept by the developer (STAFF-DEC-007).

## User Stories

1. As an Active developer, I want a "Staff Management" item in the sidebar, so that I can reach my team from anywhere in the developer app.
2. As an Active developer, I want to see my staff in a table with name, role, email, phone and status, so that I have my team at a glance.
3. As an Active developer, I want the newest staff members first, so that someone I just added is at the top.
4. As an Active developer with more than 10 staff members, I want page controls, so that the list stays short.
5. As an Active developer with no staff, I want to see "No staff added yet" next to the Add Staff button, so that I know what to do first.
6. As an Active developer, I want skeleton rows while the list loads, so that the page does not jump.
7. As an Active developer, I want a message and a Retry button when the list fails to load, so that I can try again without reloading the app.
8. As an Active developer, I want to open an "Add Staff" form from the banner, so that I can add a team member.
9. As an Active developer, I want to enter full name, email, phone number, role and access permissions, so that the record is complete.
10. As an Active developer, I want to choose several access areas in one dropdown with checkboxes, so that I can grant exactly what the member needs.
11. As an Active developer, I want each invalid field to show its own message, the same message the server would give, so that I can fix it before or after sending.
12. As an Active developer, I want to type the phone number with spaces, so that I can enter it the way I read it.
13. As an Active developer, I want to be told when I already have a staff member with that email, so that I do not add the same person twice.
14. As an Active developer, I want to be stopped from adding my own email as staff, so that I do not make myself my own staff member.
15. As an Active developer, I want a "Successfully Added" confirmation after adding, so that I know it worked.
16. As an Active developer, I want to open a member's detail from "View", so that I can see everything about them.
17. As an Active developer, I want the detail to show initials in place of a photo, so that each member is still easy to recognise.
18. As an Active developer, I want the detail to show phone, email and status, so that I can contact the member.
19. As an Active developer, I want the five access areas shown with a tick or a cross, so that I see at a glance what the member is responsible for.
20. As an Active developer, I want to edit a member from the list or the detail, with the form prefilled, so that I can correct their details.
21. As an Active developer, I want to change a member's email on edit and still be told about a duplicate, so that the record stays consistent.
22. As an Active developer, I want to replace a member's access areas on edit, so that I can change their responsibilities.
23. As an Active developer, I want to switch a member between Active and Disable from the detail, saved at once, so that I can pause someone quickly.
24. As an Active developer, I want disabled members shown in red as "Disable" in the list, so that I see who is paused.
25. As an Active developer, I want to remove a member after a confirmation, so that I do not delete someone by mistake.
26. As an Active developer, I want removing a member to delete their permissions and assignments too, so that nothing is left behind.
27. As an Active developer, I want to see the properties assigned to a member as cards, so that I know what they look after.
28. As an Active developer, I want each card to show the property name, city and state, and whether it is ready to move or under construction, so that I recognise it.
29. As an Active developer, I want "View Property" on each card, so that I can jump to the property.
30. As an Active developer, I want to assign one of my properties from a picker that lists only properties not yet assigned to this member, so that I cannot assign twice.
31. As an Active developer, I want the picker to tell me when all my properties are already assigned or I have none, so that an empty list is not confusing.
32. As an Active developer, I want to unassign a property from its card, so that I can change responsibilities.
33. As an Active developer, I want to assign properties to a disabled member too, so that I can prepare their work before reactivating them.
34. As an Active developer, I want every modal (add, detail, edit) to have its own URL, so that refresh and the back button keep me where I was.
35. As an Active developer, I want "Staff member not found" when I open a link to a member that no longer exists, so that I understand what happened.
36. As an Active developer, I want the staff pages to work on a laptop, a tablet and a phone, so that I can manage my team anywhere.
37. As an Active developer, I want my staff to be invisible to other developers, so that my team's personal data stays private.
38. As a developer who is not Active yet, I want staff management to be refused with "Your account is under review", so that I know why I cannot use it.
39. As a buyer without the Developer role, I want staff routes to be refused, so that I cannot reach developer features.
40. As a logged-out visitor, I want staff pages to send me to log in, so that nothing is shown without an account.
41. As an Active developer, I want my account deletion blocked while I employ staff (PROP-DEC-001), so that staff records are never silently deleted.

## Implementation Decisions

### Modules

- **Backend staff module** (Express, the auth module's layout): routes → `validate(shared schema)` → controller → service → repository. A staff router mounted at `/api/staff` with one added line in the API router, built from `createApp`'s dependencies like auth.
- **Shared** (`@real-estate/shared`): staff schemas and messages, plus staff parity cases under the `testing` entry. Index files only gain export lines.
- **Frontend staff module**: pages, components and an RTK Query `staffApi` injected into `baseApi`; routes added with one line in the app routes.
- **Shared frontend layout**: `DeveloperLayout` (sidebar, top bar) in the shared components (STAFF-DEC-008). New shared UI pieces (modal, multi-select, confirmation modal, pagination, initials avatar) go in the shared UI folder when they are not staff-specific.
- **No change** to auth, `user_roles`, the auth migration, property code or tables. The staff module reads `properties` and `property_media` through the existing models, read-only.

### Access (every endpoint)

`authenticate` then `requireActiveDeveloper` (DEC-035), then `validate`, then the service.

| Caller                                                         | Answer                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| No or invalid access token                                     | 401 `UNAUTHORIZED`                                                     |
| Expired access token                                           | 401 `TOKEN_EXPIRED` (the client refreshes and retries)                 |
| Logged in without the Developer role (Buyer, Admin)            | 403 `FORBIDDEN`                                                        |
| Developer not Active (Under Review, Unsuccessful, no profile)  | 403 `DEVELOPER_NOT_ACTIVE` ("Your account is under review")            |
| Active developer                                               | allowed, limited to their own staff (`employer_id` = their account id) |
| Active developer, another developer's staff member or property | 404 `NOT_FOUND` (never 403: ids are not confirmed)                     |

Authorization runs before validation, so a refused caller gets 401/403 whatever it sends.

### Shapes

`StaffMemberSummary` (list rows):

```
{ id, fullName, email, phone, role, status, createdAt }
```

`StaffMember` (create, read, update, status):

```
{ id, fullName, email, phone, role, status,
  permissions: [STAFF_PERMISSIONS values, in STAFF_PERMISSIONS order],
  assignedProperties: [PropertyCard, newest assignment first],
  createdAt, updatedAt }
```

`PropertyCard`:

```
{ id, name, city, state, propertyStatus: 'ready_to_move' | 'under_construction', assignedAt? }
```

`assignedAt` is present on assigned cards only. No cover image URL in this build (see STAFF-Q-023): the UI shows a placeholder. `userId` and `employerId` are never returned.

Dates are ISO 8601 strings (UTC). Success envelope: `{ success: true, data, meta? }`. Error envelope and 422 shape: `.claude/rules/validation.md`.

### Endpoints

| #   | Method and path                                | Request                                                                                | Success                                                                                                         |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| E1  | GET `/api/staff`                               | query `page` (default 1), `pageSize` (default 10, max `LIMITS.pagination.maxPageSize`) | 200 `data: StaffMemberSummary[]`, `meta: { page, pageSize, total }`                                             |
| E2  | POST `/api/staff`                              | body `staffMemberSchema`                                                               | 201 `data: { staffMember: StaffMember }` (status `active`, no properties)                                       |
| E3  | GET `/api/staff/:id`                           | params `id`                                                                            | 200 `data: { staffMember: StaffMember }`                                                                        |
| E4  | PUT `/api/staff/:id`                           | params `id`, body `staffMemberSchema`                                                  | 200 `data: { staffMember: StaffMember }`                                                                        |
| E5  | PATCH `/api/staff/:id/status`                  | params `id`, body `staffStatusSchema`                                                  | 200 `data: { staffMember: StaffMember }`                                                                        |
| E6  | DELETE `/api/staff/:id`                        | params `id`                                                                            | 204, no body                                                                                                    |
| E7  | GET `/api/staff/:id/assignable-properties`     | params `id`                                                                            | 200 `data: { properties: PropertyCard[] }` (employer's properties not assigned to this member, by name then id) |
| E8  | POST `/api/staff/:id/properties`               | params `id`, body `assignPropertySchema`                                               | 201 `data: { staffMember: StaffMember }`                                                                        |
| E9  | DELETE `/api/staff/:id/properties/:propertyId` | params `id`, `propertyId`                                                              | 200 `data: { staffMember: StaffMember }`                                                                        |

Request schemas (shared):

- `staffMemberSchema` (E2, E4): strict body `{ fullName, email, phone, role, permissions }`. `fullName`, `email`, `phone`: same rules and limits as the auth fields (`LIMITS.staff`), with staff messages. `role`: `z.enum(STAFF_ROLES)`. `permissions`: array of `z.enum(STAFF_PERMISSIONS)`, at least 1, no duplicates (max = 5 follows). Unknown keys → `_form`.
- `staffStatusSchema` (E5): strict `{ status: z.enum(STAFF_STATUSES) }`.
- `assignPropertySchema` (E8): strict `{ propertyId }`, a positive integer.
- `staffListQuerySchema` (E1): strict `{ page, pageSize }` (the common pagination rules; any other key → 422 `_form` unknownField).
- Params: `idParamSchema` (common) for `:id`; `staffPropertyParamsSchema` `{ id, propertyId }` for E9.

Errors per endpoint (on top of the access table):

| Endpoint | Error                                                                                                                                                                                                                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1       | 422 `VALIDATION_ERROR`: `fields.page`, `fields.pageSize`, `fields._form` (unknown key)                                                                                                                                                                                                                                                              |
| E2, E4   | 422 per field (`fullName`, `email`, `phone`, `role`, `permissions`, `_form`); 409 `CONFLICT` `fields.email = [staff email taken]` when the employer already has that email (another member on E4), also when the unique index catches a race; 409 `CONFLICT` `fields.email = [cannot add yourself]` when it equals the employer's own account email |
| E3–E9    | 422 `fields.id` (or `fields.propertyId`) when not a positive integer; 404 `NOT_FOUND` for an unknown or foreign staff member                                                                                                                                                                                                                        |
| E4       | 404 as above                                                                                                                                                                                                                                                                                                                                        |
| E5       | 422 `fields.status`                                                                                                                                                                                                                                                                                                                                 |
| E6       | 404 (also when already removed)                                                                                                                                                                                                                                                                                                                     |
| E8       | 404 `NOT_FOUND` when the property does not exist or is not the employer's; 409 `CONFLICT` with `error.message = [already assigned]` (no `fields`) when already assigned, also on a race                                                                                                                                                             |
| E9       | 404 `NOT_FOUND` when the property is not assigned to this member                                                                                                                                                                                                                                                                                    |

Behaviour rules:

- Emails are compared lowercase (the schema lowercases; the DB stores lowercase).
- E2, E4: the member row and its permission rows are written in one transaction. E4 replaces the permission set (deletes the areas no longer chosen, inserts the new ones) and keeps `status` and assignments. Concurrent duplicate emails: the unique index error is mapped to the same 409 field error.
- E5 setting the same status again is a 200 with no change.
- E6 deletes the member; permissions and assignments go with it (FK CASCADE). Personal data is never logged.
- E8 checks `properties.owner_id = employer` in the service (STAFF-DEC-005), in the same transaction as the insert.
- Lists are deterministic: E1 `created_at DESC, id DESC`; assigned cards `assignedAt DESC, id DESC`; E7 `name ASC, id ASC`.
- E7 is not paginated: a developer's own properties are a short list. (Revisit if a developer can have hundreds.)

### Pages (frontend)

All inside `ProtectedRoute` (roles: developer) and `DeveloperLayout`. A Developer who is not Active gets the API's 403 `DEVELOPER_NOT_ACTIVE` message in the page's error state (the auth landing rules already send such accounts to the status screens).

| Route             | What                                                       | Figma                              |
| ----------------- | ---------------------------------------------------------- | ---------------------------------- |
| `/staff`          | Staff Management: banner + Staff List (E1)                 | 13009:17816 (1440x832)             |
| `/staff/new`      | Add Staff modal over the list (E2), then the success modal | 13009:18190 (546x710), 13009:18180 |
| `/staff/:id`      | Staff Detail modal over the list (E3, E5, E6, E7, E8, E9)  | 13009:18226 (833x593)              |
| `/staff/:id/edit` | Edit Staff modal over the list (E3 to prefill, E4)         | 13009:18190 reused                 |

Modals without a frame, built from the existing modal styles: Remove confirmation, Assign Property picker. Closing a modal (close icon, Cancel, Escape, Done) returns to `/staff`, or to `/staff/:id` when Edit was opened from the Detail.

States:

| Page / part       | Loading                            | Empty                                                                                          | Error                                                                                       |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Staff List        | 3 skeleton rows                    | "No staff added yet" in the table area; banner and Add Staff stay                              | API message (or the network message) and a Retry button                                     |
| Detail            | skeleton in the modal              | Assigned Property: "No properties assigned yet" above Assign Property                          | 404: "Staff member not found" with a Close button; other errors: message and Retry          |
| Edit              | form disabled until E3 answers     | –                                                                                              | 404: "Staff member not found"; submit errors: field errors in place, others in a form alert |
| Add / Edit submit | submit button disabled, label kept | –                                                                                              | 422/409 field errors under the fields (`applyServerErrors`), other errors in a form alert   |
| Assign picker     | skeleton list                      | "All your properties are already assigned to this staff member" / "You have no properties yet" | message and Retry; 409/404 on Assign shown in the picker's alert, list refreshed            |
| Status dropdown   | disabled while saving              | –                                                                                              | value goes back, message in the Detail alert                                                |
| Remove            | Remove button disabled             | –                                                                                              | 404: closes and refreshes the list; other errors in the confirmation modal                  |

Texts not in Figma are shared constants in `staffMessages.ui` so the UI and tests use one copy.

### Responsive rule (sizes without a frame)

- **≥ 1024 px wide**: sidebar fixed at the Figma width on the left; content fills the rest with the Figma paddings. At 1366x768 and 1280x720 the list page fits without vertical scroll for 10 rows only if the screen allows; the page scrolls vertically, never horizontally. Table columns shrink; long emails wrap (as in Figma).
- **768–1023 px**: the sidebar collapses behind a menu button in the top bar and opens as an overlay with a backdrop (Escape and backdrop click close it). The table stays a table; the Action links stay on one line.
- **< 768 px (down to 375)**: the staff table becomes one card per member (name, role, email, phone, status, then View / Edit / Remove). The banner illustration is hidden and the banner stacks.
- **Modals**: centred with the Figma width as a maximum; below that width they take the full width minus 16 px margins. When taller than the viewport (for example the 593 px Detail on 1280x720 minus chrome, or any modal at 375x667) the modal body scrolls inside and the header with the close icon stays visible. The Detail's two panels (permissions, assigned property) sit side by side from 768 px and stack below.
- No horizontal page scroll at any width from 375 px; nothing overlaps; every control stays reachable by keyboard.

## Testing Decisions

- **Seams** (the highest available, all existing): (1) the HTTP API through `createTestApp()` + supertest against the folder's `_test` database; (2) each page through React Testing Library with MSW handlers for the staff endpoints; (3) Playwright through the running frontend and the e2e API with seeded data. The schema rules are additionally tested at the shared schema seam. No new seam.
- Good tests check behaviour through those seams (status codes, bodies, what the user sees), not internals: no tests of controller or repository functions on their own unless a rule is hard to reach through HTTP.
- **Shared**: every rule of every staff schema with the exact message; staff parity cases (`staffValidationCases`) replayed by the backend parity test and the frontend form tests.
- **Backend integration** per endpoint: success; each access row (401, 403 `FORBIDDEN`, 403 `DEVELOPER_NOT_ACTIVE`); foreign and unknown ids → 404; validation parity (every staff case gives the same message in `error.fields`); 409 cases including the unique-index race; CASCADE on remove; property ownership on assign. Prior art: `backend/src/modules/auth/__tests__/*.int.test.js`, `selectCountry.int.test.js` (authorize before validate), `becomeDeveloper.int.test.js` (409 from a unique index).
- **Test data**: staff fixtures/factories that create an Active developer (with approved documents, as `e2eSeeds.seedAccount` does), staff members, and properties owned by a given developer (minimal valid `properties` rows straight through the models, since no property API exists here).
- **Frontend**: each page/modal with RTL + MSW: rendering from data, every state in the table above, client-side validation with the shared messages, server error mapping. Prior art: `frontend/src/modules/auth/pages/*/__tests__`.
- **E2E**: journeys (add → success → list; view → edit → save; status toggle; assign → unassign; remove with confirmation), client and server parity (one invalid submit per form asserting the shared message; one server-only rule: duplicate email), access (non-Active developer), visual screenshots at the Figma frame sizes and responsive screenshots at 1366x768, 1280x720, 768 and 375. Prior art: `e2e/tests/auth/`.

## Out of Scope

- Staff login, invitation email, accept page, the staff account role and permission enforcement (STAFF-DEC-007; STAFF-Q-014, integration owner).
- Property pages and API; "View Property" only links to `/properties/:id`.
- The property cover image URL (STAFF-Q-023: needs signed delivery URLs from the property or files module).
- "Leads Assigned" and the card's second "Active" (CRM).
- Search, filters, sorting controls; subscription limits; avatar photo upload.
- Other sidebar destinations (Dashboard, CRM, Marketing, Facility, Subscription, Support, Account): they show Not Found until built.

## Further Notes

- `DeveloperLayout` is a cross-module piece (STAFF-DEC-008); property and facility should reuse it.
- Merging order: staff depends on the property migration file only; no property code.
- New shared texts are additions to `staffMessages`; no new error code.
