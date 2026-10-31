# PROP-Q-029: How is the amenity list paged and filtered, and which plans fit which pricing type?

- **Status:** answered (2026-10-31)
- **Blocks:** the amenity API and tab tickets
- **Asked by:** grill round 3, 2026-10-31

## Context

The Amenity tab ([13009:8335](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8335)) has search, two filters and a pager; Add / Edit ([13009:11821](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11821), [13009:11898](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11898)) show a "Subscription" block with no rule for which cycles fit.

## Options

1. (recommended) Newest first, 10 per page, name search, status and category filters; 1..5 plans; subscription = month only, time based = hour and/or day; price >= 0; success modal on add; Status select on edit; designed empty states.
2. Any cycle for any pricing type.

## Answer

User, 2026-10-31 ("yes for all"): option 1. Recorded in [PROP-DEC-020](../decisions/PROP-DEC-020-amenity-list-and-plans.md).
