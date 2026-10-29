import multer from 'multer';
import {
  authMessages as m,
  commonMessages,
  DOCUMENT_KINDS,
  documentUploadSchema,
  LIMITS,
  toFieldErrors,
} from '@real-estate/shared';
import { AppError } from '../../utils/AppError.js';

// Multipart parsing and per-file validation for POST /me/documents (SPEC-001, TASK-028). One file part
// per document kind, named after the kind, plus the text field `idDocumentType` (the Government ID's
// type). Each file is checked with the shared documentUploadSchema, then its first bytes are sniffed.

export const ID_DOCUMENT_TYPE_FIELD = 'idDocumentType';

// The error key of one document's field, as the Upload page reads it (Q-036).
export const documentFieldPath = (kind, field) => `documents.${kind}.${field}`;

// Memory storage: files go straight to Cloudinary, never to disk. At most one file per kind, at most
// LIMITS.auth.maxFileBytes each (multer allows exactly the limit), and one text field.
const parseMultipart = multer({
  storage: multer.memoryStorage(),
  defParamCharset: 'utf8', // file names as the browser sends them (UTF-8), not latin1
  limits: {
    fileSize: LIMITS.auth.maxFileBytes,
    files: DOCUMENT_KINDS.length,
    fields: 1,
    fieldNameSize: 100,
    fieldSize: 1024,
    parts: DOCUMENT_KINDS.length + 1,
    headerPairs: 100,
  },
}).fields(DOCUMENT_KINDS.map((name) => ({ name, maxCount: 1 })));

// The largest body POST /me/documents reads: every kind at the file limit, plus room for the part headers,
// boundaries and the idDocumentType field (64 KiB, far more than they take).
export const MAX_DOCUMENTS_BODY_BYTES = LIMITS.auth.maxFileBytes * DOCUMENT_KINDS.length + 64 * 1024;

// Express middleware, before any other check that reads the database or the body (TASK-053): a declared
// Content-Length above MAX_DOCUMENTS_BODY_BYTES is refused with 400 BAD_REQUEST (as an oversized JSON
// body is) and the connection is closed, so the body is never read. A chunked body has no length; multer's
// per-file and file-count limits still bound it.
export function rejectOversizedDocumentsBody(req, res, next) {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_DOCUMENTS_BODY_BYTES) {
    res.set('Connection', 'close');
    return next(new AppError('BAD_REQUEST'));
  }
  next();
}

// Parts the request may not contain: an unknown file part, a second file of a kind, or extra fields.
const UNEXPECTED_PART = new Set([
  'LIMIT_UNEXPECTED_FILE',
  'LIMIT_FILE_COUNT',
  'LIMIT_FIELD_COUNT',
  'LIMIT_PART_COUNT',
]);

const validationError = (fields) => new AppError('VALIDATION_ERROR', { fields });

function toUploadError(error) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE' && DOCUMENT_KINDS.includes(error.field)) {
      return validationError({ [documentFieldPath(error.field, 'sizeBytes')]: [m.sizeBytes.max] });
    }
    if (UNEXPECTED_PART.has(error.code)) return validationError({ _form: [commonMessages.unknownField] });
  }
  // A body that is not readable multipart (bad boundary, truncated part, oversized text field).
  return new AppError('BAD_REQUEST');
}

const startsWith = (buffer, signature) =>
  buffer.length >= signature.length && signature.every((byte, i) => buffer[i] === byte);

const SIGNATURES = [
  ['application/pdf', [0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  ['image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ['image/jpeg', [0xff, 0xd8, 0xff]],
];

// The real type of a file from its first bytes: one of DOCUMENT_MIME_TYPES, or null.
export function sniffMimeType(buffer) {
  return SIGNATURES.find(([, signature]) => startsWith(buffer, signature))?.[0] ?? null;
}

// Builds and checks every sent document. Returns { documents, fields }: documents are the parsed
// schema values plus `buffer`, fields the errors keyed for the API contract (empty when all is well).
// Required kinds and already-submitted kinds need the profile, so the service checks those.
export function readDocuments({ files, body }) {
  const fields = {};
  const documents = [];
  const idDocumentType = body[ID_DOCUMENT_TYPE_FIELD];

  if (Object.keys(body).some((key) => key !== ID_DOCUMENT_TYPE_FIELD)) {
    fields._form = [commonMessages.unknownField];
  }
  if (idDocumentType !== undefined && !files.government_id) {
    fields[ID_DOCUMENT_TYPE_FIELD] = [m.idDocumentType.notAllowed];
  }

  for (const kind of DOCUMENT_KINDS) {
    const file = files[kind]?.[0];
    if (!file) continue;
    const result = documentUploadSchema.safeParse({
      documentKind: kind,
      ...(kind === 'government_id' && idDocumentType !== undefined && { idDocumentType }),
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    if (!result.success) {
      for (const [field, messages] of Object.entries(toFieldErrors(result.error))) {
        fields[documentFieldPath(kind, field)] = messages;
      }
    } else if (sniffMimeType(file.buffer) !== result.data.mimeType) {
      fields[documentFieldPath(kind, 'mimeType')] = [m.mimeType.invalid];
    } else {
      documents.push({ ...result.data, buffer: file.buffer });
    }
  }
  return { documents, fields };
}

// Express middleware: parses the multipart body, then sets req.validated.documents or answers 422.
export function documentUpload(req, res, next) {
  parseMultipart(req, res, (error) => {
    if (error) return next(toUploadError(error));
    const { documents, fields } = readDocuments({ files: req.files ?? {}, body: req.body ?? {} });
    if (Object.keys(fields).length > 0) return next(validationError(fields));
    req.validated = { documents };
    next();
  });
}
