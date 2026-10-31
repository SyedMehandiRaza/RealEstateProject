import { LIMITS } from '../limits.js';

const L = LIMITS.property;
const MB = 1024 * 1024;

// The usual messages of a required text field with a maximum length.
const text = (label, max) => ({
  required: `${label} is required`,
  max: `${label} must be at most ${max} characters`,
});

// The usual messages of a required number.
const number = (label) => ({
  required: `${label} is required`,
  invalid: `${label} must be a number`,
});

const wholeCount = (label, max) => ({
  ...number(label),
  whole: `${label} must be a whole number`,
  min: `${label} must be at least 1`,
  max: `${label} must be at most ${max}`,
});

const money = (label) => ({
  ...number(label),
  positive: `${label} must be greater than 0`,
  decimals: `${label} can have at most 2 decimals`,
  max: `${label} is too large`,
});

const percent = (label) => ({
  ...number(label),
  range: `${label} must be a whole number from ${L.percent.min} to ${L.percent.max}`,
});

// User-facing property messages (PROP-SPEC-001). Field messages are used by the Zod schemas; `api`
// messages are returned by the backend for rules the schemas cannot check (counts, duplicates in the
// database, the property's status).
export const propertyMessages = {
  name: text('Property name', L.name.max),
  propertyType: { invalid: 'Choose a property type' },
  listingPurpose: { invalid: 'Choose a listing purpose' },
  listingCategory: { invalid: 'Choose a listing category' },
  propertyStatus: { invalid: 'Choose a property status' },
  countryCode: { invalid: 'Choose a country' },
  state: text('State', L.state.max),
  city: text('City', L.city.max),
  locality: text('Locality / Area', L.locality.max),
  postalCode: {
    required: 'Pin / Postal code is required',
    invalid: `Enter a postal code of ${L.postalCode.min} to ${L.postalCode.max} letters, digits, spaces or hyphens`,
  },
  address: text('Address', L.address.max),
  location: {
    required: 'Pin the location on the map',
    latitude: 'Latitude must be between -90 and 90',
    longitude: 'Longitude must be between -180 and 180',
    decimals: 'Coordinates can have at most 6 decimals',
  },
  totalArea: {
    ...number('Total area'),
    positive: 'Total area must be greater than 0',
    decimals: 'Total area can have at most 2 decimals',
    max: 'Total area is too large',
  },
  totalAreaUnit: { invalid: 'Choose sq ft or acres' },
  totalUnits: wholeCount('Total units', L.maxTotalUnits),
  towerCount: wholeCount('Number of towers / blocks', L.maxSmallCount),
  floorCount: wholeCount('Number of floors', L.maxSmallCount),
  startingPrice: money('Starting price'),
  yearBuilt: {
    ...number('Year built'),
    range: `Year built must be a whole year from ${L.yearBuilt.min} to ${L.yearBuilt.max}`,
  },
  builderName: text('Developer / Builder name', L.builderName.max),
  description: text('Property description', L.description.max),
  features: {
    required: 'Add at least one amenity or feature',
    max: `Add at most ${L.features.max} amenities and features`,
    item: text('Amenity / feature', L.featureName.max),
    duplicate: 'This amenity or feature is already in the list',
  },
  possessionDate: {
    invalid: 'Enter a valid date',
    notAllowed: 'A possession date is only for properties under construction',
  },

  configurations: {
    required: 'Add at least one configuration',
    max: `Add at most ${L.configurations.max} configurations`,
  },
  configuration: {
    name: text('Configuration name', L.configurationName.max),
    nameDuplicate: 'Each configuration needs a different name',
    areaSqft: {
      ...number('Area'),
      positive: 'Area must be greater than 0',
      decimals: 'Area can have at most 2 decimals',
      max: 'Area is too large',
    },
    price: money('Price'),
    totalUnits: wholeCount('Total units', L.maxTotalUnits),
    availableUnits: {
      ...number('Available units'),
      whole: 'Available units must be a whole number of 0 or more',
      exceedsTotal: 'Available units cannot be more than total units',
    },
    status: { invalid: 'Choose Active or Inactive' },
    floorPlans: { max: `Add at most ${L.maxFloorPlans} floor plans` },
  },

  media: {
    images: {
      required: 'Add at least one property image',
      max: `Add at most ${L.images.max} images`,
    },
    videos: { max: `Add at most ${L.maxVideos} videos` },
    tours: { max: `Add at most ${L.maxTours} 360° tours` },
    mediaType: { invalid: 'Choose image, video or 360° tour' },
  },
  documents: {
    required: {
      rera_certificate: 'Upload the RERA certificate',
      floor_plan: 'Upload the floor plan',
      legal_noc: 'Upload the legal NOC',
      ownership_proof: 'Upload the ownership proof',
    },
    documentType: { invalid: 'Choose a document type' },
  },
  uploadToken: {
    required: 'Upload the file',
    invalid: 'This upload has expired, please upload the file again',
    duplicate: 'This file is already used in another field',
  },

  file: {
    required: 'Choose a file',
    purpose: { invalid: 'Choose what the file is for' },
    fileName: {
      required: 'The file needs a name',
      max: `The file name must be at most ${L.fileName.max} characters`,
    },
    sizeBytes: {
      invalid: 'The file size could not be read',
      empty: 'The file is empty',
      max: `The file must be at most ${L.maxFileBytes / MB} MB`,
      maxVideo: `The file must be at most ${L.maxVideoBytes / MB} MB`,
    },
    mimeType: {
      invalid: 'Unsupported file format',
      image: 'Upload a JPG or PNG image',
      video: 'Upload an MP4 video',
      document: 'Upload a PDF, JPG or PNG file',
    },
  },

  progress: {
    overallPercent: percent('Overall progress'),
    foundationPercent: percent('Foundation'),
    structurePercent: percent('Structure'),
    interiorPercent: percent('Interior'),
    finishingPercent: percent('Finishing'),
  },
  update: {
    title: text('Title', L.updateTitle.max),
    description: text('Description', L.updateDescription.max),
  },

  amenity: {
    name: text('Amenity name', L.amenityName.max),
    category: { invalid: 'Choose a category' },
    pricingType: { invalid: 'Choose a pricing type' },
    description: text('Amenity description', L.amenityDescription.max),
    features: text('Amenity features', L.amenityFeatures.max),
    status: { invalid: 'Choose Active or Inactive' },
    plans: {
      required: 'Add at least one plan',
      max: `Add at most ${L.plans.max} plans`,
    },
  },
  plan: {
    planName: text('Plan', L.planName.max),
    billingCycle: {
      invalid: 'Choose a billing cycle',
      notForPricingType: 'This billing cycle does not fit the pricing type',
    },
    price: {
      ...number('Price'),
      min: 'Price cannot be negative',
      decimals: 'Price can have at most 2 decimals',
      max: 'Price is too large',
    },
    features: { max: `Feature must be at most ${L.planFeatures.max} characters` },
    duplicate: 'This plan and billing cycle are already in the list',
  },

  query: {
    search: { max: `Search must be at most ${L.search.max} characters` },
    pageSize: { invalid: `Page size must be a whole number between 1 and ${L.pageSize.max}` },
    status: { invalid: 'Choose a valid status' },
    category: { invalid: 'Choose a valid category' },
    disposition: { invalid: 'Choose inline or attachment' },
  },

  // Returned by the API in error.message (409 CONFLICT) or error.fields.
  api: {
    configurationNameTaken: 'A configuration with this name already exists in this property',
    configurationsMax: `A property can have at most ${L.configurations.max} configurations`,
    configurationsLastOne: 'A property needs at least one configuration',
    floorPlansMax: `A configuration can have at most ${L.maxFloorPlans} floor plans`,
    mediaMax: {
      image: `A property can have at most ${L.images.max} images`,
      video: `A property can have at most ${L.maxVideos} videos`,
      tour_360: `A property can have at most ${L.maxTours} 360° tours`,
    },
    mediaLastImage: 'A property needs at least one image',
    documentTypeTaken: 'This document type is already uploaded; use Replace to change it',
    documentOtherMax: `A property can have at most ${L.maxOtherDocuments} other documents`,
    notUnderConstruction: 'Construction progress and updates are only for properties under construction',
    amenityNameTaken: 'An amenity with this name already exists in this property',
    propertyHasRecords: 'This property has records in other modules and cannot be deleted',
  },
};
