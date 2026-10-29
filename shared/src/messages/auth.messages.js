import { LIMITS } from '../limits.js';

const L = LIMITS.auth;

// User-facing auth messages. Field messages are used by the Zod schemas; `api` messages are
// returned by the backend for failures that are not about one field (DEC-021, DEC-022).
export const authMessages = {
  role: {
    invalid: 'Choose Buyer or Developer',
  },
  fullName: {
    required: 'Full name is required',
    min: `Full name must be at least ${L.fullName.min} characters`,
    max: `Full name must be at most ${L.fullName.max} characters`,
  },
  email: {
    required: 'Email is required',
    max: `Email must be at most ${L.email.max} characters`,
    invalid: 'Enter a valid email address',
  },
  phone: {
    required: 'Phone number is required',
    max: 'Phone number is too long',
    invalid: 'Enter the phone number with its country code, for example +971 50 123 4567',
  },
  password: {
    required: 'Password is required',
    min: `Password must be at least ${L.password.min} characters`,
    max: `Password must be at most ${L.password.max} characters`,
    letter: 'Password must contain at least one letter',
    digit: 'Password must contain at least one number',
  },
  confirmPassword: {
    required: 'Please confirm your password',
    mismatch: 'Passwords do not match',
  },
  code: {
    required: `Enter the ${L.codeLength}-digit code`,
    invalid: `The code must be ${L.codeLength} digits`,
  },
  resetToken: {
    required: 'Your password reset session has expired. Please request a new code',
  },
  countryCode: {
    invalid: 'Select a country',
  },
  companyName: {
    invalid: 'Enter a valid company name',
    required: 'Company name is required for a company',
    max: `Company name must be at most ${L.companyName.max} characters`,
  },
  developerType: {
    invalid: 'Select the type of developer',
  },
  licenseNumber: {
    required: 'License / registration number is required',
    max: `License / registration number must be at most ${L.licenseNumber.max} characters`,
  },
  experienceLevel: {
    invalid: 'Select your experience level',
  },
  location: {
    required: 'Location is required',
    min: `Location must be at least ${L.location.min} characters`,
    max: `Location must be at most ${L.location.max} characters`,
  },
  documentKind: {
    invalid: 'Choose which document you are uploading',
  },
  idDocumentType: {
    required: 'Select the document type',
    notAllowed: 'Document type applies only to a government ID',
  },
  fileName: {
    required: 'The file must have a name',
    max: `File name must be at most ${L.fileName.max} characters`,
  },
  mimeType: {
    invalid: 'Upload a PDF, JPG or PNG file',
    photo: 'Profile photo must be a JPG or PNG image',
  },
  sizeBytes: {
    invalid: 'The file size could not be read',
    empty: 'The file is empty',
    max: 'The file must be 10 MB or smaller',
  },
  // POST /me/documents (Q-036, wording assumed): a required kind with no document yet, reported at
  // `documents.<kind>.file`. Keyed by DOCUMENT_KINDS.
  documents: {
    required: {
      government_id: 'Upload your Government ID',
      company_registration_certificate: 'Upload your Company Registration Certificate',
      profile_photo: 'Upload your Profile Photo',
    },
  },
  api: {
    invalidCredentials: 'Invalid email or password',
    emailTaken: 'This email is already registered. Log in instead',
    codeInvalid: 'The code is incorrect or has expired',
    codeTooManyAttempts: 'Too many wrong attempts. Please request a new code',
    resendTooSoon: (seconds) => `Please wait ${seconds} seconds before requesting a new code`,
    resendLimit: 'Too many codes requested. Please try again later',
    emailNotVerified: 'Please verify your email. We have sent you a new code',
    passwordChanged: 'Password changed. Please log in',
    documentsUnderReview: 'Your account is under review',
    // 409 CONFLICT for a document kind whose latest upload is pending or approved (Q-036, wording assumed).
    documentAlreadySubmitted: 'This document is already under review or approved',
  },
};
