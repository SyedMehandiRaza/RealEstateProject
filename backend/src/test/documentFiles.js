// Verification document fixtures for multipart tests: bytes that start with the real signature of the
// type (what the server sniffs), padded to the size asked for.

const SIGNATURES = {
  'application/pdf': Buffer.from('%PDF-1.7\n'),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  'image/gif': Buffer.from('GIF89a'),
  // ISO base media: a box size, then "ftyp" and a brand (property videos, PROP-007).
  'video/mp4': Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]),
};

// The bytes of a file of `type` (its signature, then zeros) of `size` bytes. size 0 gives an empty file.
export function fileBytes(type, size = 2048) {
  const bytes = Buffer.alloc(size);
  SIGNATURES[type]?.copy(bytes, 0, 0, Math.min(size, SIGNATURES[type].length));
  return bytes;
}

// A file part: { buffer, fileName, mimeType }. `bytesOf` sets the real content type when it differs
// from the declared one (a PNG declared as a PDF).
export function documentFile({
  fileName = 'document.pdf',
  mimeType = 'application/pdf',
  size = 2048,
  bytesOf = mimeType,
} = {}) {
  return { buffer: fileBytes(bytesOf, size), fileName, mimeType };
}

// A complete first submission: Government ID (PDF passport) and Profile Photo (PNG), plus the
// Company Registration Certificate (PDF) for a Company.
export function documentSet(developerType = 'individual') {
  return {
    files: {
      government_id: documentFile({ fileName: 'passport.pdf' }),
      ...(developerType === 'company' && {
        company_registration_certificate: documentFile({ fileName: 'certificate.pdf' }),
      }),
      profile_photo: documentFile({ fileName: 'me.png', mimeType: 'image/png' }),
    },
    idDocumentType: 'passport',
  };
}
