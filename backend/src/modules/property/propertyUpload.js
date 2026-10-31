import multer from 'multer';
import {
  commonMessages,
  LIMITS,
  propertyFileSchema,
  propertyMessages as m,
  toFieldErrors,
} from '@real-estate/shared';
import { AppError } from '../../utils/AppError.js';
import { sniffMimeType } from '../auth/documentUpload.js';

// Multipart parsing and file validation for every property route that receives a file (PROP-SPEC-001):
// one file part plus text fields. The file is checked with the shared propertyFileSchema using the type
// sniffed from its bytes, never the browser's claim. Errors: the file's on `file`, a field's on its name,
// unknown parts on `_form`, all 422; an unreadable body is 400. Nothing is uploaded here.

const MAX_FIELDS = 10;
// The largest body a property upload reads: the biggest file (a video) plus room for the fields and headers.
const MAX_BODY_BYTES = LIMITS.property.maxVideoBytes + 64 * 1024;

const VIDEO_PURPOSES = new Set(['video', 'tour_360']);
const MP4_BRAND_BOX = [0x66, 0x74, 0x79, 0x70]; // "ftyp" at offset 4 (ISO base media file)

// The real type of a file from its first bytes: PDF, PNG, JPEG or MP4, otherwise null.
export function sniffPropertyMimeType(buffer) {
  if (buffer.length >= 8 && MP4_BRAND_BOX.every((byte, i) => buffer[4 + i] === byte)) return 'video/mp4';
  return sniffMimeType(buffer);
}

// Where Cloudinary keeps a file of this type; raw files keep their extension in the public id.
export const RESOURCE_TYPE_BY_MIME = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'video/mp4': 'video',
  'application/pdf': 'raw',
};

const validationError = (fields) => new AppError('VALIDATION_ERROR', { fields });
const sizeMessage = (purpose) =>
  VIDEO_PURPOSES.has(purpose) ? m.file.sizeBytes.maxVideo : m.file.sizeBytes.max;
const UNEXPECTED_PART = new Set([
  'LIMIT_UNEXPECTED_FILE',
  'LIMIT_FILE_COUNT',
  'LIMIT_FIELD_COUNT',
  'LIMIT_PART_COUNT',
]);

// The file part, checked for `purpose`. Returns { file } or { fields }.
function readFile(part, purpose) {
  if (part.size === 0) return { fields: { file: [m.file.sizeBytes.empty] } };
  const mimeType = sniffPropertyMimeType(part.buffer) ?? 'application/octet-stream';
  const result = propertyFileSchema.safeParse({
    purpose,
    fileName: part.originalname,
    mimeType,
    sizeBytes: part.size,
  });
  if (!result.success) return { fields: { file: Object.values(toFieldErrors(result.error)).flat() } };
  return { file: { ...result.data, buffer: part.buffer } };
}

// fieldsSchema: the shared schema of the text fields. purposeOf(fields): the file's purpose, from the
// validated fields. fileRequired: false for an optional file (absent → req.validated.file is null).
// Sets req.validated = { fields, file: { purpose, fileName, mimeType, sizeBytes, buffer } | null }.
export function propertyUpload({ fieldsSchema, purposeOf, fileRequired = true }) {
  const parse = multer({
    storage: multer.memoryStorage(),
    defParamCharset: 'utf8',
    limits: {
      fileSize: LIMITS.property.maxVideoBytes,
      files: 1,
      fields: MAX_FIELDS,
      parts: MAX_FIELDS + 1,
      fieldNameSize: 100,
      fieldSize: 8 * 1024,
      headerPairs: 100,
    },
  }).single('file');

  return function propertyUploadMiddleware(req, res, next) {
    // A declared body larger than any allowed upload is refused before it is read.
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      res.set('Connection', 'close');
      return next(validationError({ file: [m.file.sizeBytes.maxVideo] }));
    }

    parse(req, res, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        const parsedFields = fieldsSchema.safeParse(req.body ?? {});
        const purpose = parsedFields.success ? purposeOf(parsedFields.data) : undefined;
        return next(validationError({ file: [sizeMessage(purpose)] }));
      }
      if (error instanceof multer.MulterError && UNEXPECTED_PART.has(error.code)) {
        return next(validationError({ _form: [commonMessages.unknownField] }));
      }
      if (error) return next(new AppError('BAD_REQUEST'));

      const parsedFields = fieldsSchema.safeParse(req.body ?? {});
      const fields = parsedFields.success ? {} : toFieldErrors(parsedFields.error);
      let file = null;
      if (!req.file) {
        if (fileRequired) fields.file = [m.file.required];
      } else if (parsedFields.success) {
        const read = readFile(req.file, purposeOf(parsedFields.data));
        if (read.fields) Object.assign(fields, read.fields);
        else file = read.file;
      }
      if (Object.keys(fields).length > 0) return next(validationError(fields));
      req.validated = { fields: parsedFields.data, file };
      next();
    });
  };
}
