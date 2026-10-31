# PROP-SPEC-001: Property listings API and pages

- **Status:** ready-for-agent (endpoints and pages approved by the user, 2026-10-31)
- **Module:** property
- **Sources:** [module spec](../../../modules/property/README.md), [db.md](../../../modules/property/db.md), [figma.md](../../../modules/property/figma.md), PROP-DEC-001 to PROP-DEC-023, DEC-016, DEC-018, DEC-035, DEC-036
- **Shared contract:** `shared/src/schemas/property.schema.js`, `shared/src/messages/property.messages.js`, `LIMITS.property`

## Problem Statement

An Active developer has no way to put their properties in the product. They cannot list a property with its unit types, pictures and legal documents, keep it up to date, show construction progress to future buyers, or offer bookable amenities, and they cannot see all of their listings in one place.

## Solution

A property area for Active developers: a My Properties list, a six-step Add Property wizard that uploads files as they are picked and creates everything in one go on Submit, an Edit Property page, delete with confirmation, and a Property Detail page with tabs for Overview, construction Update, Configuration, Documents and Amenity. Every rule is enforced by the API; the pages match the Figma frames and work from 375 px wide up to 1440 px.

## User Stories

### Access

1. As an Active developer, I want the property pages to open only for me and my own properties, so that nobody else sees or changes my listings.
2. As a Developer under review, I want a clear "Your account is under review" answer when I open properties, so that I know why I cannot list yet.
3. As a Buyer, I want the developer property pages to stay closed to me, so that I am not shown tools I cannot use.
4. As an Active developer, I want a property id that is not mine to look exactly like a missing one, so that other developers cannot discover my listings.

### My Properties

5. As an Active developer, I want to see my properties as cards, newest first, so that the latest listing is on top.
6. As an Active developer, I want each card to show the cover image, status and purpose badges, name, locality, price, units and, when under construction, the completion bar, so that I can scan my portfolio.
7. As an Active developer, I want to search my properties by name, so that I find one quickly.
8. As an Active developer, I want 12 cards per page with a pager, so that the page stays fast.
9. As an Active developer with no properties, I want a message and an Add New Property button, so that I know how to start.
10. As an Active developer, I want a "no match" message when my search finds nothing, so that I know the list is not broken.
11. As an Active developer, I want counters that belong to other modules (enquiries, visits, bookings, units sold) to show "–", so that I am not misled by fake zeros.
12. As an Active developer, I want Add Update on a card only for under-construction properties, so that I do not post updates for finished buildings.

### Add Property wizard

13. As an Active developer, I want to enter the basic information (name, type, purpose, category, status, location, address, map pin) in step 1, so that the listing can be found and placed.
14. As an Active developer, I want to enter the property details (area with unit, units, towers, floors, starting price, year built, builder, description, features and, when under construction, the possession date) in step 2.
15. As an Active developer, I want to add one or more configurations with optional floor plans in step 3, so that buyers see the unit types.
16. As an Active developer, I want to upload images (at least one), videos and 360 tours in step 4, so that buyers can see the property.
17. As an Active developer, I want to upload the RERA certificate, floor plan, legal NOC and ownership proof (and optionally another document) in step 5, so that the listing is complete.
18. As an Active developer, I want each file to upload as soon as I pick it, with progress and its own error, so that a bad file does not cost me the whole form.
19. As an Active developer, I want each step checked when I press Next, with the exact messages the server would give, so that I fix mistakes early.
20. As an Active developer, I want Back to keep what I typed and finished steps to be clickable, so that I can correct earlier steps.
21. As an Active developer, I want to review everything in step 6 before submitting, so that I can check it.
22. As an Active developer, I want Submit to create the whole listing at once and show a success message with a link to it, so that I never end up with half a property.
23. As an Active developer, I want the wizard to open the first step with a problem when the server refuses Submit, so that I see the message next to the field.
24. As an Active developer, I want a warning before I leave the wizard, so that I do not lose my entries by accident.

### Edit and delete

25. As an Active developer, I want to edit the basic information and details of a property on one page, so that I keep it accurate.
26. As an Active developer, I want to switch a property between Ready to move and Under construction without losing its progress and updates, so that a mistaken click does no harm.
27. As an Active developer, I want to delete a property after confirming, so that a listing I no longer offer disappears with its files.

