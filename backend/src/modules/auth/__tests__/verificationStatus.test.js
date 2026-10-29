import { requiredDocumentKinds, VERIFICATION_STATUS, verificationStatus } from '../verificationStatus.js';

// The pure Verification status function (SPEC-001, DEC-014, DEC-022): required kinds per Type of
// Developer, the latest row per kind, and the headline.

let nextId = 1;
const doc = (documentKind, status, { at = '2026-10-29T10:00:00Z', rejectionReason = null } = {}) => ({
  id: nextId++,
  documentKind,
  status,
  rejectionReason,
  originalFilename: `${documentKind}.pdf`,
  sizeBytes: 1000,
  createdAt: new Date(at),
});

const kindsOf = (result) => result.documents.map((document) => document.documentKind);

describe('requiredDocumentKinds', () => {
  it('is Government ID and Profile Photo for an Individual', () => {
    expect(requiredDocumentKinds('individual')).toEqual(['government_id', 'profile_photo']);
  });

  it('adds the Company Registration Certificate for a Company', () => {
    expect(requiredDocumentKinds('company')).toEqual([
      'government_id',
      'company_registration_certificate',
      'profile_photo',
    ]);
  });
});

describe('verificationStatus', () => {
  it('lists every required kind with nulls when nothing was uploaded, Under Review', () => {
    const result = verificationStatus({ developerType: 'company', documents: [] });

    expect(result).toEqual({
      status: VERIFICATION_STATUS.underReview,
      documents: [
        {
          documentKind: 'government_id',
          status: null,
          rejectionReason: null,
          fileName: null,
          sizeBytes: null,
        },
        {
          documentKind: 'company_registration_certificate',
          status: null,
          rejectionReason: null,
          fileName: null,
          sizeBytes: null,
        },
        {
          documentKind: 'profile_photo',
          status: null,
          rejectionReason: null,
          fileName: null,
          sizeBytes: null,
        },
      ],
    });
  });

  it('is Under Review while every latest document is pending', () => {
    const result = verificationStatus({
      developerType: 'individual',
      documents: [doc('government_id', 'pending'), doc('profile_photo', 'pending')],
    });

    expect(result.status).toBe('under_review');
    expect(result.documents).toEqual([
      {
        documentKind: 'government_id',
        status: 'pending',
        rejectionReason: null,
        fileName: 'government_id.pdf',
        sizeBytes: 1000,
      },
      {
        documentKind: 'profile_photo',
        status: 'pending',
        rejectionReason: null,
        fileName: 'profile_photo.pdf',
        sizeBytes: 1000,
      },
    ]);
  });

  it('is Active when every required latest document is approved', () => {
    const result = verificationStatus({
      developerType: 'individual',
      documents: [doc('government_id', 'approved'), doc('profile_photo', 'approved')],
    });
    expect(result.status).toBe('active');
  });

  it('is Under Review for a Company with the certificate still missing', () => {
    const result = verificationStatus({
      developerType: 'company',
      documents: [doc('government_id', 'approved'), doc('profile_photo', 'approved')],
    });
    expect(result.status).toBe('under_review');
    expect(kindsOf(result)).toEqual(['government_id', 'company_registration_certificate', 'profile_photo']);
  });

  it('is Unsuccessful when any latest required document is rejected, with its reason as written', () => {
    const result = verificationStatus({
      developerType: 'company',
      documents: [
        doc('government_id', 'approved'),
        doc('company_registration_certificate', 'pending'),
        doc('profile_photo', 'rejected', { rejectionReason: 'Photo is blurry' }),
      ],
    });
    expect(result.status).toBe('unsuccessful');
    expect(result.documents[2]).toMatchObject({ status: 'rejected', rejectionReason: 'Photo is blurry' });
  });

  it('uses the latest row per kind, so a resubmission after a rejection is Under Review again', () => {
    const result = verificationStatus({
      developerType: 'individual',
      documents: [
        doc('government_id', 'pending', { at: '2026-10-29T12:00:00Z' }),
        doc('government_id', 'rejected', { at: '2026-10-29T10:00:00Z', rejectionReason: 'Expired ID' }),
        doc('profile_photo', 'approved'),
      ],
    });
    expect(result.status).toBe('under_review');
    expect(result.documents[0]).toMatchObject({ status: 'pending', rejectionReason: null });
  });

  it('breaks a created_at tie by the higher id (DATETIME has whole seconds)', () => {
    const older = doc('government_id', 'rejected', { rejectionReason: 'Expired ID' });
    const newer = doc('government_id', 'approved');
    const result = verificationStatus({
      developerType: 'individual',
      documents: [newer, older, doc('profile_photo', 'approved')],
    });
    expect(result.status).toBe('active');
  });

  it('ignores a kind that is not required for the Type of Developer', () => {
    const result = verificationStatus({
      developerType: 'individual',
      documents: [
        doc('government_id', 'approved'),
        doc('company_registration_certificate', 'rejected', { rejectionReason: 'Unreadable' }),
        doc('profile_photo', 'approved'),
      ],
    });
    expect(result.status).toBe('active');
    expect(kindsOf(result)).toEqual(['government_id', 'profile_photo']);
  });
});
