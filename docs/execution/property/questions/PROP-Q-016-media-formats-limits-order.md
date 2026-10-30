# PROP-Q-016: Which formats, sizes, order and visibility apply to property media?

- **Status:** answered (2026-10-31, recommended option, provisional: user will review)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`); the media-upload ticket
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Step 4 ([13009:11051](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11051)): Property Images "PDF, JPG, PNG, 10 MB" (PDF for an image looks like a copy error), Videos "mp4, 40 MB", 360 Tour "MP4 (360° video), 40 MB". The gallery Upload modal ([13009:12032](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12032)) says "PDF, JPG, PNG, MP4, 10 MB". The gallery shows "2/12" and each card a cover image ([13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145)). Auth files are private Cloudinary assets with signed URLs (DEC-016); buyers will browse listings.

## Options

1. (recommended) Images JPG/PNG up to 10 MB; videos and 360 tours MP4 up to 40 MB; order by `sort_order`, the first image is the cover; files stay `authenticated` with short-lived signed URLs (DEC-016) until a public buyer site needs otherwise. Maximum counts per property are set in `shared/` with the upload ticket.
2. Public (`upload`) delivery for listing media, so buyer pages can cache image URLs (needs a delivery-type column).
3. A separate cover-image flag instead of "first image".

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. Images JPG/PNG up to 10 MB; videos and 360 tours MP4 up to 40 MB; order by `sort_order`, the first image is the cover; files stay `authenticated` with short-lived signed URLs (DEC-016). Maximum counts per property are set in `shared/` with the upload ticket.

Decision: [PROP-DEC-009](../decisions/PROP-DEC-009-media-formats-and-video-cleanup.md).
