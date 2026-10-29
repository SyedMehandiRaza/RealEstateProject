import { DOCUMENT_STATUSES } from '@real-estate/shared';
import { hashPassword } from '../utils/password.js';
import { toWholeSeconds } from '../utils/time.js';
import { latestDocumentByKind, requiredDocumentKinds } from '../modules/auth/verificationStatus.js';
import {
  CODE_PURPOSES,
  CODE_TTL_MS,
  DEAD_RESET_CODES_CAP,
  MAX_ATTEMPTS,
} from '../modules/auth/verificationCode.service.js';

// Seed data for the e2e harness (TASK-042), written straight into the test database because some states
// (a reviewed document) have no API: document review is admin-only and not built yet. Rows satisfy every
// CHECK of the auth tables. Used by the /api/__e2e/seed routes and tested in e2eSeeds.int.test.js.

export const SEED_DEFAULTS = Object.freeze({
  password: 'secret123',
  fullName: 'E2E Tester',
  phone: '+971501234567',
  rejectionReason: 'The document is unreadable',
});

const ROLES = ['buyer', 'developer'];
const DEVELOPER_TYPES = ['individual', 'company'];

// A seed request the harness cannot honour. The router answers it with 400 and the message.
export class SeedError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'SeedError';
    this.status = status;
  }
}

const check = (condition, message) => {
  if (!condition) throw new SeedError(message);
};

// DATETIME keeps whole seconds; seeded documents are dated a minute back, so a document the app stores
// during the test (dated now) is the latest of its kind.
const SEEDED_DOCUMENT_AGE_MS = 60_000;

let seeded = 0;
const uniqueEmail = (role) => `e2e-${role}-${Date.now()}-${(seeded += 1)}@example.com`;

// { kind: status } for the required kinds: one status for all of them, or a map naming some of them.
function documentStatuses(documents, developerType) {
  const kinds = requiredDocumentKinds(developerType);
  const statuses =
    typeof documents === 'string' ? Object.fromEntries(kinds.map((kind) => [kind, documents])) : documents;
  check(statuses && typeof statuses === 'object', 'documents must be a status or a { kind: status } map');
  for (const [kind, status] of Object.entries(statuses)) {
    check(kinds.includes(kind), `documents: ${kind} is not required for a ${developerType} developer`);
    check(DOCUMENT_STATUSES.includes(status), `documents: unknown status "${status}"`);
  }
  return statuses;
}

function documentRow(profileId, documentKind, status, { rejectionReason, createdAt, reviewedAt }) {
  seeded += 1;
  return {
    professionalProfileId: profileId,
    documentKind,
    idDocumentType: documentKind === 'government_id' ? 'passport' : null,
    cloudinaryPublicId: `realestate/test/documents/${profileId}/e2e-seeded-${Date.now()}-${seeded}`,
    cloudinaryResourceType: 'image',
    originalFilename: `${documentKind}.png`,
    mimeType: 'image/png',
    sizeBytes: 2048,
    status,
    rejectionReason: status === 'rejected' ? rejectionReason : null,
    reviewedAt: status === 'pending' ? null : reviewedAt,
    createdAt,
    updatedAt: createdAt,
  };
}

// A password_reset code that took MAX_ATTEMPTS wrong guesses, created `minutesAgo` before `now`. Its
// hash matches no code (all zeros is no HMAC output in practice), so it could never be accepted anyway.
function deadResetCodeRow(userId, now, minutesAgo) {
  const createdAt = new Date(now.getTime() - minutesAgo * 60_000);
  return {
    userId,
    purpose: CODE_PURPOSES.passwordReset,
    codeHash: '0'.repeat(64),
    attempts: MAX_ATTEMPTS,
    expiresAt: new Date(createdAt.getTime() + CODE_TTL_MS),
    createdAt,
  };
}

const documentSummary = ({ id, documentKind, status, rejectionReason }) => ({
  id,
  documentKind,
  status,
  rejectionReason,
});

