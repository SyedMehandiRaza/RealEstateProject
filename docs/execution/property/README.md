# Property: execution board

Prefix `PROP`. Branch `feature/property`. Spec: [PROP-SPEC-001](specs/). Module docs: [docs/modules/property/](../../modules/property/). Rules: [issue-tracker.md](../../agents/issue-tracker.md).

## Tickets

| ID  | Title | Status | Blocked by |
| --- | ----- | ------ | ---------- |

## Open questions

| ID                                                                    | Question                                                                                          | Blocks                                                                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [PROP-Q-001](questions/PROP-Q-001-who-owns-a-property.md)             | Who owns a property, and what happens to it if the owner account is deleted?                      | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-002](questions/PROP-Q-002-delete-property-behaviour.md)       | What does "Delete" on a property do: hard delete, soft delete or archive?                         | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-003](questions/PROP-Q-003-detail-tabs-module-ownership.md)    | Which module owns the CRM, Payment, Buyers, Marketing and Facility tabs of Property Detail?       | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-004](questions/PROP-Q-004-property-status-values.md)          | What are all the values of "Property Status"?                                                     | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-005](questions/PROP-Q-005-country-state-city-source.md)       | Where do the Country, State and City lists come from?                                             | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-006](questions/PROP-Q-006-total-area-unit.md)                 | In which unit is "Total Area" entered?                                                            | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-007](questions/PROP-Q-007-currency-of-prices.md)              | Which currency are prices in, and can it differ per property?                                     | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-008](questions/PROP-Q-008-property-amenities-and-features.md) | Is the "Amenities" field of Add Property free text, a fixed list, or the bookable amenities?      | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-009](questions/PROP-Q-009-configuration-status-and-type.md)   | What are the configuration status values, and is there a configuration "Type"?                    | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-010](questions/PROP-Q-010-document-types-status-replace.md)   | Which property document types and statuses exist, who verifies them, and what does Replace keep?  | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-011](questions/PROP-Q-011-cloudinary-video-file-cleanup.md)   | Can pending_file_deletions accept Cloudinary videos (resource_type video)?                        | approval of the property migration (`20261030212741-create-property-tables.cjs`); the media-upload ticket (videos and 360 tours) |
| [PROP-Q-012](questions/PROP-Q-012-bookable-amenities-rules.md)        | Which rules apply to the bookable amenities of the Amenity tab?                                   | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-013](questions/PROP-Q-013-construction-progress-rules.md)     | Is overall construction progress entered or computed, and where is the possession date entered?   | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-014](questions/PROP-Q-014-required-fields-and-uniqueness.md)  | Which property fields are required, and which names must be unique?                               | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-015](questions/PROP-Q-015-listing-draft-and-approval.md)      | Is a property saved as a draft between wizard steps, or reviewed by an Admin before it is listed? | approval of the property migration (`20261030212741-create-property-tables.cjs`)                                                 |
| [PROP-Q-016](questions/PROP-Q-016-media-formats-limits-order.md)      | Which formats, sizes, order and visibility apply to property media?                               | approval of the property migration (`20261030212741-create-property-tables.cjs`); the media-upload ticket                        |

## Decisions

| ID  | Decision |
| --- | -------- |
