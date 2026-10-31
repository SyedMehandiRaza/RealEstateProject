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
  // Property (PROP-DEC-003 to PROP-DEC-010). Column lengths in 20261030212741-create-property-tables.cjs.
  property: {
    name: { min: 1, max: 150 }, // properties.name VARCHAR(150)
    state: { min: 1, max: 100 }, // properties.state VARCHAR(100)
    city: { min: 1, max: 100 }, // properties.city VARCHAR(100)
    locality: { min: 1, max: 150 }, // properties.locality VARCHAR(150)
    postalCode: { min: 3, max: 10 }, // properties.postal_code VARCHAR(10), chk_properties_postal_code
    address: { min: 1, max: 255 }, // properties.address VARCHAR(255)
    builderName: { min: 1, max: 150 }, // properties.builder_name VARCHAR(150)
    description: { min: 1, max: 5000 }, // properties.description TEXT
    yearBuilt: { min: 1800, max: 2100 }, // chk_properties_year_built
    configurationName: { min: 1, max: 100 }, // property_configurations.name VARCHAR(100)
    featureName: { min: 1, max: 100 }, // property_features.name VARCHAR(100)
    updateTitle: { min: 1, max: 150 }, // property_updates.title VARCHAR(150)
    updateDescription: { min: 1, max: 2000 }, // property_updates.description VARCHAR(2000)
    amenityName: { min: 1, max: 100 }, // property_amenities.name VARCHAR(100)
    amenityDescription: { min: 1, max: 1000 }, // property_amenities.description VARCHAR(1000)
    amenityFeatures: { min: 1, max: 1000 }, // property_amenities.features VARCHAR(1000)
    planName: { min: 1, max: 50 }, // property_amenity_plans.plan_name VARCHAR(50)
    planFeatures: { max: 255 }, // property_amenity_plans.features VARCHAR(255), optional
    percent: { min: 0, max: 100 }, // chk_property_construction_progress_percent
    fileName: { max: 255 }, // original_filename VARCHAR(255) on every property file table
    maxFileBytes: 10 * 1024 * 1024, // images, PDFs: "Max size: 10 MB"
    maxVideoBytes: 40 * 1024 * 1024, // videos, 360 tours: "Max size: 40 MB"
  },
  // Staff (STAFF-DEC-001 to STAFF-DEC-006). Same rules as the auth account fields, so a staff member can
  // become a user. Column lengths in 20261030212742-create-staff-tables.cjs.
  staff: {
    fullName: { min: 2, max: 100 }, // staff_members.full_name VARCHAR(100)
    email: { max: 254 }, // staff_members.email VARCHAR(254)
    phone: { max: 16 }, // staff_members.phone VARCHAR(16), E.164
    listPageSize: 10, // Staff List default page size (STAFF-DEC-010)
  },
};
