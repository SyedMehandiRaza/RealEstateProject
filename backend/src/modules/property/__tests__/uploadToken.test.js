import jwt from 'jsonwebtoken';
import { LIMITS } from '@real-estate/shared';
import { createTestClock } from '../../../test/testClock.js';
import { createUploadTokens, UPLOAD_TOKEN_TTL_MS } from '../uploadToken.js';

// Upload tokens of the Add Property wizard (PROP-005, PROP-DEC-012): only the uploading Developer can use
// one, for its purpose, within 24 hours. The file details inside are readable only by the server.

const PARENT_SECRET = 'test-access-secret-at-least-32-characters-long';
const upload = {
  ownerId: 41,
  purpose: 'image',
  publicId: 'realestate/test/properties/41/staging/abc',
  resourceType: 'image',
  mimeType: 'image/jpeg',
  sizeBytes: 2048,
  fileName: 'front.jpg',
};

function setup(secret = PARENT_SECRET) {
  const clock = createTestClock(new Date('2026-10-31T10:00:00Z'));
  return { clock, tokens: createUploadTokens({ parentSecret: secret, clock }) };
}

// Flips one character of the token's part `index` (0 version, 1 iv, 2 ciphertext, 3 tag).
function tamper(token, index) {
  const parts = token.split('.');
  const part = parts[index];
  parts[index] = (part[0] === 'A' ? 'B' : 'A') + part.slice(1);
  return parts.join('.');
}

describe('upload tokens', () => {
  it('reads back what was issued, with the expiry 24 hours ahead', () => {
    const { clock, tokens } = setup();
    const token = tokens.issue(upload);

    expect(UPLOAD_TOKEN_TTL_MS).toBe(24 * 60 * 60_000);
    expect(tokens.read(token, { ownerId: 41, purposes: ['image'] })).toEqual({
      ...upload,
      expiresAt: new Date(clock.now().getTime() + UPLOAD_TOKEN_TTL_MS),
    });
    expect(token.length).toBeLessThanOrEqual(LIMITS.property.uploadToken.max);
  });

  it('does not show the public id or file details to the client', () => {
    const token = setup().tokens.issue(upload);
    const visible = token
      .split('.')
      .map((part) => Buffer.from(part, 'base64url').toString('latin1'))
      .join(' ');
    for (const value of [upload.publicId, 'staging', upload.fileName, 'image/jpeg']) {
      expect(visible).not.toContain(value);
    }
  });

  it.each([
    ['iv', 1],
    ['ciphertext', 2],
    ['tag', 3],
  ])('refuses a token with a tampered %s', (_part, index) => {
    const { tokens } = setup();
    expect(tokens.read(tamper(tokens.issue(upload), index), { ownerId: 41, purposes: ['image'] })).toBeNull();
  });

  it('refuses a token past 24 hours and accepts one just inside', () => {
    const { clock, tokens } = setup();
    const token = tokens.issue(upload);

    clock.advance(UPLOAD_TOKEN_TTL_MS - 1000);
    expect(tokens.read(token, { ownerId: 41, purposes: ['image'] })).not.toBeNull();
    clock.advance(1000);
    expect(tokens.read(token, { ownerId: 41, purposes: ['image'] })).toBeNull();
  });

  it('refuses a token used by another owner or for another purpose', () => {
    const { tokens } = setup();
    const token = tokens.issue(upload);

    expect(tokens.read(token, { ownerId: 42, purposes: ['image'] })).toBeNull();
    expect(tokens.read(token, { ownerId: 41, purposes: ['document', 'floor_plan'] })).toBeNull();
  });

  it('refuses a token from another secret, an access token and junk', () => {
    const { tokens } = setup();
    const foreign = setup('another-secret-that-is-at-least-32-characters').tokens.issue(upload);
    const accessToken = jwt.sign({ sub: '41', roles: ['developer'] }, PARENT_SECRET);

    for (const token of [foreign, accessToken, '', 'v1.a.b.c', 'not-a-token', null, undefined, 42]) {
      expect(tokens.read(token, { ownerId: 41, purposes: ['image'] })).toBeNull();
    }
  });

  it('issues a different token each time, even for the same upload', () => {
    const { tokens } = setup();
    expect(tokens.issue(upload)).not.toBe(tokens.issue(upload));
  });
});
