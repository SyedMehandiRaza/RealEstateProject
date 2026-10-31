import { LIMITS } from '../limits.js';
import { commonMessages } from '../messages/common.messages.js';
import { propertyMessages as m } from '../messages/property.messages.js';

// Invalid inputs for the property schemas, each with the field it fails on and the shared message it must
// produce. The shared schema tests, the backend parity tests (sending each one to the API) and the
// frontend form tests replay the same tables (same format as authValidationCases.js):
// a case is { name, input, field, message }; `input` overrides the `valid` object, undefined means
// "field missing", and `field` is the dotted key in `error.fields` (`_form` for unknown keys).

const L = LIMITS.property;
const longText = (length) => 'a'.repeat(length);
const c = m.configuration;

const fieldCase = (field, value, message, extra = {}) => ({
  name: `${field}=${JSON.stringify(value) ?? 'missing'}`,
  input: { [field]: value, ...extra },
  field,
  message,
});

// Required trimmed text with a maximum length: missing, empty, blank, max + 1.
const textCases = (field, messages, max) => [
  fieldCase(field, undefined, messages.required),
  fieldCase(field, '', messages.required),
  fieldCase(field, '   ', messages.required),
  fieldCase(field, longText(max + 1), messages.max),
];

const enumCases = (field, message) => [
  fieldCase(field, undefined, message),
  fieldCase(field, 'not-a-value', message),
];

// Required number sent as a number or a form string: missing, empty, not a number.
const numberCases = (field, messages) => [
  fieldCase(field, undefined, messages.required),
  fieldCase(field, '', messages.required),
  fieldCase(field, 'abc', messages.invalid),
];

const countCases = (field, messages, max) => [
  ...numberCases(field, messages),
  fieldCase(field, 1.5, messages.whole),
  fieldCase(field, 0, messages.min),
  fieldCase(field, max + 1, messages.max),
];

const moneyCases = (field, messages) => [
  ...numberCases(field, messages),
  fieldCase(field, 0, messages.positive),
  fieldCase(field, -1, messages.positive),
  fieldCase(field, 1.234, messages.decimals),
  fieldCase(field, L.maxMoney + 1, messages.max),
];

const unknownKeyCase = {
  name: 'unknown key',
  input: { extra: 'x' },
  field: '_form',
  message: commonMessages.unknownField,
};

// --------------------------------------------------------------------------- properties

const propertyValid = {
  name: 'Sky Heights',
  propertyType: 'apartment',
  listingPurpose: 'sale',
  listingCategory: 'project',
  propertyStatus: 'under_construction',
  countryCode: 'IN',
  state: 'Madhya Pradesh',
  city: 'Bhopal',
  locality: 'Arera Colony',
  postalCode: '462016',
  address: '12 Main Road, Arera Colony',
  latitude: 23.215635,
  longitude: 77.430382,
  totalArea: 3,
  totalAreaUnit: 'acre',
  totalUnits: 120,
  towerCount: 2,
  floorCount: 12,
  startingPrice: 840000,
  yearBuilt: 2024,
  builderName: 'Sky Builders',
  description: 'Two towers with a garden and a clubhouse.',
  features: ['Swimming Pool', 'Gym', 'Lift'],
  possessionDate: '2026-12-01',
};