### Property Detail

28. As an Active developer, I want a header with the gallery, badges, type line, total units, listed date, price range and Edit / Delete, so that I see the essentials at once.
29. As an Active developer, I want the price range to come from my active configurations, so that it stays correct when prices change.
30. As an Active developer, I want the description, features, map and address on the Overview, so that I can check what buyers will see.
31. As an Active developer, I want a full-screen image viewer with arrows, thumbnails and a counter, so that I can look at pictures in detail.
32. As an Active developer, I want to add images, videos and 360 tours to the gallery and remove them (never the last image), so that the gallery stays current.
33. As an Active developer, I want tabs that belong to other modules hidden, so that I do not see empty screens.

### Configurations

34. As an Active developer, I want to see each configuration with its floor plans and in a table with area, price, units, availability and status.
35. As an Active developer, I want to add, edit (including status) and delete configurations (never the last one), so that unit types stay accurate.
36. As an Active developer, I want to upload and remove floor plans of a configuration, so that buyers see layouts.
37. As an Active developer, I want a clear message when a configuration name already exists in the property, so that I do not create duplicates.

### Documents

38. As an Active developer, I want to see my documents with category and status, filtered by status and category.
39. As an Active developer, I want to view and download a document through a link that expires, so that private files stay private.
40. As an Active developer, I want to upload a document type that is still missing, and replace a document's file, so that my paperwork is current.

### Construction

41. As an Active developer, I want to see overall and per-phase progress and the possession date of an under-construction property.
42. As an Active developer, I want to update the five progress values with sliders, so that buyers see real progress.
43. As an Active developer, I want to post an update with a title, description and optional picture, list updates newest first with Show more, and delete one, so that I can report on construction.

### Bookable amenities

44. As an Active developer, I want a paged amenity table with search, status and category filters.
45. As an Active developer, I want to add an amenity with one to five price plans whose billing cycles fit its pricing type, so that pricing makes sense.
46. As an Active developer, I want to edit an amenity, including its status and plans, and delete it after confirming.

### Quality

47. As any user, I want every page to work on a phone, a tablet and short laptop screens without overlap or sideways scrolling.
48. As a keyboard or screen-reader user, I want labelled fields, announced errors and reachable controls.

## Implementation Decisions

### Seams (where the behaviour is tested)

- **HTTP API**: supertest against `createApp` with the existing fakes (`createTestApp`: fake storage, fake mailer, test clock) on the folder's `_test` database. This is the main seam: every rule of this spec is proved here.
- **Shared schemas**: Jest on each schema with exact messages (pure).
- **Pages**: React Testing Library with MSW, through the RTK Query endpoints.
- **Journeys**: Playwright against the e2e server (DEC-036), which gets one additive test-only route to seed properties.
- New internal seams, kept as small as possible: an upload-token signer/verifier (pure, unit tested) and a storage `deliveryUrl` method (unit tested with the fake).

### Module layout

- Backend module `property` with the usual layers: routes, controller, service(s), repository, presenter (response shapes), multipart upload middleware, upload-token helper. Mounted at `/api/properties` with one line in the API router.
- Frontend module `property` with pages, components, `propertyApi` injected into `baseApi`, and routes added with one line to the app routes.
- Shared: property messages and schemas, extra `LIMITS.property` entries, `@real-estate/shared/testing` cases for parity tests. Only export lines are added to shared index files.

### Shared foundations touched (additive only)

- Storage gets `deliveryUrl({ publicId, resourceType, deliveryType, expiresAt, attachment, fileName })`, a signed, expiring Cloudinary delivery URL computed locally (no API call). `createApp`'s list of storage methods gains it; the fake storage returns a predictable URL.
- The orphan job's reference lookup also checks the five property file tables (floor plans, media, documents, update images); otherwise it would delete live property files. Asset kinds gain `video` (PROP-DEC-013).
- New migration: `pending_file_deletions.resource_type` gains `'video'` (PROP-DEC-013).
- E2E harness: `POST /api/__e2e/seed/properties` writes complete properties straight into the database for an account (test-only, like the existing seed routes).

### Authorization (every route)

