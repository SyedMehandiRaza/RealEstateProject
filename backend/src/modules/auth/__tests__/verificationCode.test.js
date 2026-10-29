import { generateCode, hashCode, isSameCode } from '../verificationCode.service.js';

const SECRET = 'unit-test-verification-code-secret-32-chars';

describe('generateCode', () => {
  it('returns 6 digits, keeping leading zeros', () => {
    expect(generateCode(() => 42)).toBe('000042');
    expect(generateCode(() => 0)).toBe('000000');
    expect(generateCode(() => 999_999)).toBe('999999');
  });

  it('asks the random source for a number in [0, 1000000)', () => {
    const randomInt = jest.fn(() => 7);
    generateCode(randomInt);
    expect(randomInt).toHaveBeenCalledWith(0, 1_000_000);
  });

  it('uses a cryptographic source by default and always gives 6 digits', () => {
    const codes = Array.from({ length: 200 }, () => generateCode());
    for (const code of codes) expect(code).toMatch(/^\d{6}$/);
    expect(new Set(codes).size).toBeGreaterThan(190);
  });
});

describe('hashCode and isSameCode', () => {
  it('stores a 64-character hex HMAC that depends on the secret', () => {
    const hash = hashCode('012345', SECRET);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('012345');
    expect(hashCode('012345', SECRET)).toBe(hash);
    expect(hashCode('012345', `${SECRET}-other`)).not.toBe(hash);
  });

  it('matches only the same code', () => {
    const stored = hashCode('012345', SECRET);
    expect(isSameCode('012345', stored, SECRET)).toBe(true);
    expect(isSameCode('012346', stored, SECRET)).toBe(false);
    expect(isSameCode('12345', stored, SECRET)).toBe(false);
  });

  it('rejects a malformed stored hash instead of throwing', () => {
    expect(isSameCode('012345', 'not-a-hash', SECRET)).toBe(false);
  });
});
