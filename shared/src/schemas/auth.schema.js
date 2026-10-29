import { z } from 'zod';
import {
  COUNTRY_CODES,
  DEVELOPER_TYPES,
  DOCUMENT_KINDS,
  DOCUMENT_MIME_TYPES,
  EXPERIENCE_LEVELS,
  ID_DOCUMENT_TYPES,
  PHOTO_MIME_TYPES,
  SIGNUP_ROLES,
} from '../enums/auth.enums.js';
import { LIMITS } from '../limits.js';
import { authMessages as m } from '../messages/auth.messages.js';
import { commonMessages } from '../messages/common.messages.js';

const L = LIMITS.auth;
const E164 = /^\+[1-9]\d{6,14}$/;
const byteLength = (value) => new TextEncoder().encode(value).length;

// A "required" check aborts the field, so an empty field shows only its "required" message.
// Request bodies reject unknown keys with the shared message (reported under `_form`).
export const strictBody = (shape) =>
  z.strictObject(shape, {
    error: (issue) => (issue.code === 'unrecognized_keys' ? commonMessages.unknownField : undefined),
  });

// ----------------------------------------------------------------------------- fields

// Stored lowercase; one account per email, compared case-insensitively (DEC-021).
const email = z
  .string({ error: m.email.required })
  .trim()
  .toLowerCase()
  .min(1, { error: m.email.required, abort: true })
  .max(L.email.max, m.email.max)
  .regex(z.regexes.email, m.email.invalid);

// Policy for a new password (DEC-021). The byte check matters for bcrypt with non-ASCII input.
const newPassword = z
  .string({ error: m.password.required })
  .min(1, { error: m.password.required, abort: true })
  .min(L.password.min, m.password.min)
  .max(L.password.max, m.password.max)
  .refine((value) => byteLength(value) <= L.password.max, m.password.max)
  .regex(/\p{L}/u, m.password.letter)
  .regex(/\d/, m.password.digit);

const confirmPassword = z
  .string({ error: m.confirmPassword.required })
  .min(1, { error: m.confirmPassword.required, abort: true });

const passwordsMatch = [
  (value) => value.password === value.confirmPassword,
  { path: ['confirmPassword'], error: m.confirmPassword.mismatch },
];

// Contact only: not unique, not a login identifier, never verified (DEC-022). Spaces and dashes
// are removed, then the number must be E.164: "+" and 7 to 15 digits.
const phone = z
  .string({ error: m.phone.required })
  .trim()
  .overwrite((value) => value.replace(/[\s-]/g, ''))
  .min(1, { error: m.phone.required, abort: true })
  .max(L.phone.max, m.phone.max)
  .regex(E164, m.phone.invalid);

const fullName = z
  .string({ error: m.fullName.required })
  .trim()
  .min(1, { error: m.fullName.required, abort: true })
  .min(L.fullName.min, m.fullName.min)
  .max(L.fullName.max, m.fullName.max);

const code = z
  .string({ error: m.code.required })
  .trim()
  .min(1, { error: m.code.required, abort: true })
  .regex(new RegExp(`^\\d{${L.codeLength}}$`), m.code.invalid);

// --------------------------------------------------------------------------- schemas

// Sign Up (Buyer or Developers tab). Same form for both roles.
export const signUpSchema = strictBody({
  role: z.enum(SIGNUP_ROLES, { error: m.role.invalid }),
  fullName,
  email,
  phone,
  password: newPassword,
  confirmPassword,
}).refine(...passwordsMatch);

// Verify screen, for both email verification and password reset; the route decides the purpose.
export const verifyCodeSchema = strictBody({ email, code });

// "Don't Receive the code? Resend".
export const resendCodeSchema = strictBody({ email });

// Log in: email only (DEC-022). The password is only checked for presence and size, never
// against the policy, so the form does not reveal the policy to someone guessing.
export const loginSchema = strictBody({
  email,
  password: z
    .string({ error: m.password.required })
    .min(1, { error: m.password.required, abort: true })
    .max(L.password.max, m.password.max),
});

// Forgot Password.
export const forgotPasswordSchema = strictBody({ email });

// Reset password. `resetToken` is the short-lived permission returned when the code is accepted.
export const resetPasswordSchema = strictBody({
  resetToken: z
    .string({ error: m.resetToken.required })
    .trim()
    .min(1, { error: m.resetToken.required, abort: true }),
  password: newPassword,
  confirmPassword,
}).refine(...passwordsMatch);

// Select a country (buyers only, DEC-021).
export const selectCountrySchema = strictBody({
  countryCode: z.enum(COUNTRY_CODES, { error: m.countryCode.invalid }),
});

// Professional info (developer). Company Name is optional, but required when the type is Company.
export const professionalInfoSchema = strictBody({
  companyName: z
    .string({ error: m.companyName.invalid })
    .trim()
    .max(L.companyName.max, m.companyName.max)
    .optional()
    .transform((value) => value || undefined),
  developerType: z.enum(DEVELOPER_TYPES, { error: m.developerType.invalid }),
  licenseNumber: z
    .string({ error: m.licenseNumber.required })
    .trim()
    .min(L.licenseNumber.min, { error: m.licenseNumber.required, abort: true })
    .max(L.licenseNumber.max, m.licenseNumber.max),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, { error: m.experienceLevel.invalid }),
  location: z
    .string({ error: m.location.required })
    .trim()
    .min(1, { error: m.location.required, abort: true })
    .min(L.location.min, m.location.min)
    .max(L.location.max, m.location.max),
}).refine((value) => value.developerType !== 'company' || Boolean(value.companyName), {
  path: ['companyName'],
  error: m.companyName.required,
});

// One uploaded document: the form fields plus the file's name, type and size. The backend builds
// this object from the multipart request, the frontend from the File, so both check the same rules.
// The server must still sniff the real file type (magic bytes); `mimeType` is what the client says.
export const documentUploadSchema = strictBody({
  documentKind: z.enum(DOCUMENT_KINDS, { error: m.documentKind.invalid }),
  idDocumentType: z.enum(ID_DOCUMENT_TYPES, { error: m.idDocumentType.required }).optional(),
  fileName: z
    .string({ error: m.fileName.required })
    .trim()
    .min(1, { error: m.fileName.required, abort: true })
    .max(L.fileName.max, m.fileName.max),
  mimeType: z.enum(DOCUMENT_MIME_TYPES, { error: m.mimeType.invalid }),
  sizeBytes: z
    .number({ error: m.sizeBytes.invalid })
    .int(m.sizeBytes.invalid)
    .min(1, m.sizeBytes.empty)
    .max(L.maxFileBytes, m.sizeBytes.max),
}).superRefine((value, ctx) => {
  const isGovernmentId = value.documentKind === 'government_id';
  if (isGovernmentId && !value.idDocumentType) {
    ctx.addIssue({ code: 'custom', path: ['idDocumentType'], message: m.idDocumentType.required });
  }
  if (!isGovernmentId && value.idDocumentType) {
    ctx.addIssue({ code: 'custom', path: ['idDocumentType'], message: m.idDocumentType.notAllowed });
  }
  if (value.documentKind === 'profile_photo' && !PHOTO_MIME_TYPES.includes(value.mimeType)) {
    ctx.addIssue({ code: 'custom', path: ['mimeType'], message: m.mimeType.photo });
  }
});
