import { verificationOutcome } from '../verificationOutcome.js';

const docs = (...statuses) =>
  statuses.map((status, index) => ({ documentKind: `kind_${index}`, status, rejectionReason: null }));

describe('verificationOutcome', () => {
  it.each([
    [['pending', 'pending'], 'under_review'],
    [['approved', 'approved'], 'active'],
    [['approved', 'approved', 'approved'], 'active'],
    [['rejected', 'rejected'], 'unsuccessful'],
    [['approved', 'rejected'], 'unsuccessful'],
    [['pending', 'rejected', 'approved'], 'unsuccessful'],
    [['approved', 'pending'], 'under_review'],
    [['approved', null], 'under_review'],
    [[null, null], 'under_review'],
  ])('%j -> %s', (statuses, outcome) => {
    expect(verificationOutcome(docs(...statuses))).toBe(outcome);
  });

  it('is under review with no documents', () => {
    expect(verificationOutcome([])).toBe('under_review');
    expect(verificationOutcome()).toBe('under_review');
  });
});
