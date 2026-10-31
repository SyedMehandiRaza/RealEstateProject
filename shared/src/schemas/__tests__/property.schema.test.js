import {
  amenityListQuerySchema,
  amenityParamsSchema,
  configurationParamsSchema,
  createAmenitySchema,
  createConfigurationSchema,
  createPropertySchema,
  createUpdateSchema,
  documentListQuerySchema,
  documentParamsSchema,
  documentUploadFieldsSchema,
  documentUrlQuerySchema,
  floorPlanParamsSchema,
  mediaParamsSchema,
  mediaUploadFieldsSchema,
  PROPERTY_WIZARD_STEP_FIELDS,
  propertyFileSchema,
  propertyListQuerySchema,
  propertyParamsSchema,
  stagedUploadFieldsSchema,
  updateAmenitySchema,
  updateConfigurationSchema,
  updateListQuerySchema,
  updateParamsSchema,
  updateProgressSchema,
  updatePropertySchema,
} from '../property.schema.js';
import { propertyMessages as m } from '../../messages/property.messages.js';
import { commonMessages } from '../../messages/common.messages.js';
import { toFieldErrors } from '../../errors/toFieldErrors.js';
import { LIMITS } from '../../limits.js';
import {
  createAmenityCases,
  createConfigurationCases,
  createPropertyCases,
  createUpdateCases,
  propertyFileCases,
  updateAmenityCases,
  updateConfigurationCases,
  updateProgressCases,
  updatePropertyCases,
} from '../../testing/index.js';

const L = LIMITS.property;
const MB = 1024 * 1024;
const errorsOf = (schema, input) => {
  const result = schema.safeParse(input);
  if (result.success)
    throw new Error(`expected a validation error for ${JSON.stringify(input).slice(0, 200)}`);
  return toFieldErrors(result.error);
};
const longText = (length) => 'a'.repeat(length);

// Every case of a shared table: the valid object passes, each invalid one fails on its field with its message.
const replay = (label, schema, cases) => {
  describe(`${label} (shared cases)`, () => {
    it('accepts the valid input', () => {
      expect(schema.safeParse(cases.valid).success).toBe(true);
    });
    it.each(cases.invalid.map((testCase) => [testCase.name, testCase]))('rejects %s', (_name, testCase) => {
      const errors = errorsOf(schema, { ...cases.valid, ...testCase.input });
      expect(errors[testCase.field]).toContain(testCase.message);
    });
  });
};

replay('updatePropertySchema', updatePropertySchema, updatePropertyCases);
replay('createPropertySchema', createPropertySchema, createPropertyCases);
replay('createConfigurationSchema', createConfigurationSchema, createConfigurationCases);
replay('updateConfigurationSchema', updateConfigurationSchema, updateConfigurationCases);
replay('createAmenitySchema', createAmenitySchema, createAmenityCases);
replay('updateAmenitySchema', updateAmenitySchema, updateAmenityCases);
replay('updateProgressSchema', updateProgressSchema, updateProgressCases);
replay('createUpdateSchema', createUpdateSchema, createUpdateCases);
replay('propertyFileSchema', propertyFileSchema, propertyFileCases);

