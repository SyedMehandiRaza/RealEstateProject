# PROP-Q-022: How do staff members act on their employer's properties?

- **Status:** open
- **Blocks:** nothing in PROP-SPEC-001 (staff access is out of its scope)
- **Asked by:** grill round 1, 2026-10-31

## Context

STAFF-DEC-005 says staff act on the owner's properties through the staff module. The property module does not build that (PROP-DEC-011). To let a staff member open a property, the property service needs one answer from the staff module: "may account X act on property Y, with which permission?" The property module will not read or change staff tables itself.

## Options

1. (recommended) The staff module exports a function such as `canActOnProperty({ userId, propertyId, permission })`; the property module's access check calls it after the owner check, in a later ticket, once staff is merged.
2. The property module queries `staff_property_assignments` directly: couples the two modules.

## Answer

Open, for the staff module to answer. Property builds owner-only access now (PROP-DEC-011).
