# PROP-DEC-018: Gallery limits, required cover image and delete

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-027
- **Tickets:** media API and gallery tickets

## Decision

- Submit needs **at least 1 image**; videos and 360 tours are optional.
- Maximum per property: **30 images, 5 videos, 5 360 tours** (`LIMITS.property.maxImages` / `maxVideos` / `maxTours`); one more answers 409 CONFLICT with the shared message for that group.
- Order is upload order: `sort_order` = next number in the group, ties broken by `id`. The first image is the cover. No reorder UI.
- Each item can be deleted (confirm modal, PROP-DEC-016); its file is queued for deletion. Deleting the **last image** answers 409 (`media.lastImage`); deleting the cover makes the next image the cover.
- The gallery "upload" tile (Upload image or video, 13009:12032) shows on every property, not only under construction.

## Why

A listing needs a cover; limits bound the page and Cloudinary use.

## Alternatives rejected

- No limits, or media optional: an empty card and an unbounded gallery.