describe('property fields', () => {
  const valid = updatePropertyCases.valid;

  it('trims text and turns form strings into numbers', () => {
    const data = updatePropertySchema.parse({
      ...valid,
      name: '  Sky Heights  ',
      latitude: ' 23.215635 ',
      totalArea: '3.50',
      totalUnits: '120',
      startingPrice: '840000.25',
      yearBuilt: '2024',
      features: [' Gym ', 'Lift'],
    });
    expect(data).toMatchObject({
      name: 'Sky Heights',
      latitude: 23.215635,
      totalArea: 3.5,
      totalUnits: 120,
      startingPrice: 840000.25,
      yearBuilt: 2024,
      features: ['Gym', 'Lift'],
    });
  });

  it('accepts every boundary value', () => {
    const result = updatePropertySchema.safeParse({
      ...valid,
      name: longText(L.name.max),
      state: longText(L.state.max),
      city: longText(L.city.max),
      locality: longText(L.locality.max),
      postalCode: 'AB1 2-CD9Z',
      address: longText(L.address.max),
      latitude: -90,
      longitude: 180,
      totalArea: 0.01,
      totalUnits: L.maxTotalUnits,
      towerCount: L.maxSmallCount,
      floorCount: 1,
      startingPrice: L.maxMoney,
      yearBuilt: L.yearBuilt.min,
      builderName: longText(L.builderName.max),
      description: longText(L.description.max),
      features: Array.from({ length: L.features.max }, (_, i) => `Feature ${i}`),
    });
    expect(result.success).toBe(true);
    expect(
      updatePropertySchema.safeParse({ ...valid, postalCode: '123', yearBuilt: L.yearBuilt.max }).success,
    ).toBe(true);
  });

  it('makes the possession date optional, also when blank', () => {
    expect(
      updatePropertySchema.parse({ ...valid, possessionDate: undefined }).possessionDate,
    ).toBeUndefined();
    expect(updatePropertySchema.parse({ ...valid, possessionDate: '' }).possessionDate).toBeUndefined();
    const ready = { ...valid, propertyStatus: 'ready_to_move', possessionDate: undefined };
    expect(updatePropertySchema.safeParse(ready).success).toBe(true);
  });

  it('accepts a leap day only in a leap year', () => {
    expect(updatePropertySchema.safeParse({ ...valid, possessionDate: '2028-02-29' }).success).toBe(true);
    expect(errorsOf(updatePropertySchema, { ...valid, possessionDate: '2027-02-29' }).possessionDate).toEqual(
      [m.possessionDate.invalid],
    );
  });

  it('shows only "required" for an empty required field', () => {
    expect(errorsOf(updatePropertySchema, { ...valid, name: '' }).name).toEqual([m.name.required]);
    expect(errorsOf(updatePropertySchema, { ...valid, totalUnits: '' }).totalUnits).toEqual([
      m.totalUnits.required,
    ]);
  });

  it('does not let the wizard step lists drift from the schemas', () => {
    const stepped = Object.values(PROPERTY_WIZARD_STEP_FIELDS).flat().sort();
    expect(stepped).toEqual(
      Object.keys(createPropertySchema.shape ?? createPropertySchema._zod.def.shape).sort(),
    );
  });
});

describe('createPropertySchema', () => {
  const valid = createPropertyCases.valid;

  it('defaults missing videos, tours and floor plans to empty lists and keeps Other optional', () => {
    const data = createPropertySchema.parse({
      ...valid,
      configurations: [{ ...valid.configurations[0], floorPlans: undefined }],
      media: { images: ['token-image-1'] },
    });
    expect(data.media).toEqual({ images: ['token-image-1'], videos: [], tours: [] });
    expect(data.configurations[0].floorPlans).toEqual([]);
    expect(data.documents.other).toBeUndefined();
    expect(
      createPropertySchema.safeParse({ ...valid, documents: { ...valid.documents, other: 'token-x' } })
        .success,
    ).toBe(true);
  });

  it('accepts the maximum counts', () => {
    const result = createPropertySchema.safeParse({
      ...valid,
      configurations: Array.from({ length: L.configurations.max }, (_, i) => ({
        ...valid.configurations[0],
        name: `Type ${i}`,
        floorPlans: i === 0 ? Array.from({ length: L.maxFloorPlans }, (_, j) => `fp-${j}`) : [],
      })),
      media: {
        images: Array.from({ length: L.images.max }, (_, i) => `img-${i}`),
        videos: Array.from({ length: L.maxVideos }, (_, i) => `vid-${i}`),
        tours: Array.from({ length: L.maxTours }, (_, i) => `tour-${i}`),
      },
    });
    expect(result.success).toBe(true);
  });

  it('flags a token used in two different slots at the later slot', () => {
    const errors = errorsOf(createPropertySchema, {
      ...valid,
      documents: { ...valid.documents, legalNoc: 'token-rera' },
    });
    expect(errors['documents.legalNoc']).toEqual([m.uploadToken.duplicate]);
    expect(errors['documents.reraCertificate']).toBeUndefined();
  });

  it('rejects unknown keys inside media and documents', () => {
    expect(
      errorsOf(createPropertySchema, { ...valid, media: { ...valid.media, audio: [] } })['media'],
    ).toContain(commonMessages.unknownField);
    expect(
      errorsOf(createPropertySchema, {
        ...valid,
        documents: { ...valid.documents, financialStatement: 't' },
      })['documents'],
    ).toContain(commonMessages.unknownField);
  });
});

