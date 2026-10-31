import { z } from 'zod';
import {
  AMENITY_BILLING_CYCLES,
  AMENITY_BILLING_CYCLES_BY_PRICING_TYPE,
  AMENITY_CATEGORIES,
  AMENITY_PRICING_TYPES,
  AMENITY_STATUSES,
  AREA_UNITS,
  CONFIGURATION_STATUSES,
  LISTING_CATEGORIES,
  LISTING_PURPOSES,
  PROPERTY_COUNTRY_CODES,
  PROPERTY_DOCUMENT_CATEGORIES,
  PROPERTY_DOCUMENT_STATUSES,
  PROPERTY_DOCUMENT_TYPES,
  PROPERTY_FILE_MIME_TYPES,
  PROPERTY_FILE_PURPOSES,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_MEDIA_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_UPLOAD_PURPOSES,
  WIZARD_DOCUMENT_SLOTS,
} from '../enums/property.enums.js';
import { LIMITS } from '../limits.js';
import { commonMessages } from '../messages/common.messages.js';
import { propertyMessages as m } from '../messages/property.messages.js';
import { strictBody } from './auth.schema.js';

// Zod schemas of the property module (PROP-SPEC-001). Every message comes from property.messages.js.
// Request bodies are strict (unknown keys -> `_form`); queries ignore unknown keys.

const L = LIMITS.property;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const POSTAL_CODE = /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/;

// ------------------------------------------------------------------------------ helpers

const blankToUndefined = (value) =>
  value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value;

// Form inputs send numbers as strings: "" (or nothing) is "required", "abc" is "must be a number".
const toNumber = (value) => {
  const present = blankToUndefined(value);
  return typeof present === 'string' ? Number(present.trim()) : present;
};
const num = (messages) =>
  z.preprocess(
    toNumber,
    z.number({ error: (issue) => (issue.input === undefined ? messages.required : messages.invalid) }),
  );

const hasDecimals = (places) => (value) => Number(value.toFixed(places)) === value;

const text = (messages, max) =>
  z
    .string({ error: messages.required })
    .trim()
    .min(1, { error: messages.required, abort: true })
    .max(max, messages.max);

const optionalEnum = (values, message) =>
  z.preprocess(blankToUndefined, z.enum(values, { error: message }).optional());

const isRealDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const id = z.coerce
  .number({ error: commonMessages.id.invalid })
  .int(commonMessages.id.invalid)
  .positive(commonMessages.id.invalid);

const uploadToken = (requiredMessage = m.uploadToken.required) =>
  z
    .string({ error: requiredMessage })
    .trim()
    .min(1, { error: requiredMessage, abort: true })
    .max(L.uploadToken.max, m.uploadToken.invalid);

// Adds `message` at the path of every later copy of a value (compared by `keyOf`).
function flagDuplicates(ctx, items, keyOf, pathOf, message) {
  const seen = new Set();
  items.forEach((item, index) => {
    const key = keyOf(item);
    if (key === undefined) return;
    if (seen.has(key)) ctx.addIssue({ code: 'custom', path: pathOf(index), message });
    seen.add(key);
  });
}
const lower = (value) => (typeof value === 'string' ? value.toLowerCase() : undefined);

// ------------------------------------------------------------------------------- fields

const wholeCount = (messages, max) =>
  num(messages).pipe(z.number().int(messages.whole).min(1, messages.min).max(max, messages.max));

const money = (messages) =>
  num(messages).pipe(
    z
      .number()
      .positive(messages.positive)
      .max(L.maxMoney, messages.max)
      .refine(hasDecimals(2), messages.decimals),
  );

const coordinate = (limit, rangeMessage) =>
  num({ required: m.location.required, invalid: m.location.required }).pipe(
    z.number().min(-limit, rangeMessage).max(limit, rangeMessage).refine(hasDecimals(6), m.location.decimals),
  );

const features = z
  .array(text(m.features.item, L.featureName.max), { error: m.features.required })
  .min(L.features.min, m.features.required)
  .max(L.features.max, m.features.max)
  .superRefine((items, ctx) => flagDuplicates(ctx, items, lower, (i) => [i], m.features.duplicate));

