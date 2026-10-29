import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { createTestClock } from '../../../test/testClock.js';
import { signAccessToken, verifyAccessToken } from '../../../utils/jwt.js';
import { createResetTokens, RESET_TOKEN_TTL_MS } from '../resetToken.js';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HASH = '$2b$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
const OTHER_HASH = '$2b$12$zyxwvutsrqponmlkjihgfeZYXWVUTSRQPONMLKJIHGFEDCBA98765';

describe('reset tokens', () => {
  let clock;
  let tokens;

  beforeEach(() => {
    // Issued on a whole second, so the 10-minute edge is exact.
    clock = createTestClock(new Date(Math.floor(Date.now() / SECOND) * SECOND));
    tokens = createResetTokens({ parentSecret: env.JWT_ACCESS_SECRET, clock });
  });

  it('lasts 10 minutes', () => {
    expect(RESET_TOKEN_TTL_MS).toBe(10 * MINUTE);
  });

  it('reads back the Account and a fingerprint of the password hash it was issued for', () => {
    const claims = tokens.read(tokens.issue({ userId: 42, passwordHash: HASH }));

    expect(claims).toEqual({ userId: 42, fingerprint: expect.any(String) });
    expect(tokens.matchesPassword(claims, HASH)).toBe(true);
    expect(tokens.matchesPassword(claims, OTHER_HASH)).toBe(false);
  });

  it('carries the purpose and subject but never the password hash itself', () => {
    const token = tokens.issue({ userId: 42, passwordHash: HASH });
    const payload = jwt.decode(token);

    expect(payload).toMatchObject({ purpose: 'password_reset', sub: '42' });
    expect(payload.exp - payload.iat).toBe(10 * 60);
    expect(token).not.toContain(HASH);
    expect(JSON.stringify(payload)).not.toContain(HASH.slice(7));
  });

  it('is accepted at 9:59 and refused from 10:00', () => {
    const token = tokens.issue({ userId: 42, passwordHash: HASH });

    clock.advance(9 * MINUTE + 59 * SECOND);
    expect(tokens.read(token)).not.toBeNull();
    clock.advance(SECOND);
    expect(tokens.read(token)).toBeNull();
  });

  it('is refused when tampered with, malformed or missing', () => {
    const [header, , signature] = tokens.issue({ userId: 42, passwordHash: HASH }).split('.');
    const forged = Buffer.from(JSON.stringify({ purpose: 'password_reset', sub: '1' })).toString('base64url');

    expect(tokens.read(`${header}.${forged}.${signature}`)).toBeNull();
    expect(tokens.read('not-a-token')).toBeNull();
    expect(tokens.read('')).toBeNull();
    expect(tokens.read(undefined)).toBeNull();
  });

  it('does not accept an access token, and an access token check does not accept a reset token', () => {
    const accessToken = signAccessToken({ userId: 42, roles: ['buyer'] });
    expect(tokens.read(accessToken)).toBeNull();

    const resetToken = tokens.issue({ userId: 42, passwordHash: HASH });
    expect(() => verifyAccessToken(resetToken)).toThrow(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  it('does not accept a token from another parent secret', () => {
    const other = createResetTokens({ parentSecret: env.JWT_REFRESH_SECRET, clock });
    expect(tokens.read(other.issue({ userId: 42, passwordHash: HASH }))).toBeNull();
  });
});