const propertyInvalid = [
  ...textCases('name', m.name, L.name.max),
  ...enumCases('propertyType', m.propertyType.invalid),
  ...enumCases('listingPurpose', m.listingPurpose.invalid),
  ...enumCases('listingCategory', m.listingCategory.invalid),
  ...enumCases('propertyStatus', m.propertyStatus.invalid),
  ...enumCases('countryCode', m.countryCode.invalid),
  fieldCase('countryCode', 'in', m.countryCode.invalid),
  ...textCases('state', m.state, L.state.max),
  ...textCases('city', m.city, L.city.max),
  ...textCases('locality', m.locality, L.locality.max),
  fieldCase('postalCode', undefined, m.postalCode.required),
  fieldCase('postalCode', '  ', m.postalCode.required),
  fieldCase('postalCode', '12', m.postalCode.invalid),
  fieldCase('postalCode', '12345678901', m.postalCode.invalid),
  fieldCase('postalCode', '-1234', m.postalCode.invalid),
  fieldCase('postalCode', '12#45', m.postalCode.invalid),
  ...textCases('address', m.address, L.address.max),
  fieldCase('latitude', undefined, m.location.required),
  fieldCase('latitude', 'abc', m.location.required),
  fieldCase('latitude', 90.000001, m.location.latitude),
  fieldCase('latitude', -91, m.location.latitude),
  fieldCase('latitude', 23.1234567, m.location.decimals),
  fieldCase('longitude', undefined, m.location.required),
  fieldCase('longitude', 180.5, m.location.longitude),
  fieldCase('longitude', -181, m.location.longitude),
  ...numberCases('totalArea', m.totalArea),
  fieldCase('totalArea', 0, m.totalArea.positive),
  fieldCase('totalArea', 1.005, m.totalArea.decimals),
  fieldCase('totalArea', L.maxMoney + 1, m.totalArea.max),
  ...enumCases('totalAreaUnit', m.totalAreaUnit.invalid),
  ...countCases('totalUnits', m.totalUnits, L.maxTotalUnits),
  ...countCases('towerCount', m.towerCount, L.maxSmallCount),
  ...countCases('floorCount', m.floorCount, L.maxSmallCount),
  ...moneyCases('startingPrice', m.startingPrice),
  ...numberCases('yearBuilt', m.yearBuilt),
  fieldCase('yearBuilt', 1799, m.yearBuilt.range),
  fieldCase('yearBuilt', 2101, m.yearBuilt.range),
  fieldCase('yearBuilt', 2000.5, m.yearBuilt.range),
  ...textCases('builderName', m.builderName, L.builderName.max),
  ...textCases('description', m.description, L.description.max),
  fieldCase('features', undefined, m.features.required),
  fieldCase('features', [], m.features.required),
  fieldCase(
    'features',
    Array.from({ length: L.features.max + 1 }, (_, i) => `Feature ${i}`),
    m.features.max,
  ),
  { ...fieldCase('features', ['Gym', '  '], m.features.item.required), field: 'features.1' },
  {
    ...fieldCase('features', ['Gym', longText(L.featureName.max + 1)], m.features.item.max),
    field: 'features.1',
  },
  { ...fieldCase('features', ['Gym', 'gym'], m.features.duplicate), field: 'features.1' },
  fieldCase('possessionDate', '2026-13-01', m.possessionDate.invalid),
  fieldCase('possessionDate', '2026-02-30', m.possessionDate.invalid),
  fieldCase('possessionDate', '01/12/2026', m.possessionDate.invalid),
  fieldCase('possessionDate', '2026-12-01', m.possessionDate.notAllowed, { propertyStatus: 'ready_to_move' }),
  unknownKeyCase,
];

// Edit Property (PUT /api/properties/:id).
export const updatePropertyCases = { valid: propertyValid, invalid: propertyInvalid };

const configurationValid = {
  name: '2 BHK Apartment',
  areaSqft: 850,
  price: 840000,
  totalUnits: 40,
  availableUnits: 12,
};

const configurationInvalid = [
  ...textCases('name', c.name, L.configurationName.max),
  ...numberCases('areaSqft', c.areaSqft),
  fieldCase('areaSqft', 0, c.areaSqft.positive),
  fieldCase('areaSqft', 10.123, c.areaSqft.decimals),
  fieldCase('areaSqft', L.maxConfigurationArea + 1, c.areaSqft.max),
  ...moneyCases('price', c.price),
  ...countCases('totalUnits', c.totalUnits, L.maxTotalUnits),
  ...numberCases('availableUnits', c.availableUnits),
  fieldCase('availableUnits', -1, c.availableUnits.whole),
  fieldCase('availableUnits', 1.5, c.availableUnits.whole),
  fieldCase('availableUnits', 41, c.availableUnits.exceedsTotal),
  unknownKeyCase,
];

// Add Configuration (POST /api/properties/:id/configurations).
export const createConfigurationCases = { valid: configurationValid, invalid: configurationInvalid };

// Edit configuration (PUT .../configurations/:configurationId).
export const updateConfigurationCases = {
  valid: { ...configurationValid, status: 'inactive' },
  invalid: [...configurationInvalid, ...enumCases('status', c.status.invalid)],
};

// Add Property Submit (POST /api/properties). Token values are placeholders: the shared schema only checks
// their presence and place; the backend tests swap in real tokens.
const createValid = {
  ...propertyValid,
  configurations: [{ ...configurationValid, floorPlans: ['token-floor-plan'] }],
  media: { images: ['token-image-1'], videos: [], tours: [] },
  documents: {
    reraCertificate: 'token-rera',
    floorPlan: 'token-floor',
    legalNoc: 'token-noc',
    ownershipProof: 'token-ownership',
  },
};

const withConfiguration = (overrides) => ({
  configurations: [{ ...createValid.configurations[0], ...overrides }],
});