const possessionDate = z.preprocess(
  blankToUndefined,
  z
    .string({ error: m.possessionDate.invalid })
    .regex(DATE, m.possessionDate.invalid)
    .refine(isRealDate, m.possessionDate.invalid)
    .optional(),
);

// Steps 1 and 2 of Add Property, and Edit Property (PROP-DEC-015).
const propertyFields = {
  name: text(m.name, L.name.max),
  propertyType: z.enum(PROPERTY_TYPES, { error: m.propertyType.invalid }),
  listingPurpose: z.enum(LISTING_PURPOSES, { error: m.listingPurpose.invalid }),
  listingCategory: z.enum(LISTING_CATEGORIES, { error: m.listingCategory.invalid }),
  propertyStatus: z.enum(PROPERTY_STATUSES, { error: m.propertyStatus.invalid }),
  countryCode: z.enum(PROPERTY_COUNTRY_CODES, { error: m.countryCode.invalid }),
  state: text(m.state, L.state.max),
  city: text(m.city, L.city.max),
  locality: text(m.locality, L.locality.max),
  postalCode: z
    .string({ error: m.postalCode.required })
    .trim()
    .min(1, { error: m.postalCode.required, abort: true })
    .regex(POSTAL_CODE, m.postalCode.invalid),
  address: text(m.address, L.address.max),
  latitude: coordinate(90, m.location.latitude),
  longitude: coordinate(180, m.location.longitude),
  totalArea: num(m.totalArea).pipe(
    z
      .number()
      .positive(m.totalArea.positive)
      .max(L.maxMoney, m.totalArea.max)
      .refine(hasDecimals(2), m.totalArea.decimals),
  ),
  totalAreaUnit: z.enum(AREA_UNITS, { error: m.totalAreaUnit.invalid }),
  totalUnits: wholeCount(m.totalUnits, L.maxTotalUnits),
  towerCount: wholeCount(m.towerCount, L.maxSmallCount),
  floorCount: wholeCount(m.floorCount, L.maxSmallCount),
  startingPrice: money(m.startingPrice),
  yearBuilt: num(m.yearBuilt).pipe(
    z
      .number()
      .int(m.yearBuilt.range)
      .min(L.yearBuilt.min, m.yearBuilt.range)
      .max(L.yearBuilt.max, m.yearBuilt.range),
  ),
  builderName: text(m.builderName, L.builderName.max),
  description: text(m.description, L.description.max),
  features,
  possessionDate,
};

const possessionOnlyUnderConstruction = (value, ctx) => {
  if (value.possessionDate !== undefined && value.propertyStatus !== 'under_construction') {
    ctx.addIssue({ code: 'custom', path: ['possessionDate'], message: m.possessionDate.notAllowed });
  }
};

// A configuration's own fields (Add Configuration modal, wizard step 3).
const c = m.configuration;
const configurationFields = {
  name: text(c.name, L.configurationName.max),
  areaSqft: num(c.areaSqft).pipe(
    z
      .number()
      .positive(c.areaSqft.positive)
      .max(L.maxConfigurationArea, c.areaSqft.max)
      .refine(hasDecimals(2), c.areaSqft.decimals),
  ),
  price: money(c.price),
  totalUnits: wholeCount(c.totalUnits, L.maxTotalUnits),
  availableUnits: num(c.availableUnits).pipe(
    z.number().int(c.availableUnits.whole).min(0, c.availableUnits.whole),
  ),
};

const availableWithinTotal = (value, ctx) => {
  if (
    typeof value.availableUnits === 'number' &&
    typeof value.totalUnits === 'number' &&
    value.availableUnits > value.totalUnits
  ) {
    ctx.addIssue({ code: 'custom', path: ['availableUnits'], message: c.availableUnits.exceedsTotal });
  }
};

// --------------------------------------------------------------------------- properties

// Edit Property: PUT /api/properties/:id (PROP-DEC-015).
export const updatePropertySchema = strictBody(propertyFields).superRefine(possessionOnlyUnderConstruction);

const wizardConfiguration = strictBody({
  ...configurationFields,
  floorPlans: z
    .array(uploadToken(), { error: m.uploadToken.required })
    .max(L.maxFloorPlans, c.floorPlans.max)
    .default([]),
}).superRefine(availableWithinTotal);