`authenticate` → `requireActiveDeveloper` → `validate` → controller. 401 `UNAUTHORIZED` without a valid token; 403 `FORBIDDEN` without the Developer role; 403 `DEVELOPER_NOT_ACTIVE` while the Developer is not Active. Every route with `:id` loads the property with `owner_id` = caller and answers 404 `NOT_FOUND` otherwise; every child id must belong to that property (404 otherwise). Multipart routes check the role and ownership before the body is parsed.

### Response and error shapes

- Success: `{ success: true, data, meta? }`. Lists that page return `meta: { page, pageSize, total }`. Delete answers 204 with no body.
- Errors: `{ success: false, error: { code, message, fields? } }` per `.claude/rules/validation.md`. 422 `VALIDATION_ERROR` puts messages under dotted paths (`configurations.0.name`, `media.images.2`, `plans.1.billingCycle`, `_form` for unknown keys). Rule conflicts are 409 `CONFLICT` with a property message in `error.message`, or in `fields` when they belong to one field (duplicate names). 400 `BAD_REQUEST` for an unreadable multipart body. 413 is not used: an oversized file is 422 on its `file` field. 429 `TOO_MANY_REQUESTS` from the upload limiter.
- **No new error code.** Every case maps to an existing code with a property message.
- Numbers are JSON numbers (money and areas have at most 2 decimals; coordinates 6). Dates: `createdAt` ISO date-time (UTC); `possessionDate` `YYYY-MM-DD`.
- Every file in a response is `{ id, fileName, mimeType, sizeBytes, url, urlExpiresAt }`; `url` is a signed URL valid 1 hour (PROP-DEC-022). Public ids never leave the server.

### Field rules (enforced by the shared schemas)

Property (create and edit):

| Field (JSON)           | Rule                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| name                   | string, trimmed, 1..150                                                                                      |
| propertyType           | one of PROPERTY_TYPES                                                                                        |
| listingPurpose         | one of LISTING_PURPOSES                                                                                      |
| listingCategory        | one of LISTING_CATEGORIES                                                                                    |
| propertyStatus         | one of PROPERTY_STATUSES                                                                                     |
| countryCode            | one of PROPERTY_COUNTRY_CODES (assumed list, [PROP-Q-033](../questions/PROP-Q-033-property-country-list.md)) |
| state, city            | string, trimmed, 1..100                                                                                      |
| locality               | string, trimmed, 1..150                                                                                      |
| postalCode             | trimmed, 3..10, letters/digits/space/hyphen, starts and ends with a letter or digit                          |
| address                | string, trimmed, 1..255                                                                                      |
| latitude, longitude    | number, -90..90 / -180..180, at most 6 decimals                                                              |
| totalArea              | number > 0, at most 2 decimals, max 9999999999.99                                                            |
| totalAreaUnit          | one of AREA_UNITS                                                                                            |
| totalUnits             | integer 1..4294967295                                                                                        |
| towerCount, floorCount | integer 1..65535                                                                                             |
| startingPrice          | number > 0, at most 2 decimals, max 9999999999.99                                                            |
| yearBuilt              | integer 1800..2100                                                                                           |
| builderName            | string, trimmed, 1..150                                                                                      |
| description            | string, trimmed, 1..5000                                                                                     |
| features               | array of 1..30 names, each trimmed 1..100, no duplicates (case-insensitive) (PROP-DEC-005, -006)             |
| possessionDate         | optional `YYYY-MM-DD`, a real date; only when propertyStatus is `under_construction` (PROP-DEC-015)          |

Numeric fields accept numbers or numeric strings (form inputs); an empty value is "required", not 0.

Create only (PROP-DEC-012, -017, -018, -019):

| Field                            | Rule                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| configurations                   | array of 1..20 configurations, names unique inside the request (case-insensitive)                                                           |
| configurations[i].name           | trimmed 1..100                                                                                                                              |
| configurations[i].areaSqft       | number > 0, 2 decimals, max 99999999.99                                                                                                     |
| configurations[i].price          | number > 0, 2 decimals, max 9999999999.99                                                                                                   |
| configurations[i].totalUnits     | integer >= 1                                                                                                                                |
| configurations[i].availableUnits | integer 0..totalUnits                                                                                                                       |
| configurations[i].floorPlans     | array of 0..10 upload tokens of purpose `floor_plan`                                                                                        |
| media.images / videos / tours    | arrays of upload tokens: 1..30 `image`, 0..5 `video`, 0..5 `tour_360`                                                                       |
| documents                        | object: `reraCertificate`, `floorPlan`, `legalNoc`, `ownershipProof` required, `other` optional; each an upload token of purpose `document` |

