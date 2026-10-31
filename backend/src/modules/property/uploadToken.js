import crypto from 'node:crypto';

// Upload tokens of the Add Property wizard (PROP-DEC-012, PROP-SPEC-001 "Upload tokens"). POST /uploads
// returns one per staged file; Submit sends the tokens instead of the files. A token is AES-256-GCM
// ciphertext: GCM's tag makes it tamper-proof (like an HMAC signature) and the encryption keeps the public
// id and file details on the server. Format: v1.<iv>.<ciphertext>.<tag>, each part base64url.
//
// The key is derived from the access-token secret with HKDF under a property label (as DEC-029), so no new
// env var is needed and the key never equals that secret.

export const UPLOAD_TOKEN_TTL_MS = 24 * 60 * 60_000;
const VERSION = 'v1';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

const encode = (buffer) => buffer.toString('base64url');
const decode = (text) => Buffer.from(text, 'base64url');

export function createUploadTokens({ parentSecret, clock }) {
  const key = Buffer.from(
    crypto.hkdfSync('sha256', parentSecret, '', 'real-estate/property-upload-token/v1', KEY_LENGTH),
  );

  return {
    // upload: { ownerId, purpose, publicId, resourceType, mimeType, sizeBytes, fileName }.
    issue({ ownerId, purpose, publicId, resourceType, mimeType, sizeBytes, fileName }) {
      const payload = {
        o: ownerId,
        p: purpose,
        id: publicId,
        rt: resourceType,
        mt: mimeType,
        sz: sizeBytes,
        fn: fileName,
        exp: clock.now().getTime() + UPLOAD_TOKEN_TTL_MS,
      };
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
      return [VERSION, encode(iv), encode(ciphertext), encode(cipher.getAuthTag())].join('.');
    },

    // The upload inside a token this server issued, if it has not expired by the injected clock, belongs to
    // `ownerId` and has one of `purposes`; otherwise null. Returns the issued fields plus `expiresAt`.
    read(token, { ownerId, purposes }) {
      if (typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 4 || parts[0] !== VERSION) return null;
      let payload;
      try {
        const [, iv, ciphertext, tag] = parts.map(decode);
        if (iv.length !== IV_LENGTH) return null;
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        payload = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'));
      } catch {
        return null;
      }
      if (payload.o !== ownerId || !purposes.includes(payload.p)) return null;
      if (!(clock.now().getTime() < payload.exp)) return null;
      return {
        ownerId: payload.o,
        purpose: payload.p,
        publicId: payload.id,
        resourceType: payload.rt,
        mimeType: payload.mt,
        sizeBytes: payload.sz,
        fileName: payload.fn,
        expiresAt: new Date(payload.exp),
      };
    },
  };
}