const tokenList = (max, maxMessage) =>
  z.array(uploadToken(), { error: m.uploadToken.required }).max(max, maxMessage).default([]);

const wizardMedia = z.preprocess(
  (value) => value ?? {},
  strictBody({
    images: z
      .array(uploadToken(), { error: m.media.images.required })
      .min(L.images.min, m.media.images.required)
      .max(L.images.max, m.media.images.max),
    videos: tokenList(L.maxVideos, m.media.videos.max),
    tours: tokenList(L.maxTours, m.media.tours.max),
  }),
);

const wizardDocuments = z.preprocess(
  (value) => value ?? {},
  strictBody(
    Object.fromEntries(
      Object.entries(WIZARD_DOCUMENT_SLOTS).map(([slot, type]) => [
        slot,
        type === 'other' ? uploadToken().optional() : uploadToken(m.documents.required[type]),
      ]),
    ),
  ),
);

// Every upload token of a create body with its dotted path, in request order.
function tokenPaths(value) {
  const paths = [];
  (value.configurations ?? []).forEach((configuration, i) =>
    (configuration?.floorPlans ?? []).forEach((token, j) =>
      paths.push([token, ['configurations', i, 'floorPlans', j]]),
    ),
  );
  for (const group of ['images', 'videos', 'tours']) {
    (value.media?.[group] ?? []).forEach((token, i) => paths.push([token, ['media', group, i]]));
  }
  for (const slot of Object.keys(WIZARD_DOCUMENT_SLOTS)) {
    if (value.documents?.[slot] !== undefined) paths.push([value.documents[slot], ['documents', slot]]);
  }
  return paths;
}

// Add Property Submit: POST /api/properties (PROP-DEC-005, -012, -017, -018, -019).
export const createPropertySchema = strictBody({
  ...propertyFields,
  configurations: z
    .array(wizardConfiguration, { error: m.configurations.required })
    .min(L.configurations.min, m.configurations.required)
    .max(L.configurations.max, m.configurations.max),
  media: wizardMedia,
  documents: wizardDocuments,
}).superRefine((value, ctx) => {
  possessionOnlyUnderConstruction(value, ctx);
  flagDuplicates(
    ctx,
    value.configurations ?? [],
    (configuration) => lower(configuration?.name),
    (i) => ['configurations', i, 'name'],
    c.nameDuplicate,
  );
  const tokens = tokenPaths(value);
  flagDuplicates(
    ctx,
    tokens,
    ([token]) => token,
    (i) => tokens[i][1],
    m.uploadToken.duplicate,
  );
});

// The fields of each wizard step, so the wizard can validate a step on Next (PROP-DEC-023). The step
// schemas are the matching parts of createPropertySchema, not a second set of rules.
export const PROPERTY_WIZARD_STEP_FIELDS = {
  basicInformation: [
    'name',
    'propertyType',
    'listingPurpose',
    'listingCategory',
    'propertyStatus',
    'countryCode',
    'state',
    'city',
    'locality',
    'postalCode',
    'address',
    'latitude',
    'longitude',
  ],
  propertyDetails: [
    'totalArea',
    'totalAreaUnit',
    'totalUnits',
    'towerCount',
    'floorCount',
    'startingPrice',
    'yearBuilt',
    'builderName',
    'description',
    'features',
    'possessionDate',
  ],
  configurations: ['configurations'],
  media: ['media'],
  documents: ['documents'],
};

// GET /api/properties (PROP-DEC-014).
const pageSize = (defaultSize) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: m.query.pageSize.invalid })
      .int(m.query.pageSize.invalid)
      .min(1, m.query.pageSize.invalid)
      .max(L.pageSize.max, m.query.pageSize.invalid)
      .default(defaultSize),
  );
const page = z.preprocess(
  blankToUndefined,
  z.coerce
    .number({ error: commonMessages.page.invalid })
    .int(commonMessages.page.invalid)
    .min(1, commonMessages.page.invalid)
    .default(1),
);
const search = z
  .string({ error: m.query.search.max })
  .trim()
  .max(L.search.max, m.query.search.max)
  .optional()
  .transform((value) => value || undefined);

