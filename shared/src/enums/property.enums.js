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
