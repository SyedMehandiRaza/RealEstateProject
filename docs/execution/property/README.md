# Property: execution board

Prefix `PROP`. Branch `feature/property`. Spec: [PROP-SPEC-001](specs/). Module docs: [docs/modules/property/](../../modules/property/). Rules: [issue-tracker.md](../../agents/issue-tracker.md).

## Tickets

| ID  | Title | Status | Blocked by |
| --- | ----- | ------ | ---------- |

## Open questions

| ID                                                              | Question                                                                    | Blocks                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [PROP-Q-017](questions/PROP-Q-017-update-image-file-formats.md) | Which file formats does the optional image of a construction update accept? | the "add update" ticket (shared schema and upload check); not the migration |

## Answered questions

Answered 2026-10-31 with the recommended option of each question, provisionally: the user will review each one.

| ID                                                                    | Question                                                                                          | Decision                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [PROP-Q-001](questions/PROP-Q-001-who-owns-a-property.md)             | Who owns a property, and what happens to it if the owner account is deleted?                      | [PROP-DEC-001](decisions/PROP-DEC-001-block-deleting-owner-accounts.md)         |
| [PROP-Q-002](questions/PROP-Q-002-delete-property-behaviour.md)       | What does "Delete" on a property do: hard delete, soft delete or archive?                         | [PROP-DEC-002](decisions/PROP-DEC-002-hard-delete-properties-cascade.md)        |
| [PROP-Q-003](questions/PROP-Q-003-detail-tabs-module-ownership.md)    | Which module owns the CRM, Payment, Buyers, Marketing and Facility tabs of Property Detail?       | [PROP-DEC-003](decisions/PROP-DEC-003-listing-tables-only.md)                   |
| [PROP-Q-004](questions/PROP-Q-004-property-status-values.md)          | What are all the values of "Property Status"?                                                     | [PROP-DEC-004](decisions/PROP-DEC-004-listing-status-location-area-currency.md) |
| [PROP-Q-005](questions/PROP-Q-005-country-state-city-source.md)       | Where do the Country, State and City lists come from?                                             | [PROP-DEC-004](decisions/PROP-DEC-004-listing-status-location-area-currency.md) |
| [PROP-Q-006](questions/PROP-Q-006-total-area-unit.md)                 | In which unit is "Total Area" entered?                                                            | [PROP-DEC-004](decisions/PROP-DEC-004-listing-status-location-area-currency.md) |
| [PROP-Q-007](questions/PROP-Q-007-currency-of-prices.md)              | Which currency are prices in, and can it differ per property?                                     | [PROP-DEC-004](decisions/PROP-DEC-004-listing-status-location-area-currency.md) |
| [PROP-Q-008](questions/PROP-Q-008-property-amenities-and-features.md) | Is the "Amenities" field of Add Property free text, a fixed list, or the bookable amenities?      | [PROP-DEC-006](decisions/PROP-DEC-006-features-and-bookable-amenities.md)       |
| [PROP-Q-009](questions/PROP-Q-009-configuration-status-and-type.md)   | What are the configuration status values, and is there a configuration "Type"?                    | [PROP-DEC-007](decisions/PROP-DEC-007-configuration-status-no-type.md)          |
| [PROP-Q-010](questions/PROP-Q-010-document-types-status-replace.md)   | Which property document types and statuses exist, who verifies them, and what does Replace keep?  | [PROP-DEC-008](decisions/PROP-DEC-008-document-types-status-replace.md)         |
| [PROP-Q-011](questions/PROP-Q-011-cloudinary-video-file-cleanup.md)   | Can pending_file_deletions accept Cloudinary videos (resource_type video)?                        | [PROP-DEC-009](decisions/PROP-DEC-009-media-formats-and-video-cleanup.md)       |
| [PROP-Q-012](questions/PROP-Q-012-bookable-amenities-rules.md)        | Which rules apply to the bookable amenities of the Amenity tab?                                   | [PROP-DEC-006](decisions/PROP-DEC-006-features-and-bookable-amenities.md)       |
| [PROP-Q-013](questions/PROP-Q-013-construction-progress-rules.md)     | Is overall construction progress entered or computed, and where is the possession date entered?   | [PROP-DEC-010](decisions/PROP-DEC-010-construction-progress-entered.md)         |
| [PROP-Q-014](questions/PROP-Q-014-required-fields-and-uniqueness.md)  | Which property fields are required, and which names must be unique?                               | [PROP-DEC-005](decisions/PROP-DEC-005-required-fields-no-drafts.md)             |
| [PROP-Q-015](questions/PROP-Q-015-listing-draft-and-approval.md)      | Is a property saved as a draft between wizard steps, or reviewed by an Admin before it is listed? | [PROP-DEC-005](decisions/PROP-DEC-005-required-fields-no-drafts.md)             |
| [PROP-Q-016](questions/PROP-Q-016-media-formats-limits-order.md)      | Which formats, sizes, order and visibility apply to property media?                               | [PROP-DEC-009](decisions/PROP-DEC-009-media-formats-and-video-cleanup.md)       |

## Decisions

| ID                                                                              | Decision                                                                                              | Answers                                                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [PROP-DEC-001](decisions/PROP-DEC-001-block-deleting-owner-accounts.md)         | A property is owned by a Developer account, and an account with properties or staff cannot be deleted | PROP-Q-001; also decides the deletion part of [STAFF-Q-007](../staff/questions/STAFF-Q-007-who-employs-staff.md) |
| [PROP-DEC-002](decisions/PROP-DEC-002-hard-delete-properties-cascade.md)        | Deleting a property is a hard delete that cascades to its own rows                                    | PROP-Q-002                                                                                                       |
| [PROP-DEC-003](decisions/PROP-DEC-003-listing-tables-only.md)                   | The property module owns only the listing tables                                                      | PROP-Q-003                                                                                                       |
| [PROP-DEC-004](decisions/PROP-DEC-004-listing-status-location-area-currency.md) | Property status, location, total area unit and currency                                               | PROP-Q-004, PROP-Q-005, PROP-Q-006, PROP-Q-007                                                                   |
| [PROP-DEC-005](decisions/PROP-DEC-005-required-fields-no-drafts.md)             | Required fields, unique names, and no drafts or approval                                              | PROP-Q-014, PROP-Q-015                                                                                           |
| [PROP-DEC-006](decisions/PROP-DEC-006-features-and-bookable-amenities.md)       | Listing features and bookable amenities are separate tables                                           | PROP-Q-008, PROP-Q-012                                                                                           |
| [PROP-DEC-007](decisions/PROP-DEC-007-configuration-status-no-type.md)          | Configuration status is active / inactive, with no Type field                                         | PROP-Q-009                                                                                                       |
| [PROP-DEC-008](decisions/PROP-DEC-008-document-types-status-replace.md)         | Property document types, review status and Replace                                                    | PROP-Q-010                                                                                                       |
| [PROP-DEC-009](decisions/PROP-DEC-009-media-formats-and-video-cleanup.md)       | Gallery media formats, order and video file cleanup                                                   | PROP-Q-016, PROP-Q-011                                                                                           |
| [PROP-DEC-010](decisions/PROP-DEC-010-construction-progress-entered.md)         | Construction progress is entered, with a nullable possession date                                     | PROP-Q-013                                                                                                       |