export const propertyListQuerySchema = z.object({ page, pageSize: pageSize(L.pageSize.properties), search });

// ------------------------------------------------------------------------------- params

export const propertyParamsSchema = z.strictObject({ id });
export const configurationParamsSchema = z.strictObject({ id, configurationId: id });
export const floorPlanParamsSchema = z.strictObject({ id, configurationId: id, floorPlanId: id });
export const mediaParamsSchema = z.strictObject({ id, mediaId: id });
export const documentParamsSchema = z.strictObject({ id, documentId: id });
export const updateParamsSchema = z.strictObject({ id, updateId: id });
export const amenityParamsSchema = z.strictObject({ id, amenityId: id });

// -------------------------------------------------------------------------------- files

const ALLOWED_MIME_TYPES = {
  image: [PROPERTY_IMAGE_MIME_TYPES, m.file.mimeType.image],
  update_image: [PROPERTY_IMAGE_MIME_TYPES, m.file.mimeType.image],
  video: [['video/mp4'], m.file.mimeType.video],
  tour_360: [['video/mp4'], m.file.mimeType.video],
  floor_plan: [PROPERTY_FILE_MIME_TYPES, m.file.mimeType.document],
  document: [PROPERTY_FILE_MIME_TYPES, m.file.mimeType.document],
};
const isVideoPurpose = (purpose) => purpose === 'video' || purpose === 'tour_360';

// One file, described by what it is for. The backend builds this object from the multipart part (with
// the type it sniffed from the bytes), the frontend from the File; both check the same rules.
export const propertyFileSchema = strictBody({
  purpose: z.enum(PROPERTY_FILE_PURPOSES, { error: m.file.purpose.invalid }),
  fileName: z
    .string({ error: m.file.fileName.required })
    .trim()
    .min(1, { error: m.file.fileName.required, abort: true })
    .max(L.fileName.max, m.file.fileName.max),
  mimeType: z.string({ error: m.file.mimeType.invalid }),
  sizeBytes: z
    .number({ error: m.file.sizeBytes.invalid })
    .int(m.file.sizeBytes.invalid)
    .min(1, m.file.sizeBytes.empty),
}).superRefine((value, ctx) => {
  const allowed = ALLOWED_MIME_TYPES[value.purpose];
  if (!allowed) return;
  const [mimeTypes, message] = allowed;
  if (!mimeTypes.includes(value.mimeType)) ctx.addIssue({ code: 'custom', path: ['mimeType'], message });
  const [max, maxMessage] = isVideoPurpose(value.purpose)
    ? [L.maxVideoBytes, m.file.sizeBytes.maxVideo]
    : [L.maxFileBytes, m.file.sizeBytes.max];
  if (Number.isInteger(value.sizeBytes) && value.sizeBytes > max) {
    ctx.addIssue({ code: 'custom', path: ['sizeBytes'], message: maxMessage });
  }
});

// Text fields of the multipart routes (the file part is checked with propertyFileSchema).
export const stagedUploadFieldsSchema = strictBody({
  purpose: z.enum(PROPERTY_UPLOAD_PURPOSES, { error: m.file.purpose.invalid }),
});
export const mediaUploadFieldsSchema = strictBody({
  mediaType: z.enum(PROPERTY_MEDIA_TYPES, { error: m.media.mediaType.invalid }),
});
export const documentUploadFieldsSchema = strictBody({
  documentType: z.enum(PROPERTY_DOCUMENT_TYPES, { error: m.documents.documentType.invalid }),
});

// ----------------------------------------------------------------------- configurations

// POST /api/properties/:id/configurations (Add Configuration modal).
export const createConfigurationSchema = strictBody(configurationFields).superRefine(availableWithinTotal);

// PUT /api/properties/:id/configurations/:configurationId (Edit, with status; PROP-DEC-017).
export const updateConfigurationSchema = strictBody({
  ...configurationFields,
  status: z.enum(CONFIGURATION_STATUSES, { error: c.status.invalid }),
}).superRefine(availableWithinTotal);

// ---------------------------------------------------------------------------- documents

export const documentListQuerySchema = z.object({
  status: optionalEnum(PROPERTY_DOCUMENT_STATUSES, m.query.status.invalid),
  category: optionalEnum(PROPERTY_DOCUMENT_CATEGORIES, m.query.category.invalid),
});

