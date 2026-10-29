import jwt from 'jsonwebtoken';
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

  // TASK-053: each token says what it is, so one kind can never pass as the other even if both were
  // signed with one secret.
  it('marks access tokens typ "access" and refresh tokens typ "refresh"', () => {
    expect(jwt.decode(signAccessToken({ userId: 1, roles: ['buyer'] })).typ).toBe('access');
    expect(jwt.decode(signRefreshToken({ userId: 1 }).token).typ).toBe('refresh');
  });

  it.each([
    ['typ "refresh"', { typ: 'refresh' }],
    ['no typ', {}],
  ])('refuses an access-secret token with %s as an access token', (_name, claims) => {
    const token = jwt.sign({ roles: ['buyer'], ...claims }, process.env.JWT_ACCESS_SECRET, { subject: '1' });
    expect(() => verifyAccessToken(token)).toThrow(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  it('refuses a refresh-secret token with typ "access" as a refresh token', () => {
    const token = jwt.sign({ typ: 'access' }, process.env.JWT_REFRESH_SECRET, { subject: '1', jwtid: 'x' });
    expect(() => verifyRefreshToken(token)).toThrow(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  // Refresh tokens issued before TASK-053 have no typ and live up to 7 days; the hashed DB lookup still
  // guards them, so they are accepted until they expire.
  it('accepts a refresh token without typ (issued before TASK-053)', () => {
    const token = jwt.sign({}, process.env.JWT_REFRESH_SECRET, { subject: '1', jwtid: 'x' });
    expect(verifyRefreshToken(token)).toMatchObject({ sub: '1', jti: 'x' });
  });

  it('hashes tokens deterministically without returning the token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toHaveLength(64);
    expect(hashToken('abc')).not.toContain('abc');
  });
});
