# PROP-Q-032: How do the Add Property wizard steps validate, keep data and submit?

- **Status:** answered (2026-10-31)
- **Blocks:** the wizard tickets
- **Asked by:** grill round 3, 2026-10-31

## Context

The six steps ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644) to [13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344)) and the success modal ([13009:11599](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11599)) show no validation timing, persistence or error flow.

## Options

1. (recommended) Validate each step on Next; Back keeps data; finished steps clickable; data in memory with a leave prompt; one Submit; success modal linking to the detail page; on field errors jump to the first step with an error.
2. Persist the wizard in browser storage.

## Answer

User, 2026-10-31 ("yes for all"): option 1. Recorded in [PROP-DEC-023](../decisions/PROP-DEC-023-wizard-behaviour.md).