// Creates an Account. Options (all optional):
// - role: 'buyer' (default) or 'developer'; email (unique by default), password, fullName, phone
// - verified: email verified (default true)
// - professionalInfo: Developers only, default true; false leaves the Developer before Professional info
// - developerType: 'individual' (default) or 'company'
// - documents: Developers with Professional info only. One status for every required kind
//   ('pending' | 'approved' | 'rejected') or a map such as { government_id: 'rejected', profile_photo:
//   'approved' }; rejectionReason applies to the rejected ones. Omitted: no documents.
// - deadResetCodes: 0 (default) to DEAD_RESET_CODES_CAP password_reset codes used up by wrong guesses,
//   dated a minute apart and at least two minutes back, so the resend cooldown is over (TASK-054).
// Returns { id, email, password, roles, professionalProfileId, documents }.
export async function seedAccount(models, sequelize, options = {}) {
  const {
    role = 'buyer',
    email = uniqueEmail(role),
    password = SEED_DEFAULTS.password,
    fullName = SEED_DEFAULTS.fullName,
    phone = SEED_DEFAULTS.phone,
    verified = true,
    professionalInfo = role === 'developer',
    developerType = 'individual',
    documents,
    rejectionReason = SEED_DEFAULTS.rejectionReason,
    deadResetCodes = 0,
  } = options;
  check(ROLES.includes(role), `role must be one of ${ROLES.join(', ')}`);
  check(typeof email === 'string' && email.includes('@'), 'email must be an email address');
  check(typeof password === 'string' && password.length > 0, 'password must be a non-empty string');
  check(
    DEVELOPER_TYPES.includes(developerType),
    `developerType must be one of ${DEVELOPER_TYPES.join(', ')}`,
  );
  check(!professionalInfo || role === 'developer', 'professionalInfo is for Developers only');
  check(documents === undefined || professionalInfo, 'documents need a Developer with professionalInfo');
  check(
    Number.isInteger(deadResetCodes) && deadResetCodes >= 0 && deadResetCodes <= DEAD_RESET_CODES_CAP,
    `deadResetCodes must be an integer from 0 to ${DEAD_RESET_CODES_CAP}`,
  );
  const statuses = documents === undefined ? {} : documentStatuses(documents, developerType);

  const passwordHash = await hashPassword(password);
  const now = toWholeSeconds(new Date());

  return sequelize.transaction(async (transaction) => {
    const user = await models.User.create(
      { fullName, email, phone, passwordHash, emailVerifiedAt: verified ? now : null },
      { transaction },
    );
    await models.UserRole.create({ userId: user.id, role }, { transaction });

    let profile = null;
    if (professionalInfo) {
      profile = await models.ProfessionalProfile.create(
        {
          userId: user.id,
          organizationName: developerType === 'company' ? 'E2E Homes' : null,
          businessType: developerType,
          licenseNumber: 'RERA-12345',
          experienceLevel: '3_5',
          location: 'Dubai Marina',
        },
        { transaction },
      );
    }

    const createdAt = new Date(now.getTime() - SEEDED_DOCUMENT_AGE_MS);
    const rows = Object.entries(statuses).map(([kind, status]) =>
      documentRow(profile.id, kind, status, { rejectionReason, createdAt, reviewedAt: now }),
    );
    const created = await models.VerificationDocument.bulkCreate(rows, { transaction });
    await models.VerificationCode.bulkCreate(
      Array.from({ length: deadResetCodes }, (_, i) =>
        deadResetCodeRow(user.id, now, deadResetCodes + 1 - i),
      ),
      { transaction },
    );

    return {
      id: user.id,
      email,
      password,
      roles: [role],
      professionalProfileId: profile?.id ?? null,
      documents: created.map(documentSummary),
    };
  });
}

// Records an admin review decision on the latest document of `documentKind`, or on the latest document of
// every kind when no kind is given. status 'pending' undoes a review. Returns the updated documents.
export async function setDocumentReview(
  models,
  { email, documentKind, status, rejectionReason = SEED_DEFAULTS.rejectionReason } = {},
) {
  check(typeof email === 'string', 'email is required');
  check(DOCUMENT_STATUSES.includes(status), `status must be one of ${DOCUMENT_STATUSES.join(', ')}`);
  check(
    status !== 'rejected' || (typeof rejectionReason === 'string' && rejectionReason.trim() !== ''),
    'rejectionReason must be a non-empty string',
  );

  const user = await models.User.findOne({
    where: { email },
    include: [
      {
        model: models.ProfessionalProfile,
        as: 'professionalProfile',
        include: [{ model: models.VerificationDocument, as: 'documents' }],
      },
    ],
  });
  if (!user) throw new SeedError(`No Account has the email ${email}`, 404);
  const latest = latestDocumentByKind(user.professionalProfile?.documents ?? []);
  const targets = documentKind === undefined ? Object.values(latest) : [latest[documentKind]];
  if (targets.length === 0 || targets.includes(undefined)) {
    throw new SeedError(`${email} has no ${documentKind ?? 'verification'} document to review`, 404);
  }

  const reviewedAt = toWholeSeconds(new Date());
  for (const document of targets) {
    await document.update({
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : null,
      reviewedAt: status === 'pending' ? null : reviewedAt,
    });
  }
  return targets.map(documentSummary);
}
