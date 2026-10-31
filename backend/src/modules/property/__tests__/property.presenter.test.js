import { phaseBadge, presentProgress, priceRange } from '../property.presenter.js';

// Derived values of the property responses (PROP-DEC-010, PROP-DEC-022).

describe('phaseBadge', () => {
  it.each([
    [0, null],
    [1, 'in_progress'],
    [99, 'in_progress'],
    [100, 'complete'],
  ])('%i%% gives %s', (percent, badge) => {
    expect(phaseBadge(percent)).toBe(badge);
  });
});

describe('priceRange', () => {
  it('spans the Active configurations only', () => {
    expect(
      priceRange([
        { status: 'active', price: '840000.00' },
        { status: 'inactive', price: '100.00' },
        { status: 'active', price: '1250000.50' },
      ]),
    ).toEqual({ min: 840000, max: 1250000.5 });
  });

  it('is null without an Active configuration', () => {
    expect(priceRange([{ status: 'inactive', price: '100.00' }])).toBeNull();
    expect(priceRange([])).toBeNull();
  });
});

describe('presentProgress', () => {
  it('lists the four phases in order with their badges', () => {
    expect(
      presentProgress({
        overallPercent: 65,
        foundationPercent: 100,
        structurePercent: 80,
        interiorPercent: 1,
        finishingPercent: 0,
        possessionDate: '2026-12-01',
      }),
    ).toEqual({
      overallPercent: 65,
      foundationPercent: 100,
      structurePercent: 80,
      interiorPercent: 1,
      finishingPercent: 0,
      possessionDate: '2026-12-01',
      phases: [
        { phase: 'foundation', percent: 100, badge: 'complete' },
        { phase: 'structure', percent: 80, badge: 'in_progress' },
        { phase: 'interior', percent: 1, badge: 'in_progress' },
        { phase: 'finishing', percent: 0, badge: null },
      ],
    });
  });
});
