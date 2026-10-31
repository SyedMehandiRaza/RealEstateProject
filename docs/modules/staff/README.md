# Staff

Status: **specified** (grill done 2026-10-31, `/grill-with-docs` rounds 1-3, all answers from the user). API contract: [STAFF-SPEC-001](../../execution/staff/specs/STAFF-SPEC-001-staff-management.md). Decisions: STAFF-DEC-001 to STAFF-DEC-018 on the [board](../../execution/staff/README.md).

## Purpose and users

An **Active developer** (DEC-035) keeps a list of the team members (**staff members**) who help manage their properties, leads and daily operations. For each member the developer records contact details and a role, grants access to some of five areas, assigns some of their own properties, and can disable or remove the member.

In this build staff members are **records only**: they do not log in, no invitation is sent and their permissions are not enforced anywhere (STAFF-DEC-007). Staff login is the target design (STAFF-DEC-001), waiting for the integration owner (STAFF-Q-014).

**What staff are (user, 2026-10-31):** staff are the developer's employees who will manage this panel on behalf of the property owner. The permissions and property assignments say what each one may manage once they can log in.

## Who may do what

- Every staff route requires a logged-in **Active developer** (`authenticate` + `requireActiveDeveloper`): no token → 401; not a Developer → 403 `FORBIDDEN`; a Developer not Active → 403 `DEVELOPER_NOT_ACTIVE` (STAFF-DEC-006).
- A developer sees and changes **only their own** staff members (`employer_id` = their account). Another developer's member answers 404 `NOT_FOUND`, never 403, so ids are not confirmed.
- Properties: only the developer's own properties (`properties.owner_id`) can be listed for assignment or assigned; any other property answers 404 (STAFF-DEC-005, STAFF-DEC-009).

## Behaviour

### Staff list (`/staff`, frame 13009:17816)

- Inside the shared `DeveloperLayout` (sidebar + top bar, STAFF-DEC-008).
- Banner with "Add Staff". Table: Name, Role, Email, Phone, Status (green "Active" / red "Disable"), Action (View / Edit / Remove).
- Newest first (`created_at` DESC, `id` DESC); 10 per page; page controls only when there are more than 10. No search, filter or sort (STAFF-DEC-010).
- Empty: "No staff added yet" in the table area. Loading: skeleton rows. Error: message + Retry.

### Add Staff (`/staff/new`, frame 13009:18190) and Edit Staff (`/staff/:id/edit`)

- Modal over the list. Fields, all required (STAFF-DEC-012): Full Name (2-100 after trim), Email (lowercase, max 254, format), Phone Number (international format, spaces allowed while typing, stored without spaces), Role (single select: Agent), Assign Access Permissions (multi-select with checkboxes of the five areas, at least one; the closed field shows the chosen labels joined by commas).
- Email unique per developer (STAFF-DEC-004): duplicate → 409 with a field error on Email. The developer's own email → 409 with "You cannot add yourself as staff" (STAFF-DEC-017).
- Add: status starts `active`; on success the "Successfully Added" modal (13009:18180); Done returns to the list.
- Edit: the same form titled "Edit Staff", button "Save Changes", prefilled; every field editable; permissions replaced as a set; returns to where it was opened with fresh data, no success modal (STAFF-DEC-011). Status is not on this form.

### Staff Detail (`/staff/:id`, frame 13009:18226)

- Initials avatar (STAFF-DEC-018), name, role; status dropdown (Active / Disable) that saves at once with no confirmation (STAFF-DEC-014); Edit; Remove Staff.
- Phone, email and status. Assigned Permissions / Access: the five areas, tick when granted, red cross when not.
- Assigned Property: one card per assigned property, newest assignment first, scrolling inside the panel: cover (first image or a placeholder), name, city and state, status badge (Ready to move / Under construction), "View Property" (link to `/properties/:id`, property's route) and "Unassign" (no confirmation). "Leads Assigned" and the second "Active" are hidden until CRM exists (STAFF-DEC-009).
- Assign Property opens a picker of the developer's properties not yet assigned to this member; pick one and Assign. Empty: "All your properties are already assigned to this staff member" or "You have no properties yet" (STAFF-DEC-015).
- Unknown or foreign id: "Staff member not found" in the modal.

### Remove (STAFF-DEC-003, STAFF-DEC-013)

- From the list or the Detail: a confirmation modal ("Remove <name>?" / "Their access permissions and property assignments will be deleted. This cannot be undone.", Cancel / Remove). Hard delete; permissions and assignments go with it (CASCADE). Then back to the list. Already removed → 404, list refreshes.

### Responsive

Every page works from 375 px to the 1440 px frame and on 1366x768 and 1280x720, with no horizontal scroll. Below 1024 px the sidebar collapses behind a menu button; modals become full width with a 16 px margin and scroll inside when taller than the screen; the staff table becomes one card per member below 768 px. Exact rules: STAFF-SPEC-001.

## Scope

### In scope

- Staff list, Add, Edit, Detail, status change, Remove, access permissions, property assignment (list assignable, assign, unassign), the shared `DeveloperLayout`.

### Out of scope

- Staff login, invitation, permission enforcement (STAFF-DEC-007, STAFF-Q-014: integration owner).
- Leads assigned to staff and the "Leads Assigned" count (CRM module).
- Property pages and the property API (property module); "View Property" only links to its route.
- Limits per subscription plan (STAFF-DEC-016).
- Avatar photo upload (STAFF-DEC-018).

## Data

- Tables: [db.md](db.md). Migration `backend/src/migrations/20261030212742-create-staff-tables.cjs`, run on this folder's databases on 2026-10-31; the grill changed no table.
- Reads `properties` and `property_media` read-only (STAFF-DEC-009); writes only staff tables.
- Data owner: the employer account in `staff_members.employer_id`.
- Sensitive data: staff name, email and phone; see db.md, "Personal data and retention". Never logged.

## UI/design references

[figma.md](figma.md)

## Open questions

- STAFF-Q-023: how staff gets a property cover image URL (placeholder until then). STAFF-Q-014 (staff login) was answered: deferred to a separate integration-owner change after the modules are merged.
