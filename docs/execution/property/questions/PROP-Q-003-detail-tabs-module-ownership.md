# PROP-Q-003: Which module owns the CRM, Payment, Buyers, Marketing and Facility tabs of Property Detail?

- **Status:** answered (2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Property Detail shows tabs and stat cards with data that is not a property attribute: CRM leads ([13009:8095](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8095), [13009:12076](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12076)), payments ([13009:8592](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8592), [13009:12138](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12138)), buyers, bookings and installments ([13009:8847](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8847), [13009:12212](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12212)), marketing posts ([13009:9120](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-9120)), facility tasks and facility companies ([13009:9388](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-9388), [13009:9660](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-9660), [13009:11609](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11609), [13009:11979](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11979), [13009:11643](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11643), [13009:11779](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11779)), and the cards Leads, Booking, Total Earnings, Active Leads, Visit, Units Sold/Rent, Enquiries. The sidebar lists CRM, Marketing, Facility Management and Subscription as their own modules, and a facility module (FAC) already exists.

## Options

1. (recommended) The property module owns only the listing tables in this migration. CRM/leads, bookings and payments, marketing and facility are their own modules with their own tables and FKs to `properties`; the property detail page reads their data through their APIs. Counts on the cards are computed by those modules.
2. The property module also builds leads, bookings, payments and marketing tables now (one much larger migration, and overlap with the facility module).

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. The property module owns only the listing tables. CRM/leads, bookings and payments, marketing and facility are their own modules with their own tables and FKs to `properties`; Property Detail reads their data through their APIs.

Decision: [PROP-DEC-003](../decisions/PROP-DEC-003-listing-tables-only.md).