export const createPropertyCases = {
  valid: createValid,
  invalid: [
    ...propertyInvalid,
    fieldCase('configurations', undefined, m.configurations.required),
    fieldCase('configurations', [], m.configurations.required),
    fieldCase(
      'configurations',
      Array.from({ length: L.configurations.max + 1 }, (_, i) => ({
        ...configurationValid,
        name: `Type ${i}`,
      })),
      m.configurations.max,
    ),
    {
      name: 'configuration name blank',
      input: withConfiguration({ name: ' ' }),
      field: 'configurations.0.name',
      message: c.name.required,
    },
    {
      name: 'configuration available > total',
      input: withConfiguration({ availableUnits: 41 }),
      field: 'configurations.0.availableUnits',
      message: c.availableUnits.exceedsTotal,
    },
    {
      name: 'too many floor plans',
      input: withConfiguration({
        floorPlans: Array.from({ length: L.maxFloorPlans + 1 }, (_, i) => `token-fp-${i}`),
      }),
      field: 'configurations.0.floorPlans',
      message: c.floorPlans.max,
    },
    {
      name: 'duplicate configuration names',
      input: {
        configurations: [configurationValid, { ...configurationValid, name: '2 bhk apartment' }],
      },
      field: 'configurations.1.name',
      message: c.nameDuplicate,
    },
    {
      name: 'no images',
      input: { media: { images: [] } },
      field: 'media.images',
      message: m.media.images.required,
    },
    {
      name: 'no media at all',
      input: { media: undefined },
      field: 'media.images',
      message: m.media.images.required,
    },
    {
      name: 'too many images',
      input: { media: { images: Array.from({ length: L.images.max + 1 }, (_, i) => `token-i-${i}`) } },
      field: 'media.images',
      message: m.media.images.max,
    },
    {
      name: 'too many videos',
      input: {
        media: {
          images: ['token-image-1'],
          videos: Array.from({ length: L.maxVideos + 1 }, (_, i) => `token-v-${i}`),
        },
      },
      field: 'media.videos',
      message: m.media.videos.max,
    },
    {
      name: 'too many tours',
      input: {
        media: {
          images: ['token-image-1'],
          tours: Array.from({ length: L.maxTours + 1 }, (_, i) => `token-t-${i}`),
        },
      },
      field: 'media.tours',
      message: m.media.tours.max,
    },
    {
      name: 'blank image token',
      input: { media: { images: [' '] } },
      field: 'media.images.0',
      message: m.uploadToken.required,
    },
    ...['reraCertificate', 'floorPlan', 'legalNoc', 'ownershipProof'].map((slot) => ({
      name: `missing ${slot}`,
      input: { documents: { ...createValid.documents, [slot]: undefined } },
      field: `documents.${slot}`,
      message:
        m.documents.required[
          {
            reraCertificate: 'rera_certificate',
            floorPlan: 'floor_plan',
            legalNoc: 'legal_noc',
            ownershipProof: 'ownership_proof',
          }[slot]
        ],
    })),
    {
      name: 'same token twice',
      input: { media: { images: ['token-image-1', 'token-image-1'] } },
      field: 'media.images.1',
      message: m.uploadToken.duplicate,
    },
    {
      name: 'token too long',
      input: { media: { images: [longText(L.uploadToken.max + 1)] } },
      field: 'media.images.0',
      message: m.uploadToken.invalid,
    },
  ],
};

// ---------------------------------------------------------------------------- amenities

const planValid = { planName: 'Basic', billingCycle: 'month', price: 100, features: 'Locker access' };
const amenityValid = {
  name: 'Gym',
  category: 'sports',
  pricingType: 'subscription',
  description: 'Fully equipped gym on the ground floor.',
  features: 'Cardio, weights, trainer on weekends',
  plans: [planValid],
};
const withPlan = (overrides) => ({ plans: [{ ...planValid, ...overrides }] });
const planCase = (field, value, message) => ({
  name: `plans.0.${field}=${JSON.stringify(value) ?? 'missing'}`,
  input: withPlan({ [field]: value }),
  field: `plans.0.${field}`,
  message,
});

