import { LIMITS } from '../../limits.js';
import * as enums from '../property.enums.js';

// Each list is pinned: a change here needs a migration of the matching MySQL ENUM (PROP-DEC-003 to 010).
describe('property enums', () => {
  it.each([
    ['PROPERTY_TYPES', ['apartment', 'villa', 'studio', 'farmland', 'townhouse', 'plot', 'shops', 'duplex']],
    ['LISTING_PURPOSES', ['sale', 'rent']],
    ['LISTING_CATEGORIES', ['single_property', 'project']],
    ['PROPERTY_STATUSES', ['ready_to_move', 'under_construction']],
    ['AREA_UNITS', ['sq_ft', 'acre']],
    ['CONFIGURATION_STATUSES', ['active', 'inactive']],
    ['PROPERTY_MEDIA_TYPES', ['image', 'video', 'tour_360']],
    ['PROPERTY_MEDIA_MIME_TYPES', ['image/jpeg', 'image/png', 'video/mp4']],
    ['PROPERTY_FILE_MIME_TYPES', ['application/pdf', 'image/jpeg', 'image/png']],
    [
      'PROPERTY_DOCUMENT_TYPES',
      ['rera_certificate', 'floor_plan', 'legal_noc', 'ownership_proof', 'financial_statement', 'other'],
    ],
    ['PROPERTY_DOCUMENT_STATUSES', ['uploaded', 'pending', 'verified']],
    ['AMENITY_CATEGORIES', ['sports', 'event', 'parking']],
    ['AMENITY_PRICING_TYPES', ['subscription', 'time_based']],
    ['AMENITY_STATUSES', ['active', 'inactive']],
    ['AMENITY_BILLING_CYCLES', ['hour', 'day', 'month']],
  ])('%s', (name, values) => {
    expect(enums[name]).toEqual(values);
  });

  it('has no duplicate value in any list', () => {
    for (const values of Object.values(enums)) {
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('accepts no PDF as gallery media, and no video as a document', () => {
    expect(enums.PROPERTY_MEDIA_MIME_TYPES).not.toContain('application/pdf');
    expect(enums.PROPERTY_FILE_MIME_TYPES).not.toContain('video/mp4');
  });
});

describe('property limits', () => {
  const P = LIMITS.property;

  it('allows larger videos than images and documents', () => {
    expect(P.maxFileBytes).toBe(10 * 1024 * 1024);
    expect(P.maxVideoBytes).toBe(40 * 1024 * 1024);
  });

  it('has min <= max for every bounded field', () => {
    for (const limit of Object.values(P)) {
      if (typeof limit === 'object' && 'min' in limit) expect(limit.min).toBeLessThanOrEqual(limit.max);
    }
  });
});
