import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  DOCUMENT_KINDS,
  DOCUMENT_MIME_TYPES,
  ERROR_CODES,
  ID_DOCUMENT_TYPES,
  PHOTO_MIME_TYPES,
  documentUploadSchema,
} from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import { useGetVerificationQuery, useSubmitDocumentsMutation } from '../../api/authApi.js';
import DocumentSlot from '../../components/DocumentSlot.jsx';
import { AUTH_PATHS } from '../../routes.jsx';
import styles from './UploadDocumentsPage.module.css';

const GOVERNMENT_ID = 'government_id';

// Per document kind: the Figma label and the dropzone copy. Profile Photo takes only JPG / PNG (DEC-021).
const SLOT_COPY = {
  government_id: { label: 'Government ID', mimeTypes: DOCUMENT_MIME_TYPES },
  company_registration_certificate: {
    label: 'Company Registration Certificate',
    mimeTypes: DOCUMENT_MIME_TYPES,
  },
  profile_photo: { label: 'Profile Photo', mimeTypes: PHOTO_MIME_TYPES },
};
const FORMAT_NAMES = { 'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG' };
const formatsText = (mimeTypes) =>
  `Supported formats: ${mimeTypes.map((type) => FORMAT_NAMES[type]).join(', ')}`;

// "Docu type" dropdown (13038:4986), in the shared ID_DOCUMENT_TYPES order.
const ID_TYPE_LABELS = { driving_license: 'Driving License', passport: 'Passport', pan_card: 'PAN Card' };
const ID_TYPE_OPTIONS = ID_DOCUMENT_TYPES.map((value) => ({ value, label: ID_TYPE_LABELS[value] }));

// A kind can be uploaded when it has no document yet or its latest one was rejected (resubmission).
const uploadableKinds = (verification) => {
  const open = new Set(
    (verification?.documents ?? [])
      .filter((document) => document.status == null || document.status === 'rejected')
      .map((document) => document.documentKind),
  );
  return DOCUMENT_KINDS.filter((kind) => open.has(kind));
};

