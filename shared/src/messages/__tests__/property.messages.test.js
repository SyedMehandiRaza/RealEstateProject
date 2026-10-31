import { propertyMessages as m } from '../property.messages.js';

const leaves = (value, path = []) =>
  typeof value === 'string'
    ? [[path.join('.'), value]]
    : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));

describe('propertyMessages', () => {
  it('has a non-empty sentence at every key, with no unfilled placeholder', () => {
    for (const [, message] of leaves(m)) {
      expect(message.trim()).not.toBe('');
      expect(message).not.toMatch(/undefined|NaN|\$\{/);
    }
  });

  it('writes the limits into the messages', () => {
    expect(m.name.max).toBe('Property name must be at most 150 characters');
    expect(m.file.sizeBytes.max).toBe('The file must be at most 10 MB');
    expect(m.file.sizeBytes.maxVideo).toBe('The file must be at most 40 MB');
    expect(m.api.configurationsMax).toBe('A property can have at most 20 configurations');
    expect(m.api.mediaMax).toEqual({
      image: 'A property can have at most 30 images',
      video: 'A property can have at most 5 videos',
      tour_360: 'A property can have at most 5 360° tours',
    });
    expect(m.query.pageSize.invalid).toBe('Page size must be a whole number between 1 and 50');
  });

  it('names every required wizard document', () => {
    expect(Object.keys(m.documents.required)).toEqual([
      'rera_certificate',
      'floor_plan',
      'legal_noc',
      'ownership_proof',
    ]);
  });
});