export const documentUrlQuerySchema = z.object({
  disposition: z.preprocess(
    blankToUndefined,
    z.enum(['inline', 'attachment'], { error: m.query.disposition.invalid }).default('inline'),
  ),
});

// ------------------------------------------------------------------ progress and updates

const percent = (messages) =>
  num(messages).pipe(
    z.number().int(messages.range).min(L.percent.min, messages.range).max(L.percent.max, messages.range),
  );

// PUT /api/properties/:id/progress: all five values (PROP-DEC-021).
export const updateProgressSchema = strictBody(
  Object.fromEntries(Object.entries(m.progress).map(([field, messages]) => [field, percent(messages)])),
);

// Text fields of Add Update (multipart; the optional image is checked with propertyFileSchema).
export const createUpdateSchema = strictBody({
  title: text(m.update.title, L.updateTitle.max),
  description: text(m.update.description, L.updateDescription.max),
});

export const updateListQuerySchema = z.object({ page, pageSize: pageSize(L.pageSize.updates) });

// ---------------------------------------------------------------------------- amenities

const planSchema = strictBody({
  planName: text(m.plan.planName, L.planName.max),
  billingCycle: z.enum(AMENITY_BILLING_CYCLES, { error: m.plan.billingCycle.invalid }),
  price: num(m.plan.price).pipe(
    z
      .number()
      .min(0, m.plan.price.min)
      .max(L.maxMoney, m.plan.price.max)
      .refine(hasDecimals(2), m.plan.price.decimals),
  ),
  features: z.preprocess(
    blankToUndefined,
    z.string({ error: m.plan.features.max }).trim().max(L.planFeatures.max, m.plan.features.max).optional(),
  ),
});

const amenityFields = {
  name: text(m.amenity.name, L.amenityName.max),
  category: z.enum(AMENITY_CATEGORIES, { error: m.amenity.category.invalid }),
  pricingType: z.enum(AMENITY_PRICING_TYPES, { error: m.amenity.pricingType.invalid }),
  description: text(m.amenity.description, L.amenityDescription.max),
  features: text(m.amenity.features, L.amenityFeatures.max),
  plans: z
    .array(planSchema, { error: m.amenity.plans.required })
    .min(L.plans.min, m.amenity.plans.required)
    .max(L.plans.max, m.amenity.plans.max),
};

// Billing cycles must fit the pricing type; plan name + cycle is unique inside the amenity (PROP-DEC-020).
const plansFitPricingType = (value, ctx) => {
  const allowed = AMENITY_BILLING_CYCLES_BY_PRICING_TYPE[value.pricingType];
  const plans = value.plans ?? [];
  if (allowed) {
    plans.forEach((plan, i) => {
      if (plan?.billingCycle && !allowed.includes(plan.billingCycle)) {
        ctx.addIssue({
          code: 'custom',
          path: ['plans', i, 'billingCycle'],
          message: m.plan.billingCycle.notForPricingType,
        });
      }
    });
  }
  flagDuplicates(
    ctx,
    plans,
    (plan) =>
      plan?.planName && plan?.billingCycle ? `${lower(plan.planName)}|${plan.billingCycle}` : undefined,
    (i) => ['plans', i, 'planName'],
    m.plan.duplicate,
  );
};

// POST /api/properties/:id/amenities (Add Amenities Detail).
export const createAmenitySchema = strictBody(amenityFields).superRefine(plansFitPricingType);

// PUT /api/properties/:id/amenities/:amenityId (Edit, with status; plans replaced as a set).
export const updateAmenitySchema = strictBody({
  ...amenityFields,
  status: z.enum(AMENITY_STATUSES, { error: m.amenity.status.invalid }),
}).superRefine(plansFitPricingType);

// GET /api/properties/:id/amenities (PROP-DEC-020).
export const amenityListQuerySchema = z.object({
  page,
  pageSize: pageSize(L.pageSize.amenities),
  search,
  status: optionalEnum(AMENITY_STATUSES, m.query.status.invalid),
  category: optionalEnum(AMENITY_CATEGORIES, m.query.category.invalid),
});