describe('configuration schemas', () => {
  it('accepts available units equal to total units, and zero', () => {
    const valid = createConfigurationCases.valid;
    expect(createConfigurationSchema.safeParse({ ...valid, availableUnits: valid.totalUnits }).success).toBe(
      true,
    );
    expect(createConfigurationSchema.safeParse({ ...valid, availableUnits: 0 }).success).toBe(true);
  });

  it('does not take a status on create, and needs one on edit', () => {
    expect(
      errorsOf(createConfigurationSchema, { ...createConfigurationCases.valid, status: 'active' })._form,
    ).toEqual([commonMessages.unknownField]);
    expect(errorsOf(updateConfigurationSchema, { ...createConfigurationCases.valid }).status).toEqual([
      m.configuration.status.invalid,
    ]);
  });
});

describe('amenity schemas', () => {
  const valid = createAmenityCases.valid;

  it('allows hour and day for time based amenities, and a free plan', () => {
    const result = createAmenitySchema.safeParse({
      ...valid,
      pricingType: 'time_based',
      plans: [
        { planName: 'Hourly', billingCycle: 'hour', price: 10 },
        { planName: 'Hourly', billingCycle: 'day', price: 0 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('turns a blank plan feature into no feature', () => {
    const data = createAmenitySchema.parse({ ...valid, plans: [{ ...valid.plans[0], features: '  ' }] });
    expect(data.plans[0].features).toBeUndefined();
  });

  it('accepts five plans and every maximum length', () => {
    const result = updateAmenitySchema.safeParse({
      ...updateAmenityCases.valid,
      name: longText(L.amenityName.max),
      description: longText(L.amenityDescription.max),
      features: longText(L.amenityFeatures.max),
      plans: Array.from({ length: L.plans.max }, (_, i) => ({
        planName: `${i}${longText(L.planName.max - 1)}`,
        billingCycle: 'month',
        price: L.maxMoney,
        features: longText(L.planFeatures.max),
      })),
    });
    expect(result.success).toBe(true);
  });
});

describe('propertyFileSchema', () => {
  const valid = propertyFileCases.valid;

  it.each([
    ['image', 'image/png', L.maxFileBytes],
    ['update_image', 'image/jpeg', L.maxFileBytes],
    ['video', 'video/mp4', L.maxVideoBytes],
    ['tour_360', 'video/mp4', L.maxVideoBytes],
    ['floor_plan', 'application/pdf', L.maxFileBytes],
    ['document', 'image/png', L.maxFileBytes],
  ])('accepts a %s of type %s at exactly the size limit', (purpose, mimeType, sizeBytes) => {
    expect(propertyFileSchema.safeParse({ purpose, fileName: 'f', mimeType, sizeBytes }).success).toBe(true);
  });

  it('allows 40 MB only for videos', () => {
    expect(errorsOf(propertyFileSchema, { ...valid, sizeBytes: 20 * MB }).sizeBytes).toEqual([
      m.file.sizeBytes.max,
    ]);
  });
});

describe('multipart field schemas', () => {
  it('accepts only the stageable purposes for upload tokens', () => {
    expect(stagedUploadFieldsSchema.safeParse({ purpose: 'tour_360' }).success).toBe(true);
    expect(errorsOf(stagedUploadFieldsSchema, { purpose: 'update_image' }).purpose).toEqual([
      m.file.purpose.invalid,
    ]);
  });

  it('checks the media type and the document type', () => {
    expect(errorsOf(mediaUploadFieldsSchema, { mediaType: 'audio' }).mediaType).toEqual([
      m.media.mediaType.invalid,
    ]);
    expect(errorsOf(documentUploadFieldsSchema, {}).documentType).toEqual([m.documents.documentType.invalid]);
    expect(documentUploadFieldsSchema.safeParse({ documentType: 'financial_statement' }).success).toBe(true);
  });
});

describe('list queries', () => {
  it('defaults page 1 and the module page sizes, and drops a blank search', () => {
    expect(propertyListQuerySchema.parse({ page: '', pageSize: '', search: '   ' })).toEqual({
      page: 1,
      pageSize: 12,
    });
    expect(amenityListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 });
    expect(updateListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it('reads numbers and trims the search', () => {
    expect(propertyListQuerySchema.parse({ page: '3', pageSize: '50', search: ' sky ' })).toEqual({
      page: 3,
      pageSize: 50,
      search: 'sky',
    });
  });

  it.each([
    ['page', '0', commonMessages.page.invalid],
    ['page', '1.5', commonMessages.page.invalid],
    ['page', 'x', commonMessages.page.invalid],
    ['pageSize', '0', m.query.pageSize.invalid],
    ['pageSize', String(L.pageSize.max + 1), m.query.pageSize.invalid],
    ['search', longText(L.search.max + 1), m.query.search.max],
  ])('rejects %s=%s', (field, value, message) => {
    expect(errorsOf(propertyListQuerySchema, { [field]: value })[field]).toEqual([message]);
  });

  it('filters amenities by status and category, "" meaning all', () => {
    expect(amenityListQuerySchema.parse({ status: 'active', category: '' })).toEqual({
      page: 1,
      pageSize: 10,
      status: 'active',
    });
    expect(errorsOf(amenityListQuerySchema, { status: 'deleted' }).status).toEqual([m.query.status.invalid]);
    expect(errorsOf(amenityListQuerySchema, { category: 'pool' }).category).toEqual([
      m.query.category.invalid,
    ]);
  });

  it('filters documents by status and category', () => {
    expect(documentListQuerySchema.parse({ status: 'verified', category: 'legal' })).toEqual({
      status: 'verified',
      category: 'legal',
    });
    expect(errorsOf(documentListQuerySchema, { category: 'tax' }).category).toEqual([
      m.query.category.invalid,
    ]);
    expect(errorsOf(documentListQuerySchema, { status: 'rejected' }).status).toEqual([
      m.query.status.invalid,
    ]);
  });

  it('defaults the document link to inline', () => {
    expect(documentUrlQuerySchema.parse({})).toEqual({ disposition: 'inline' });
    expect(documentUrlQuerySchema.parse({ disposition: 'attachment' })).toEqual({
      disposition: 'attachment',
    });
    expect(errorsOf(documentUrlQuerySchema, { disposition: 'download' }).disposition).toEqual([
      m.query.disposition.invalid,
    ]);
  });
});

describe('route params', () => {
  it.each([
    ['property', propertyParamsSchema, { id: '7' }, { id: 7 }],
    [
      'configuration',
      configurationParamsSchema,
      { id: '7', configurationId: '2' },
      { id: 7, configurationId: 2 },
    ],
    [
      'floor plan',
      floorPlanParamsSchema,
      { id: '7', configurationId: '2', floorPlanId: '9' },
      { id: 7, configurationId: 2, floorPlanId: 9 },
    ],
    ['media', mediaParamsSchema, { id: '7', mediaId: '3' }, { id: 7, mediaId: 3 }],
    ['document', documentParamsSchema, { id: '7', documentId: '3' }, { id: 7, documentId: 3 }],
    ['update', updateParamsSchema, { id: '7', updateId: '3' }, { id: 7, updateId: 3 }],
    ['amenity', amenityParamsSchema, { id: '7', amenityId: '3' }, { id: 7, amenityId: 3 }],
  ])('reads %s ids as positive integers', (_name, schema, input, output) => {
    expect(schema.parse(input)).toEqual(output);
  });

  it.each(['0', '-1', '1.5', 'abc'])('rejects the id %s', (value) => {
    expect(errorsOf(propertyParamsSchema, { id: value }).id).toEqual([commonMessages.id.invalid]);
    expect(errorsOf(amenityParamsSchema, { id: '1', amenityId: value }).amenityId).toEqual([
      commonMessages.id.invalid,
    ]);
  });
});
