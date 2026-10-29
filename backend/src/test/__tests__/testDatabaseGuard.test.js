import { assertTestDatabaseName } from '../testEnv.js';

describe('test database guard', () => {
  it.each(['real_estate_test', 'other_test'])('accepts %s', (name) => {
    expect(() => assertTestDatabaseName(name)).not.toThrow();
  });

  it.each([
    ['the dev database', 'real_estate'],
    ['a name with _test in the middle', 'real_estate_test_copy'],
    ['a name ending in test without the underscore', 'real_estatetest'],
    ['the bare suffix', '_test'],
    ['an empty name', ''],
    ['a missing name', undefined],
  ])('refuses %s', (_label, name) => {
    expect(() => assertTestDatabaseName(name)).toThrow(/must end with "_test"/);
  });
});