// Checks one file with the shared documentUploadSchema. Returns the first message per slot field:
// `file` (name, type, size, photo type) and `idDocumentType` (the Government ID type).
function checkDocument(kind, file, idDocumentType) {
  const result = documentUploadSchema.safeParse({
    documentKind: kind,
    ...(kind === GOVERNMENT_ID && idDocumentType ? { idDocumentType } : {}),
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  const errors = {};
  for (const issue of result.success ? [] : result.error.issues) {
    const field = issue.path[0] === 'idDocumentType' ? 'idDocumentType' : 'file';
    errors[field] ??= issue.message;
  }
  return errors;
}

const SERVER_FIELD = /^documents\.([a-z_]+)\.([A-Za-z]+)$/;

// Maps a failed POST /me/documents onto the slots. Fields come as "documents.<kind>.<field>" (SPEC-001,
// Q-036): idDocumentType goes under the type Select, every other field on the file. Anything else
// (409 CONFLICT, 403, unknown fields) is the form-level message, shown as returned.
function serverErrors(error, kinds) {
  const apiError = error?.data?.error;
  if (!apiError) return { slots: {}, form: ERROR_CODES.INTERNAL_ERROR.message };
  const slots = {};
  let form = null;
  for (const [path, messages] of Object.entries(apiError.fields ?? {})) {
    const match = SERVER_FIELD.exec(path);
    if (match && kinds.includes(match[1])) {
      const field = match[2] === 'idDocumentType' ? 'idDocumentType' : 'file';
      slots[match[1]] = { ...slots[match[1]], [field]: slots[match[1]]?.[field] ?? messages[0] };
    } else {
      form ??= messages[0];
    }
  }
  if (!form && Object.keys(slots).length === 0) form = apiError.message;
  return { slots, form };
}

const isImage = (file) => file.type.startsWith('image/');

// Figma: Upload Document (developer) 13038:4578 and its Uploaded state 13038:4887. Developer only
// (ProtectedRoute; the API enforces it). The slots are the required kinds from GET /me/verification
// (Company: 3, Individual: 2, DEC-022). Each picked file is checked with documentUploadSchema before
// it is added; remove (x) happens only here; Next sends every file in one multipart request and then
// opens the status screen.
export default function UploadDocumentsPage() {
  const navigate = useNavigate();
  const verificationQuery = useGetVerificationQuery(undefined, { refetchOnMountOrArgChange: true });
  const [submitDocuments, { isLoading: isSubmitting }] = useSubmitDocumentsMutation();

  const [picked, setPicked] = useState({}); // kind -> { file, thumbnail }
  const [idDocumentType, setIdDocumentType] = useState('');
  const [errors, setErrors] = useState({}); // kind -> { file?, idDocumentType? }
  const [formError, setFormError] = useState(null);

  // Revoke the image previews still shown when the page goes away.
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => () => Object.values(pickedRef.current).forEach((entry) => revoke(entry.thumbnail)), []);

  const { data: verification, isSuccess, error: loadError } = verificationQuery;
  const kinds = uploadableKinds(verification);

  if (isSuccess && kinds.length === 0) {
    return <Navigate to={AUTH_PATHS.verificationStatus} replace />;
  }

  const setSlotError = (kind, slotErrors) => setErrors((current) => ({ ...current, [kind]: slotErrors }));

  function pick(kind, file) {
    const { file: fileError } = checkDocument(kind, file, idDocumentType);
    if (fileError) {
      setSlotError(kind, { ...errors[kind], file: fileError });
      return;
    }
    revoke(picked[kind]?.thumbnail);
    const thumbnail = isImage(file) ? URL.createObjectURL(file) : undefined;
    setPicked((current) => ({ ...current, [kind]: { file, thumbnail } }));
    setSlotError(kind, { ...errors[kind], file: undefined });
  }

  function remove(kind) {
    revoke(picked[kind]?.thumbnail);
    setPicked(({ [kind]: _removed, ...rest }) => rest);
    setSlotError(kind, { ...errors[kind], file: undefined });
  }

  function chooseIdType(value) {
    setIdDocumentType(value);
    setSlotError(GOVERNMENT_ID, { ...errors[GOVERNMENT_ID], idDocumentType: undefined });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = {};
    for (const kind of kinds) {
      const slotErrors = checkDocument(kind, picked[kind].file, idDocumentType);
      if (Object.keys(slotErrors).length) nextErrors[kind] = slotErrors;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body = new FormData();
    for (const kind of kinds) {
      body.append(kind, picked[kind].file, picked[kind].file.name);
    }
    if (kinds.includes(GOVERNMENT_ID)) body.append('idDocumentType', idDocumentType);

    try {
      await submitDocuments(body).unwrap();
      navigate(AUTH_PATHS.verificationStatus, { replace: true });
    } catch (error) {
      const { slots, form } = serverErrors(error, kinds);
      setErrors(slots);
      setFormError(form);
    }
  }

  const allPicked = kinds.length > 0 && kinds.every((kind) => picked[kind]);
  const loadMessage = loadError
    ? (loadError.data?.error?.message ?? ERROR_CODES.INTERNAL_ERROR.message)
    : null;
  const alert = formError ?? loadMessage;

  return (
    <AuthSplitLayout
      title="Upload Documents"
      subtitle="Upload the required documents to verify your identity and agency. This helps you gain trust and access all features."
      tagline="Upload your ID and agency documents to get verified and access all features securely."
      backLabel="Go back"
      backTo={null}
      contentGap={20}
    >
      <form className={styles.form} noValidate onSubmit={onSubmit}>
        {kinds.length > 0 && (
          <div className={styles.slots}>
            {kinds.map((kind) => (
              <DocumentSlot
                key={kind}
                label={SLOT_COPY[kind].label}
                formatsText={formatsText(SLOT_COPY[kind].mimeTypes)}
                accept={SLOT_COPY[kind].mimeTypes.join(',')}
                file={picked[kind]?.file}
                thumbnail={picked[kind]?.thumbnail}
                fileError={errors[kind]?.file}
                onFileSelect={(file) => pick(kind, file)}
                onRemove={() => remove(kind)}
                typeSelect={
                  kind === GOVERNMENT_ID
                    ? {
                        options: ID_TYPE_OPTIONS,
                        value: idDocumentType,
                        onChange: chooseIdType,
                        error: errors[kind]?.idDocumentType,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
        <div className={styles.actions}>
          {alert && (
            <p role="alert" className={styles.error}>
              {alert}
            </p>
          )}
          <Button type="submit" disabled={!allPicked || isSubmitting}>
            Next
          </Button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

function revoke(url) {
  if (url) URL.revokeObjectURL(url);
}
