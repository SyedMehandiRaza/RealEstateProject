# Property

Status: **spec agreed** (grill with the user, 2026-10-31, three rounds). API and page contract: [PROP-SPEC-001](../../execution/property/specs/PROP-SPEC-001-property-listings-api-and-pages.md); shared schemas and messages in `shared/src/schemas/property.schema.js` and `shared/src/messages/property.messages.js`. Board: [docs/execution/property/README.md](../../execution/property/README.md).

## Purpose and users

An **Active developer** lists the properties they own and manages each one: configurations (unit types) with floor plans, a media gallery, documents, listing features, bookable amenities with price plans and, while a property is under construction, construction progress and updates.

| Who                                    | What they get                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Active developer (owner)               | Everything below, on their own properties only (PROP-DEC-001, PROP-DEC-011)                                                    |
| Developer not Active                   | 403 `DEVELOPER_NOT_ACTIVE` on every property route                                                                             |
| Buyer, Admin, account without the role | 403 `FORBIDDEN`; no property routes yet                                                                                        |
| Another developer's property id        | 404 `NOT_FOUND`, the same as a missing id                                                                                      |
| Staff of the owner                     | Not in this module ([PROP-Q-022](../../execution/property/questions/PROP-Q-022-staff-access-to-properties.md), open for staff) |

## Scope

### In scope

- **My Properties** list: cards, name search, 12 per page, newest first, empty states (PROP-DEC-014).
- **Add Property** wizard, 6 steps; files uploaded as they are picked and submitted as signed upload tokens; one transaction on Submit (PROP-DEC-005, PROP-DEC-012, PROP-DEC-023).
- **Edit Property**: one page with the step 1 and 2 fields; a status change keeps progress data (PROP-DEC-015).
- **Delete Property**: confirm modal, hard delete, files queued for deletion (PROP-DEC-002, PROP-DEC-016).
- **Property Detail** with the tabs Overview (header, description, features, map, address, gallery, image viewer), Update (under construction only), Configuration, Documents, Amenity (PROP-DEC-022).
- Configurations 1..20 with floor plans 0..10 each; edit, delete (not the last) (PROP-DEC-017).
- Gallery: at least 1 image; at most 30 images, 5 videos, 5 360 tours; delete, not the last image (PROP-DEC-018).
- Video and 360 tour support in the shared file cleanup, as a new additive migration (PROP-DEC-013).
- Documents: one per type (Other up to 5), upload, replace, view, download, filters (PROP-DEC-008, PROP-DEC-019).
- Bookable amenities with 1..5 plans, list with search, filters and pager, add, edit, delete (PROP-DEC-006, PROP-DEC-020).
- Construction progress and updates (PROP-DEC-010, PROP-DEC-021).

### Out of scope

- CRM / leads, payments, buyers and bookings, marketing and facility tabs, and every counter they feed: other modules (PROP-DEC-003). Their tabs are hidden and their counters show "–".
- Staff access to the owner's properties (PROP-Q-022), buyer-side search, Admin document review (statuses `pending` / `verified`), gallery reordering, editing updates, deleting documents.

## Business rules

| Area          | Rule                                                                                                                                                                                                 | Source                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Ownership     | `owner_id` is the creating Developer; an account that owns properties cannot be deleted (409)                                                                                                        | PROP-DEC-001               |
| Required      | Every field Figma does not mark optional; optional: the Other document, the update image, videos, 360 tours, floor plans, possession date                                                            | PROP-DEC-005, -017, -018   |
| Unique        | Configuration name and amenity name per property (case-insensitive); features per property; property names are not unique                                                                            | PROP-DEC-005               |
| Status        | `ready_to_move` / `under_construction`; to under construction creates progress at 0%; back keeps progress and updates hidden                                                                         | PROP-DEC-004, PROP-DEC-015 |
| Location      | Country ISO alpha-2; state, city free text; postal code 3..10 letters/digits/space/hyphen; map pin required                                                                                          | PROP-DEC-004               |
| Money, area   | One currency, `DECIMAL(12,2)`; total area in sq ft or acres; configuration area in sq ft                                                                                                             | PROP-DEC-004               |
| Files         | Images JPG/PNG 10 MB; videos and 360 tours MP4 40 MB; floor plans and documents PDF/JPG/PNG 10 MB; update image JPG/PNG 10 MB; checked by magic bytes; private Cloudinary assets, 1-hour signed URLs | PROP-DEC-009, -011, -022   |
| Delete        | Hard delete with CASCADE; every file of deleted rows is queued in `pending_file_deletions` in the same transaction                                                                                   | PROP-DEC-002, DEC-018      |
| Documents     | Types fixed; status `uploaded` -> `pending` -> `verified` by an Admin (later); Replace resets to `uploaded`; four types required on Submit                                                           | PROP-DEC-008, PROP-DEC-019 |
| Amenity plans | Subscription: month only; time based: hour and/or day; price >= 0                                                                                                                                    | PROP-DEC-020               |
| Progress      | Five integers 0..100, overall entered; badges derived (100 Complete, 1-99 In progress)                                                                                                               | PROP-DEC-010, PROP-DEC-021 |

## Pages

| Page                           | Route (proposal)                 | Figma                         |
| ------------------------------ | -------------------------------- | ----------------------------- |
| My Properties                  | `/properties`                    | `13009:7145`                  |
| Add Property (6 steps)         | `/properties/new`                | `13009:10644` … `13009:11344` |
| Edit Property                  | `/properties/:id/edit`           | layouts of steps 1 and 2      |
| Property Detail: Overview      | `/properties/:id`                | `13009:7369`, `13009:7612`    |
| Property Detail: Update        | `/properties/:id/updates`        | `13009:7876`                  |
| Property Detail: Configuration | `/properties/:id/configurations` | `13009:9932`                  |
| Property Detail: Documents     | `/properties/:id/documents`      | `13009:10202`                 |
| Property Detail: Amenity       | `/properties/:id/amenities`      | `13009:8335`                  |

Modals and dropdowns: [figma.md](figma.md). Every page is responsive from 375 px up to the 1440 frame and on 1366x768 / 1280x720 (frontend rules).

## Data

- Tables: [db.md](db.md). Migration `backend/src/migrations/20261030212741-create-property-tables.cjs` (run on the property folder's databases on 2026-10-31). The grill changed no property table; PROP-DEC-013 adds a new migration on the shared `pending_file_deletions` table.
- Sensitive data: db.md, "Personal data and retention".

## Decisions and questions

PROP-DEC-001 to PROP-DEC-023 and PROP-Q-001 to PROP-Q-032: see the [board](../../execution/property/README.md). Open: PROP-Q-022 (staff access, for the staff module).
