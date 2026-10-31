// Property enum values, shared by Zod schemas, Sequelize models and (as literals) the migration
// 20261030212741-create-property-tables.cjs. Changing a list here needs a migration that changes the
// matching MySQL ENUM; models/__tests__/propertyEnumParity.test.js in backend/ fails if they drift apart.
// The lists are the provisional answers of 2026-10-31 (PROP-DEC-003 to PROP-DEC-010).

// "Property Type" dropdown (properties.property_type).
export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'studio',
  'farmland',
  'townhouse',
  'plot',
  'shops',
  'duplex',
];

// "Listing Purpose": For Sale / For Rent.
export const LISTING_PURPOSES = ['sale', 'rent'];

// "Listing Category": Single Property / Project.
export const LISTING_CATEGORIES = ['single_property', 'project'];

// "Property Status" (PROP-Q-004). Under construction unlocks progress and updates.
export const PROPERTY_STATUSES = ['ready_to_move', 'under_construction'];

// Unit of "Total Area" (PROP-Q-006). Configuration areas are always square feet.
export const AREA_UNITS = ['sq_ft', 'acre'];

// Status of a configuration (PROP-Q-009). "Available" is derived from available units.
export const CONFIGURATION_STATUSES = ['active', 'inactive'];

// Gallery groups: "Property Images", "Videos", "360° Tour" (property_media.media_type).
export const PROPERTY_MEDIA_TYPES = ['image', 'video', 'tour_360'];

// Formats of a gallery file (PROP-Q-016): images JPG/PNG, videos and 360 tours MP4.
export const PROPERTY_MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];

// Formats of a floor plan, a property document or an update image: "PDF, JPG, PNG".
export const PROPERTY_FILE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Upload slots of Add Property step 5, plus "Financial" from the Documents tab (PROP-Q-010).
export const PROPERTY_DOCUMENT_TYPES = [
  'rera_certificate',
  'floor_plan',
  'legal_noc',
  'ownership_proof',
  'financial_statement',
  'other',
];

// Document badges (PROP-Q-010). Set by the server and an Admin review, never by the developer.
export const PROPERTY_DOCUMENT_STATUSES = ['uploaded', 'pending', 'verified'];

// Bookable amenities (PROP-Q-012).
export const AMENITY_CATEGORIES = ['sports', 'event', 'parking'];
export const AMENITY_PRICING_TYPES = ['subscription', 'time_based'];
export const AMENITY_STATUSES = ['active', 'inactive'];
export const AMENITY_BILLING_CYCLES = ['hour', 'day', 'month'];

// Countries a property can be in (PROP-Q-033, assumed): the auth countries plus India. The column only
// checks the ISO format, so adding a country needs no migration.
export const PROPERTY_COUNTRY_CODES = ['AE', 'GB', 'IN', 'SG', 'US'];

// Category shown in the Documents tab, derived from the type (PROP-DEC-008).
export const PROPERTY_DOCUMENT_CATEGORIES = ['legal', 'architecture', 'financial', 'other'];
export const PROPERTY_DOCUMENT_CATEGORY_BY_TYPE = {
  rera_certificate: 'legal',
  floor_plan: 'architecture',
  legal_noc: 'legal',
  ownership_proof: 'legal',
  financial_statement: 'financial',
  other: 'other',
};

// Upload slots of Add Property step 5 (request keys -> document_type). All but `other` are required on
// Submit; financial_statement is added only in the Documents tab (PROP-DEC-019).
export const WIZARD_DOCUMENT_SLOTS = {
  reraCertificate: 'rera_certificate',
  floorPlan: 'floor_plan',
  legalNoc: 'legal_noc',
  ownershipProof: 'ownership_proof',
  other: 'other',
};
export const REQUIRED_PROPERTY_DOCUMENT_TYPES = [
  'rera_certificate',
  'floor_plan',
  'legal_noc',
  'ownership_proof',
];

// What a file is for: decides its formats and size. The first five can be staged for the wizard and
// come back as upload tokens (PROP-DEC-012); update images are sent with their update.
export const PROPERTY_FILE_PURPOSES = [
  'image',
  'video',
  'tour_360',
  'floor_plan',
  'document',
  'update_image',
];
export const PROPERTY_UPLOAD_PURPOSES = ['image', 'video', 'tour_360', 'floor_plan', 'document'];
export const PROPERTY_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

// Billing cycles each pricing type allows (PROP-DEC-020).
export const AMENITY_BILLING_CYCLES_BY_PRICING_TYPE = {
  subscription: ['month'],
  time_based: ['hour', 'day'],
};

// Construction phases, in display order (PROP-DEC-010).
export const CONSTRUCTION_PHASES = ['foundation', 'structure', 'interior', 'finishing'];
