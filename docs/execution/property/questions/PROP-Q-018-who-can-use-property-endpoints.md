# PROP-Q-018: Who may read and change properties through the API?

- **Status:** answered (2026-10-31)
- **Blocks:** every property API ticket
- **Asked by:** grill round 1, 2026-10-31

## Context

PROP-DEC-001 names the owner, but not what other accounts get: a Developer under review, another Developer, a Buyer, an Admin, or a staff member of the owner.

## Options

1. (recommended) Active developer only, own properties only; another owner's property answers 404; Buyers and Admins get nothing yet; staff access comes from the staff module.
2. Any Developer may read every property (403 only on writes).

## Answer

User, 2026-10-31 ("yes to all"): option 1. Recorded in [PROP-DEC-011](../decisions/PROP-DEC-011-access-and-update-image.md). Staff access is [PROP-Q-022](PROP-Q-022-staff-access-to-properties.md).
