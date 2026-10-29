// Numeric limits shared by Zod schemas and DB migrations (VARCHAR lengths must equal these).
export const LIMITS = {
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  // Auth (DEC-021, DEC-022). Column lengths in 20261028183255-create-auth-tables.cjs.
  auth: {
    fullName: { min: 2, max: 100 }, // users.full_name VARCHAR(100)
    email: { max: 254 }, // users.email VARCHAR(254)
    phone: { max: 16 }, // users.phone VARCHAR(16), E.164
    password: { min: 8, max: 72 }, // bcrypt reads at most 72 bytes
    codeLength: 6,
    companyName: { max: 150 }, // professional_profiles.organization_name VARCHAR(150)
    licenseNumber: { min: 1, max: 50 }, // professional_profiles.license_number VARCHAR(50)
    location: { min: 2, max: 150 }, // professional_profiles.location VARCHAR(150)
    fileName: { max: 255 }, // verification_documents.original_filename VARCHAR(255)
    maxFileBytes: 10 * 1024 * 1024, // chk_verification_documents_size, "Max size: 10 MB"
    rejectionReason: { min: 3, max: 500 }, // verification_documents.rejection_reason VARCHAR(500)
  },
};
