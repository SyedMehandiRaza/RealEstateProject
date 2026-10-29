import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../jwt.js';

describe('jwt utils', () => {
  it('round-trips an access token', () => {
    const payload = verifyAccessToken(signAccessToken({ userId: 3, roles: ['buyer', 'developer'] }));
    expect(payload).toMatchObject({ sub: '3', roles: ['buyer', 'developer'] });
  });

  it('issues a refresh token with a unique jti and expiry', () => {
    const a = signRefreshToken({ userId: 3 });
    const b = signRefreshToken({ userId: 3 });
    expect(a.jti).not.toBe(b.jti);
    expect(a.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(verifyRefreshToken(a.token)).toMatchObject({ sub: '3', jti: a.jti });
  });

  it("checks a refresh token's expiry against the given time", () => {
    const { token, expiresAt } = signRefreshToken({ userId: 3 });
    const justBefore = new Date(expiresAt.getTime() - 1000);
    expect(verifyRefreshToken(token, { now: justBefore })).toMatchObject({ sub: '3' });
    expect(() => verifyRefreshToken(token, { now: expiresAt })).toThrow(
      expect.objectContaining({ code: 'TOKEN_EXPIRED' }),
    );
  });

  it('does not accept an access token as a refresh token', () => {
    expect(() => verifyRefreshToken(signAccessToken({ userId: 1, roles: ['buyer'] }))).toThrow(
      expect.objectContaining({ code: 'UNAUTHORIZED' }),
    );
  });

  it('hashes tokens deterministically without returning the token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toHaveLength(64);
    expect(hashToken('abc')).not.toContain('abc');
  });
});