Every token appears at most once in the request (422 on the repeat).

Configuration (tab): name, areaSqft, price, totalUnits, availableUnits as above; edit adds `status` (CONFIGURATION_STATUSES).

Amenity: name 1..100; category (AMENITY_CATEGORIES); pricingType (AMENITY_PRICING_TYPES); description 1..1000; features 1..1000; plans 1..5 of `{ planName 1..50, billingCycle, price >= 0 (2 decimals, max 9999999999.99), features optional 0..255 }`; subscription allows only `month`, time_based only `hour` / `day`; (planName, billingCycle) unique inside the amenity; edit adds `status` (AMENITY_STATUSES).

Progress: overallPercent, foundationPercent, structurePercent, interiorPercent, finishingPercent, each integer 0..100, all required.

Update: title 1..150, description 1..2000, image optional (JPG/PNG, 10 MB).

Files (multipart parts and upload tokens):

| Purpose              | Formats (checked by magic bytes) | Max   |
| -------------------- | -------------------------------- | ----- |
| image                | JPG, PNG                         | 10 MB |
| video, tour_360      | MP4                              | 40 MB |
| floor_plan, document | PDF, JPG, PNG                    | 10 MB |
| update image         | JPG, PNG                         | 10 MB |

File name 1..255 characters. A file whose bytes do not match an allowed format is 422 `mimeType` "invalid format", whatever the client declared.

List queries: `page` >= 1 (default 1); `pageSize` 1..50 (default 12 for properties, 10 for amenities and updates); `search` trimmed 0..100; amenity `status`, `category` from their enums; document `status` (PROPERTY_DOCUMENT_STATUSES), `category` (legal, architecture, financial, other). Unknown query keys are ignored; bad values are 422.

### Upload tokens (PROP-DEC-012)

- Signed with HMAC-SHA256 using a key derived from `JWT_ACCESS_SECRET` with a property-specific label (never equal to it, as DEC-029). Payload: owner id, purpose, public id, resource type, mime type, size, file name, expiry (24 h from the test clock or the system clock).
- Verification on Submit, per token: signature valid, not expired, same owner, purpose fits the slot. Failure → 422 at the slot's path with `uploadToken.invalid` ("This upload has expired, please upload the file again"). A token whose public id is already stored → 409 at that path, same message.
- Files are uploaded under the app prefix, folder `properties/<owner id>/staging`; rows created on Submit reference those public ids (no copy, no rename).

### Endpoints

All paths are under `/api/properties`. Every route needs an Active developer (above). "404" means not found or not the caller's.

