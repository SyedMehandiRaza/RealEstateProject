// Auth enum values, shared by Zod schemas, Sequelize models and (as literals) the migrations.
// Changing a list here needs a migration that changes the matching MySQL ENUM; a backend test
// (models/__tests__/enumParity.test.js) fails if they drift apart.

// Every role an account can hold (DEC-019). Admins are created by seed only (DEC-021).
export const USER_ROLES = ['buyer', 'developer', 'admin'];

// Roles a person can pick on the Sign Up tabs (agent deferred, DEC-017).
export const SIGNUP_ROLES = ['buyer', 'developer'];

// Countries on "Select a country" (Figma), ISO 3166-1 alpha-2 (DEC-012).
export const COUNTRY_CODES = ['AE', 'SG', 'US', 'GB'];

// "Type of Developer" (professional_profiles.business_type).
export const DEVELOPER_TYPES = ['individual', 'company'];

// "Experience Level" in years; '10_plus' means more than 10 (DEC-021).
export const EXPERIENCE_LEVELS = ['0_2', '3_5', '6_10', '10_plus'];

// Upload slots on the developer Upload Document screen.
export const DOCUMENT_KINDS = ['government_id', 'company_registration_certificate', 'profile_photo'];

// "Select Document Type" for a Government ID.
export const ID_DOCUMENT_TYPES = ['driving_license', 'passport', 'pan_card'];

// "Supported formats: PDF, JPG, PNG". Profile Photo accepts only the image types (DEC-021).
export const DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png'];

// Review status of one verification document.
export const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'];