const amenityInvalid = [
  ...textCases('name', m.amenity.name, L.amenityName.max),
  ...enumCases('category', m.amenity.category.invalid),
  ...enumCases('pricingType', m.amenity.pricingType.invalid),
  ...textCases('description', m.amenity.description, L.amenityDescription.max),
  ...textCases('features', m.amenity.features, L.amenityFeatures.max),
  fieldCase('plans', undefined, m.amenity.plans.required),
  fieldCase('plans', [], m.amenity.plans.required),
  fieldCase(
    'plans',
    Array.from({ length: L.plans.max + 1 }, (_, i) => ({ ...planValid, planName: `Plan ${i}` })),
    m.amenity.plans.max,
  ),
  planCase('planName', undefined, m.plan.planName.required),
  planCase('planName', '  ', m.plan.planName.required),
  planCase('planName', longText(L.planName.max + 1), m.plan.planName.max),
  planCase('billingCycle', 'year', m.plan.billingCycle.invalid),
  planCase('billingCycle', 'hour', m.plan.billingCycle.notForPricingType),
  {
    name: 'time based plan billed monthly',
    input: { pricingType: 'time_based', plans: [{ ...planValid, billingCycle: 'month' }] },
    field: 'plans.0.billingCycle',
    message: m.plan.billingCycle.notForPricingType,
  },
  planCase('price', undefined, m.plan.price.required),
  planCase('price', '', m.plan.price.required),
  planCase('price', 'abc', m.plan.price.invalid),
  planCase('price', -1, m.plan.price.min),
  planCase('price', 1.234, m.plan.price.decimals),
  planCase('price', L.maxMoney + 1, m.plan.price.max),
  planCase('features', longText(L.planFeatures.max + 1), m.plan.features.max),
  {
    name: 'same plan and cycle twice',
    input: { plans: [planValid, { ...planValid, planName: 'basic' }] },
    field: 'plans.1.planName',
    message: m.plan.duplicate,
  },
  unknownKeyCase,
];

export const createAmenityCases = { valid: amenityValid, invalid: amenityInvalid };
export const updateAmenityCases = {
  valid: { ...amenityValid, status: 'inactive' },
  invalid: [...amenityInvalid, ...enumCases('status', m.amenity.status.invalid)],
};

// ------------------------------------------------------------------ progress and updates

const progressValid = {
  overallPercent: 65,
  foundationPercent: 100,
  structurePercent: 80,
  interiorPercent: 40,
  finishingPercent: 0,
};

export const updateProgressCases = {
  valid: progressValid,
  invalid: [
    ...Object.entries(m.progress).flatMap(([field, messages]) => [
      ...numberCases(field, messages),
      fieldCase(field, -1, messages.range),
      fieldCase(field, 101, messages.range),
      fieldCase(field, 50.5, messages.range),
    ]),
    unknownKeyCase,
  ],
};

export const createUpdateCases = {
  valid: {
    title: 'Tower B slab complete',
    description: 'The 12th floor slab of Tower B was cast this week.',
  },
  invalid: [
    ...textCases('title', m.update.title, L.updateTitle.max),
    ...textCases('description', m.update.description, L.updateDescription.max),
    unknownKeyCase,
  ],
};

// -------------------------------------------------------------------------------- files

const MB = 1024 * 1024;

export const propertyFileCases = {
  valid: { purpose: 'image', fileName: 'front.jpg', mimeType: 'image/jpeg', sizeBytes: 2 * MB },
  invalid: [
    fieldCase('purpose', 'avatar', m.file.purpose.invalid),
    fieldCase('fileName', '  ', m.file.fileName.required),
    fieldCase('fileName', longText(L.fileName.max + 1), m.file.fileName.max),
    fieldCase('sizeBytes', 0, m.file.sizeBytes.empty),
    fieldCase('sizeBytes', 1.5, m.file.sizeBytes.invalid),
    fieldCase('sizeBytes', L.maxFileBytes + 1, m.file.sizeBytes.max),
    fieldCase('mimeType', 'application/pdf', m.file.mimeType.image),
    fieldCase('mimeType', 'video/mp4', m.file.mimeType.image, { purpose: 'update_image' }),
    fieldCase('mimeType', 'image/png', m.file.mimeType.video, { purpose: 'video', sizeBytes: 5 * MB }),
    fieldCase('mimeType', 'image/png', m.file.mimeType.video, { purpose: 'tour_360' }),
    fieldCase('mimeType', 'video/mp4', m.file.mimeType.document, { purpose: 'floor_plan' }),
    fieldCase('mimeType', 'image/gif', m.file.mimeType.document, { purpose: 'document' }),
    fieldCase('sizeBytes', L.maxVideoBytes + 1, m.file.sizeBytes.maxVideo, {
      purpose: 'video',
      mimeType: 'video/mp4',
    }),
    fieldCase('sizeBytes', L.maxFileBytes + 1, m.file.sizeBytes.max, {
      purpose: 'document',
      mimeType: 'application/pdf',
    }),
  ],
};
