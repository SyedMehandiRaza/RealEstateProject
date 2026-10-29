import { DOCUMENT_KINDS } from '@real-estate/shared';

// Verification status (SPEC-001, DEC-014, DEC-022): a pure function of the Developer's Type of Developer
// and their verification_documents rows. No status is stored.

// Headline values, as the status pages read them (frontend verificationOutcome).
export const VERIFICATION_STATUS = Object.freeze({
  underReview: 'under_review',
  active: 'active',
  unsuccessful: 'unsuccessful',
});

// Government ID and Profile Photo always; the Company Registration Certificate only for a Company.
export function requiredDocumentKinds(developerType) {
  return DOCUMENT_KINDS.filter(
    (kind) => kind !== 'company_registration_certificate' || developerType === 'company',
  );
}

// Newest first: created_at, then id (DATETIME keeps whole seconds, so two rows can share a time).
const newer = (a, b) => b.createdAt - a.createdAt || b.id - a.id;

// The latest document of each kind, or undefined for a kind never uploaded.
export function latestDocumentByKind(documents) {
  const latest = {};
  for (const document of [...documents].sort(newer)) latest[document.documentKind] ??= document;
  return latest;
}

// { status, documents }: one entry per required kind (in DOCUMENT_KINDS order) from its latest row,
// all null but `documentKind` when that kind has no row. Any latest required rejected → Unsuccessful;
// all approved → Active; otherwise Under Review (also before the first upload).
export function verificationStatus({ developerType, documents }) {
  const latest = latestDocumentByKind(documents);
  const entries = requiredDocumentKinds(developerType).map((documentKind) => {
    const document = latest[documentKind];
    return {
      documentKind,
      status: document?.status ?? null,
      rejectionReason: document?.rejectionReason ?? null,
      fileName: document?.originalFilename ?? null,
      sizeBytes: document?.sizeBytes ?? null,
    };
  });

  let status = VERIFICATION_STATUS.underReview;
  if (entries.some((entry) => entry.status === 'rejected')) status = VERIFICATION_STATUS.unsuccessful;
  else if (entries.every((entry) => entry.status === 'approved')) status = VERIFICATION_STATUS.active;
  return { status, documents: entries };
}
