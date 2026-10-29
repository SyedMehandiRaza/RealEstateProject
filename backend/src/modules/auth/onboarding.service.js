import { authMessages, commonMessages } from '@real-estate/shared';
import { AppError } from '../../utils/AppError.js';
import { toWholeSeconds } from '../../utils/time.js';
import { toProfileResponse } from './auth.presenter.js';
import { documentFieldPath } from './documentUpload.js';
import {
  latestDocumentByKind,
  requiredDocumentKinds,
  VERIFICATION_STATUS,
  verificationStatus,
} from './verificationStatus.js';

const IN_REVIEW_OR_APPROVED = ['pending', 'approved'];
const alreadySubmitted = () =>
  new AppError('CONFLICT', { message: authMessages.api.documentAlreadySubmitted });

// PDFs are Cloudinary 'raw' assets, JPG/PNG 'image' (DEC-016, chk_verification_documents_resource_type).
const resourceTypeOf = (mimeType) => (mimeType === 'application/pdf' ? 'raw' : 'image');

// Which sent kinds the Developer may submit now, given their document rows (SPEC-001, DEC-022, Q-036).
// A kind whose latest document is pending or approved: 409 CONFLICT, before anything else. A kind the
// Type of Developer does not require: 422. Every required kind with no document yet must be sent
// (422 "Upload your <document name>" at documents.<kind>.file). A kind whose latest document was
// rejected may be sent again. An empty request asks for every kind that can be sent, or is a 409 when
// none can.
function checkSubmission({ developerType, existing, documents }) {
  const required = requiredDocumentKinds(developerType);
  const latest = latestDocumentByKind(existing);
  const sent = documents.map((document) => document.documentKind);
  if (sent.some((kind) => IN_REVIEW_OR_APPROVED.includes(latest[kind]?.status))) throw alreadySubmitted();

  const fields = {};
  for (const kind of sent) {
    if (!required.includes(kind)) fields[documentFieldPath(kind, 'file')] = [commonMessages.unknownField];
  }
  const sendable = required.filter((kind) => !IN_REVIEW_OR_APPROVED.includes(latest[kind]?.status));
  if (sent.length === 0 && sendable.length === 0) throw alreadySubmitted();
  const askFor =
    sent.length === 0 ? sendable : required.filter((kind) => !latest[kind] && !sent.includes(kind));
  for (const kind of askFor)
    fields[documentFieldPath(kind, 'file')] = [authMessages.documents.required[kind]];

  if (Object.keys(fields).length > 0) throw new AppError('VALIDATION_ERROR', { fields });
}

// Developer onboarding use cases (SPEC-001): Professional info, and later the Verification documents.
// Input is already validated by the shared schemas; the routes have checked the Developer role.
export function createOnboardingService({ sequelize, repository, onboardingRepository, fileUploads, clock }) {
  const statusOf = (profile) =>
    verificationStatus({ developerType: profile.businessType, documents: profile.documents ?? [] });

  return {
    // Creates or replaces the Developer's one profile (SPEC-001: 200 { profile }). The Account row is
    // locked first, so concurrent PUTs for one Account run in turn and never create two profiles.
    // Editable until the Developer is Active; an Active Developer gets 409 CONFLICT, because editing
    // after approval needs a re-review rule that is not decided (Q-033, assumed option a).
    async saveProfessionalProfile({
      userId,
      companyName,
      developerType,
      licenseNumber,
      experienceLevel,
      location,
    }) {
      const values = {
        organizationName: companyName ?? null,
        businessType: developerType,
        licenseNumber,
        experienceLevel,
        location,
      };
      const profile = await sequelize.transaction(async (transaction) => {
        if (!(await repository.lockUserById(userId, { transaction }))) throw new AppError('UNAUTHORIZED');
        const existing = await onboardingRepository.findProfileWithDocuments(userId, { transaction });
        if (!existing) return onboardingRepository.createProfile({ userId, ...values }, { transaction });
        if (statusOf(existing).status === VERIFICATION_STATUS.active) throw new AppError('CONFLICT');
        return existing.update(values, { transaction });
      });
      return { profile: toProfileResponse(profile) };
    },

    // The Developer's Verification status (SPEC-001: GET /me/verification, 200 { status, documents }):
    // one entry per kind the Type of Developer requires, from its latest row. Without Professional info
    // there is no Type of Developer, so no required kinds: 403 FORBIDDEN, as for POST /me/documents
    // (401 if the Account is gone).
    async getVerification({ userId }) {
      const profile = await onboardingRepository.findProfileWithDocuments(userId);
      if (!profile) {
        if (!(await repository.findUserById(userId))) throw new AppError('UNAUTHORIZED');
        throw new AppError('FORBIDDEN');
      }
      return statusOf(profile);
    },

    // Stores the sent Verification documents and returns the new Verification status (SPEC-001:
    // 201 { verification }, the GET /me/verification shape). documents: the parsed documentUploadSchema
    // values plus each file's buffer. The rules are checked before any upload, so a refused request
    // uploads nothing. The files are then uploaded in parallel under documents/<profile id>/ and, once
    // every upload succeeded, the rows are written in one transaction, never with Cloudinary inside it
    // (DEC-018). The profile row is locked there and the rules are checked again, so of two racing
    // submissions one gets 409. If an upload or the transaction fails, uploadAllAndSave deletes (or
    // queues as save_failed) every file that was uploaded.
    async submitDocuments({ userId, documents }) {
      const profile = await onboardingRepository.findProfileWithDocuments(userId);
      if (!profile) {
        if (!(await repository.findUserById(userId))) throw new AppError('UNAUTHORIZED');
        throw new AppError('FORBIDDEN'); // no Professional info yet
      }
      checkSubmission({ developerType: profile.businessType, existing: profile.documents, documents });

      const folder = `documents/${profile.id}`;
      const saveAll = (uploaded) =>
        sequelize.transaction(async (transaction) => {
          const locked = await onboardingRepository.lockProfile(profile.id, { transaction });
          if (!locked) throw new AppError('UNAUTHORIZED'); // the Account was deleted meanwhile
          const existing = await onboardingRepository.findDocuments(profile.id, { transaction });
          checkSubmission({ developerType: locked.businessType, existing, documents });
          const createdAt = toWholeSeconds(clock.now());
          const created = await onboardingRepository.createDocuments(
            documents.map((document, i) => ({
              professionalProfileId: profile.id,
              documentKind: document.documentKind,
              idDocumentType: document.idDocumentType ?? null,
              cloudinaryPublicId: uploaded[i].publicId,
              cloudinaryResourceType: uploaded[i].resourceType,
              originalFilename: document.fileName,
              mimeType: document.mimeType,
              sizeBytes: document.sizeBytes,
              status: 'pending',
              createdAt,
              updatedAt: createdAt,
            })),
            { transaction },
          );
          return verificationStatus({
            developerType: locked.businessType,
            documents: [...existing, ...created],
          });
        });

      const files = documents.map((document) => ({
        buffer: document.buffer,
        folder,
        resourceType: resourceTypeOf(document.mimeType),
      }));
      return { verification: await fileUploads.uploadAllAndSave(files, saveAll) };
    },
  };
}