| #   | Method, path                                                           | Request                                                  | Success                                                                   | Errors (besides 401/403)                                                                                                                |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | POST `/uploads`                                                        | multipart: `file`, `purpose`                             | 201 `{ upload: { uploadToken, purpose, fileName, mimeType, sizeBytes } }` | 422 purpose / file (missing, empty, too big, bad format, name too long); 400 unreadable body; 429 over 200 uploads per hour per account |
| 2   | POST `/`                                                               | JSON create body                                         | 201 `{ property }` (detail shape)                                         | 422 fields (including tokens); 409 token already used                                                                                   |
| 3   | GET `/`                                                                | query `page`, `pageSize`, `search`                       | 200 `{ properties: [card] }`, meta                                        | 422 query                                                                                                                               |
| 4   | GET `/:id`                                                             | –                                                        | 200 `{ property }` (detail shape)                                         | 404; 422 id                                                                                                                             |
| 5   | PUT `/:id`                                                             | JSON edit body                                           | 200 `{ property }`                                                        | 404; 422                                                                                                                                |
| 6   | DELETE `/:id`                                                          | –                                                        | 204                                                                       | 404; 409 referenced by another module (later)                                                                                           |
| 7   | GET `/:id/configurations`                                              | –                                                        | 200 `{ configurations: [configuration with floorPlans] }` (created order) | 404                                                                                                                                     |
| 8   | POST `/:id/configurations`                                             | JSON configuration                                       | 201 `{ configuration }`                                                   | 404; 422; 409 `configuration.name.taken` on `name`; 409 `configurations.max`                                                            |
| 9   | PUT `/:id/configurations/:configurationId`                             | JSON configuration + status                              | 200 `{ configuration }`                                                   | 404; 422; 409 name taken                                                                                                                |
| 10  | DELETE `/:id/configurations/:configurationId`                          | –                                                        | 204 (floor plan files queued)                                             | 404; 409 `configurations.lastOne`                                                                                                       |
| 11  | POST `/:id/configurations/:configurationId/floor-plans`                | multipart `file`                                         | 201 `{ floorPlan }`                                                       | 404; 422 file; 409 `floorPlans.max`                                                                                                     |
| 12  | DELETE `/:id/configurations/:configurationId/floor-plans/:floorPlanId` | –                                                        | 204 (file queued)                                                         | 404                                                                                                                                     |
| 13  | GET `/:id/media`                                                       | –                                                        | 200 `{ images, videos, tours }`, each in gallery order                    | 404                                                                                                                                     |
| 14  | POST `/:id/media`                                                      | multipart `file`, `mediaType`                            | 201 `{ media }`                                                           | 404; 422 file / mediaType; 409 `media.max.<type>`                                                                                       |
| 15  | DELETE `/:id/media/:mediaId`                                           | –                                                        | 204 (file queued)                                                         | 404; 409 `media.lastImage`                                                                                                              |
| 16  | GET `/:id/documents`                                                   | query `status`, `category`                               | 200 `{ documents: [document], addableTypes: [type] }`                     | 404; 422 query                                                                                                                          |
| 17  | POST `/:id/documents`                                                  | multipart `file`, `documentType`                         | 201 `{ document }`                                                        | 404; 422; 409 `documents.typeTaken` / `documents.otherMax`                                                                              |
| 18  | PUT `/:id/documents/:documentId/file`                                  | multipart `file`                                         | 200 `{ document }` (status `uploaded`, old file queued)                   | 404; 422                                                                                                                                |
| 19  | GET `/:id/documents/:documentId/url`                                   | query `disposition` = `inline` (default) or `attachment` | 200 `{ url, expiresAt }`                                                  | 404; 422                                                                                                                                |
| 20  | GET `/:id/progress`                                                    | –                                                        | 200 `{ progress }`                                                        | 404; 409 `updates.notUnderConstruction`                                                                                                 |
| 21  | PUT `/:id/progress`                                                    | JSON five percents                                       | 200 `{ progress }`                                                        | 404; 422; 409 not under construction                                                                                                    |
| 22  | GET `/:id/updates`                                                     | query `page`, `pageSize`                                 | 200 `{ updates }`, meta (newest first)                                    | 404; 422; 409 not under construction                                                                                                    |
| 23  | POST `/:id/updates`                                                    | multipart `title`, `description`, optional `image`       | 201 `{ update }`                                                          | 404; 422; 409 not under construction                                                                                                    |
| 24  | DELETE `/:id/updates/:updateId`                                        | –                                                        | 204 (image queued)                                                        | 404                                                                                                                                     |
| 25  | GET `/:id/amenities`                                                   | query `page`, `pageSize`, `search`, `status`, `category` | 200 `{ amenities }`, meta                                                 | 404; 422                                                                                                                                |
| 26  | GET `/:id/amenities/:amenityId`                                        | –                                                        | 200 `{ amenity }` with plans                                              | 404                                                                                                                                     |
| 27  | POST `/:id/amenities`                                                  | JSON amenity with plans                                  | 201 `{ amenity }`                                                         | 404; 422; 409 `amenity.name.taken` on `name`                                                                                            |
| 28  | PUT `/:id/amenities/:amenityId`                                        | JSON amenity + status, plans replaced                    | 200 `{ amenity }`                                                         | 404; 422; 409 name taken                                                                                                                |
| 29  | DELETE `/:id/amenities/:amenityId`                                     | –                                                        | 204                                                                       | 404                                                                                                                                     |

