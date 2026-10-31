import { z } from 'zod';
import { STAFF_PERMISSIONS, STAFF_ROLES, STAFF_STATUSES } from '../enums/staff.enums.js';
import { LIMITS } from '../limits.js';
import { staffMessages as m } from '../messages/staff.messages.js';
import { strictBody } from './auth.schema.js';
import { idParamSchema, paginationQuerySchema } from './common.schema.js';

const L = LIMITS.staff;
const E164 = /^\+[1-9]\d{6,14}$/;

// Staff schemas (STAFF-SPEC-001). Name, email and phone follow the auth account rules (STAFF-DEC-012),
// so a staff member can later become a user. A "required" check aborts the field, so an empty field shows
// only its "required" message.

// ----------------------------------------------------------------------------- fields

const fullName = z
  .string({ error: m.fullName.required })
  .trim()
  .min(1, { error: m.fullName.required, abort: true })
  .min(L.fullName.min, m.fullName.min)
  .max(L.fullName.max, m.fullName.max);

// Stored lowercase; unique per employer (STAFF-DEC-004).
const email = z
  .string({ error: m.email.required })
  .trim()
  .toLowerCase()
  .min(1, { error: m.email.required, abort: true })
  .max(L.email.max, m.email.max)
  .regex(z.regexes.email, m.email.invalid);

// Spaces and dashes are removed, then the number must be E.164: "+" and 7 to 15 digits.
const phone = z
  .string({ error: m.phone.required })
  .trim()
  .overwrite((value) => value.replace(/[\s-]/g, ''))
  .min(1, { error: m.phone.required, abort: true })
  .max(L.phone.max, m.phone.max)
  .regex(E164, m.phone.invalid);

// Multi-select of the five areas, at least one (STAFF-DEC-012). Items are checked by refinements on the
// array, so every error lands on "permissions" (the form field), never on "permissions.0".
const permissions = z
  .array(z.unknown(), { error: m.permissions.required })
  .min(1, { error: m.permissions.required, abort: true })
  .refine((values) => values.every((value) => STAFF_PERMISSIONS.includes(value)), m.permissions.invalid)
  .refine((values) => new Set(values).size === values.length, m.permissions.duplicate);

const propertyId = z
  .number({ error: m.propertyId.invalid })
  .int(m.propertyId.invalid)
  .positive(m.propertyId.invalid);

// --------------------------------------------------------------------------- schemas

// Add Staff and Edit Staff (POST /api/staff, PUT /api/staff/:id). Status is not on this form.
export const staffMemberSchema = strictBody({
  fullName,
  email,
  phone,
  role: z.enum(STAFF_ROLES, { error: m.role.invalid }),
  permissions,
});

// Detail status dropdown (PATCH /api/staff/:id/status).
export const staffStatusSchema = strictBody({
  status: z.enum(STAFF_STATUSES, { error: m.status.invalid }),
});

// Assign Property picker (POST /api/staff/:id/properties).
export const assignPropertySchema = strictBody({ propertyId });

// Staff List (GET /api/staff): the common page rules, 10 per page by default (STAFF-DEC-010), no other keys.
export const staffListQuerySchema = strictBody({
  page: paginationQuerySchema.shape.page,
  pageSize: paginationQuerySchema.shape.pageSize.unwrap().default(L.listPageSize),
});

// Unassign (DELETE /api/staff/:id/properties/:propertyId).
export const staffPropertyParamsSchema = z.strictObject({
  id: idParamSchema.shape.id,
  propertyId: z.coerce
    .number({ error: m.propertyId.invalid })
    .int(m.propertyId.invalid)
    .positive(m.propertyId.invalid),
});
