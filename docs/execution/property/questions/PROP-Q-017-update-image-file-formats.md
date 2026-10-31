# PROP-Q-017: Which file formats does the optional image of a construction update accept?

- **Status:** answered (2026-10-31)
- **Blocks:** the "add update" ticket (shared schema and upload check); not the migration
- **Asked by:** db-design-review of the property migration, 2026-10-31

## Context

Add Update has "Upload Image (optional)" ([13009:10615](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10615)) with no format text. The draft reuses the document file columns, so `property_updates.mime_type` is `ENUM('application/pdf', 'image/jpeg', 'image/png')` and a PDF is accepted. The label says "Image", and the Updates list shows the file as a picture ([13009:7876](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7876)).

## Options

1. (recommended) Images only, JPG/PNG up to 10 MB. The upload check and the shared schema accept only `image/jpeg` and `image/png`; the column can stay as it is (the API never writes a PDF), or a later migration narrows the ENUM and the resource-type CHECK.
2. Keep PDF/JPG/PNG: an update can carry a PDF report, shown as a file link instead of a picture.

## Answer

User, 2026-10-31 (grill round 1, "yes to all"): option 1. The update image accepts JPG/PNG only, up to 10 MB. The shared schema and the upload check accept only `image/jpeg` and `image/png`; the column keeps its wider ENUM (the API never writes a PDF). Recorded in [PROP-DEC-011](../decisions/PROP-DEC-011-access-and-update-image.md).