Shapes:

- **card** (list): `id, name, propertyType, listingPurpose, propertyStatus, locality, city, startingPrice, priceRange { min, max } | null, totalUnits, coverImage (file) | null, progressPercent (overall, under construction only, else null), createdAt`.
- **detail**: every property field above, plus `features: [name]`, `possessionDate | null`, `configurationNames: [name]`, `priceRange`, `coverImage`, `progress` (under construction only, else null), `createdAt`, `updatedAt`.
- **configuration**: `id, name, areaSqft, price, totalUnits, availableUnits, isAvailable (availableUnits > 0), status, floorPlans: [file], createdAt`.
- **media**: file + `mediaType, sortOrder`. **document**: file + `documentType, category, status, createdAt, updatedAt`. **update**: `id, title, description, image (file) | null, createdAt`.
- **progress**: `overallPercent, foundationPercent, structurePercent, interiorPercent, finishingPercent, possessionDate, phases: [{ phase, percent, badge: 'complete' | 'in_progress' | null }]`.
- **amenity**: `id, name, category, pricingType, description, features, status, plans: [{ id, planName, billingCycle, price, features }], createdAt`.

### Service rules

- **Create** (2): verify every token, then one transaction: property, features, configurations, floor plans, media (sort order by array position), documents (status `uploaded`), and the progress row when under construction (0%, `possessionDate`). A DB unique violation inside maps to the field (configuration name) or the token path.
- **Edit** (5): one transaction: update the row, replace features as a set, create the progress row if the status becomes `under_construction` and none exists, set `possessionDate` on it (clear it when absent). A change to `ready_to_move` keeps progress and updates (PROP-DEC-015).
- **Delete** (6, 10, 12, 15, 24, 29) and **Replace** (18): the transaction locks the parent row, collects every Cloudinary file of the rows that go and queues them in `pending_file_deletions` (`reason` `record_deleted` / `replaced`), then deletes or updates; the worker deletes the files after commit (DEC-018).
- **Counted limits** (configurations, floor plans, media, documents per type): checked inside a transaction that locks the property row (`SELECT … FOR UPDATE`), so racing requests cannot both pass.
- **Single-file uploads** (11, 14, 17, 18, 23): rules checked before the upload (nothing is uploaded for a refused request); upload, then the DB save with `uploadAndSave`, which deletes or queues the file if the save fails (DEC-018); the limit is re-checked under the lock.
- **Derived values**: price range from `active` configurations; `isAvailable`; document category (PROP-DEC-008); phase badges (PROP-DEC-010); cover = first image by `sort_order`, then `id`.
- **Search**: `name LIKE %text%` with `%`, `_` and `\` escaped, inside the owner's rows.

### Pages

| Page                           | Route                            | Frame(s)                                                            | Data                        |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------------- | --------------------------- |
| My Properties                  | `/properties`                    | 13009:7145                                                          | 3, 6 (delete from the card) |
| Add Property (steps 1–6)       | `/properties/new`                | 13009:10644, 10825, 10940, 11051, 11196, 11344; success 13009:11599 | 1, 2                        |
| Edit Property                  | `/properties/:id/edit`           | layouts of 13009:10644 and 13009:10825                              | 4, 5                        |
| Property Detail: Overview      | `/properties/:id`                | 13009:7369, 13009:7612; viewer 13009:12356; upload 13009:12032      | 4, 6, 13, 14, 15            |
| Property Detail: Update        | `/properties/:id/updates`        | 13009:7876; modals 13009:10526, 13009:10615                         | 20–24                       |
| Property Detail: Configuration | `/properties/:id/configurations` | 13009:9932; modal 13009:10479                                       | 7–12                        |
| Property Detail: Documents     | `/properties/:id/documents`      | 13009:10202; modal 13009:12013                                      | 16–19                       |
| Property Detail: Amenity       | `/properties/:id/amenities`      | 13009:8335; modals 13009:11821, 11898, 12402, 11589                 | 25–29                       |

All are behind `ProtectedRoute roles={['developer']}`; a Developer who is not Active sees the API's 403 message in the page's error state with a link to the verification status page. The Update tab (and route) shows only for under-construction properties; opening it for a ready-to-move property redirects to the Overview.

States on every page and tab:

- **Loading**: skeletons in the shape of the content (cards, table rows, header), with `aria-busy`.
- **Empty**: My Properties and Amenity per PROP-DEC-014 / -020; Configuration, Documents and Updates show a one-line message plus their add button.
- **Error**: 404 shows "Property not found" with a link to My Properties; other errors show the API message in an alert with a Retry button.
- **Mutations**: buttons disabled and labelled busy while saving; field errors from `error.fields` through `applyServerErrors`; other errors in a form-level alert; success closes the modal and refreshes the list (RTK Query tags).

### Responsive rule (Figma has only 1440 px frames)

- **>= 1280 px**: the Figma layout; content width is fluid up to the frame's 1440, never fixed pixel positions. Must also fit 1366x768 and 1280x720 without overlap; long pages scroll vertically only.
- **768–1279 px**: the sidebar collapses to icons; card grids go to 2 columns; detail header stacks the gallery above the facts; two-column forms stay two columns from 1024, one column below.
- **< 768 px** (down to 375): sidebar becomes a top bar with a menu button; one column everywhere; tables scroll horizontally inside their own container (never the page); the stepper shows "Step n of 6" with the step name; modals become full-width sheets; buttons are at least 44 px tall.
- No horizontal page scroll at any width from 375 px; checked at 1440x900 (frame), 1366x768, 1280x720, 768x1024 and 375x812.

## Testing Decisions

- Good tests check behaviour through the seams above (HTTP status, body, DB rows, queued deletions, what the page shows), never private functions or query shapes.
- **Shared**: every schema has a valid case and one failing case per rule with the exact message constant, including boundaries (max, max + 1, empty, whitespace-only). Prior art: `shared/src/schemas/__tests__/auth.schema.test.js`.
- **Backend unit**: upload-token sign/verify, magic-byte sniffing per purpose, derived values (price range, category, badges), storage `deliveryUrl` with the fake. Prior art: `resetToken.test.js`, `verificationStatus.test.js`.
- **Backend integration** (supertest, `_test` DB, fakes): per endpoint, success; 401, 403 Buyer, 403 not Active; 404 for another owner's and a missing id; each 409 rule; validation parity (posting the shared parity cases and asserting the same messages in `error.fields`); transactions (no row and no orphan file left after a failure); files queued on delete and replace; races for counted limits where practical. Prior art: `submitDocuments.int.test.js`, `userDeletion.int.test.js`.
- **Frontend**: each page and modal with RTL and MSW: renders data, loading, empty and error states, client validation messages equal the shared constants, server field errors land on the field, permissions redirect. Prior art: `UploadDocumentsPage.test.jsx`.
- **E2E** (Playwright, e2e server): the add-property journey end to end, edit, delete, each tab's main action, one invalid submit per form with the on-screen message equal to the shared constant (client and server), visual screenshots at the frame size and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812. Prior art: `e2e/tests/auth/*.spec.js`, `e2e/fixtures/visual.js`.

## Out of Scope

- Staff access to the owner's properties ([PROP-Q-022](../questions/PROP-Q-022-staff-access-to-properties.md)).
- CRM / leads, payments, buyers and bookings, marketing and facility tabs and their counters (PROP-DEC-003).
- Admin review of property documents (statuses `pending`, `verified`), buyer-side search, public listing pages.
- Gallery reordering, editing updates, deleting documents, drafts, approval.
- Booking an amenity.

## Further Notes

- Confirmed by the user with the approval (2026-10-31): the country list stays AE, GB, IN, SG, US for now ([PROP-Q-033](../questions/PROP-Q-033-property-country-list.md); project-wide location tables come later); the upload limiter budget (200 uploads per hour per account); the gallery upload modal gets a "Type" select (Image / Video / 360° tour) because the frame has no way to mark a 360 tour.
- Map pin: the map picker uses OpenStreetMap tiles through Leaflet (one new frontend dependency, confirmed by the user 2026-10-31); the detail page's map is a static view of the same pin.
- Risk: the app shell (sidebar and top bar) does not exist yet and other module branches may build it too; it is built additively under `frontend/src/components/` and noted for the merge into `testing`.
