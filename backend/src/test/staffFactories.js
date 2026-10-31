import models, { sequelize } from '../models/index.js';
import { signAccessToken } from '../utils/jwt.js';
import { seedAccount } from './e2eSeeds.js';

// Test data for the staff module (STAFF-001), written straight through the models into the test database
// (the integration setup refuses any database whose name does not end in "_test"). Rows satisfy every CHECK
// of the staff and property tables.

let counter = 0;
const next = () => (counter += 1);

async function withToken(account) {
  return { ...account, accessToken: signAccessToken({ userId: account.id, roles: account.roles }) };
}

// A Developer whose required documents are all approved: passes requireActiveDeveloper (DEC-035).
export function activeDeveloper(options = {}) {
  return seedAccount(models, sequelize, { role: 'developer', documents: 'approved', ...options }).then(
    withToken,
  );
}

// A Developer with Professional info whose documents wait for review: 403 DEVELOPER_NOT_ACTIVE.
export function developerUnderReview(options = {}) {
  return seedAccount(models, sequelize, { role: 'developer', documents: 'pending', ...options }).then(
    withToken,
  );
}

// A Buyer only: 403 FORBIDDEN on developer routes.
export function buyerAccount(options = {}) {
  return seedAccount(models, sequelize, { role: 'buyer', ...options }).then(withToken);
}

// A staff member of `employerId` with its permission rows. `createdAt` sets the list order.
export async function createStaffMember(employerId, overrides = {}) {
  const n = next();
  const {
    permissions = ['properties_management'],
    createdAt,
    fullName = `Staff Member ${n}`,
    email = `staff-${n}@example.com`,
    phone = '+917485961245',
    role = 'agent',
    status = 'active',
  } = overrides;
  return sequelize.transaction(async (transaction) => {
    const member = await models.StaffMember.create(
      {
        employerId,
        fullName,
        email,
        phone,
        role,
        status,
        ...(createdAt && { createdAt, updatedAt: createdAt }),
      },
      { transaction, silent: Boolean(createdAt) },
    );
    await models.StaffMemberPermission.bulkCreate(
      permissions.map((permission) => ({ staffMemberId: member.id, permission })),
      { transaction },
    );
    return member;
  });
}

// A minimal valid property owned by `ownerId`; `withImage` adds one gallery image (the future cover).
export async function createProperty(ownerId, overrides = {}, { withImage = false } = {}) {
  const n = next();
  const property = await models.Property.create({
    ownerId,
    name: `Property ${n}`,
    propertyType: 'apartment',
    listingPurpose: 'sale',
    listingCategory: 'project',
    propertyStatus: 'ready_to_move',
    countryCode: 'IN',
    state: 'Maharashtra',
    city: 'Mumbai',
    locality: 'Andheri West',
    postalCode: '400053',
    address: '12 Link Road',
    latitude: '19.136300',
    longitude: '72.827700',
    totalArea: '12000.00',
    totalAreaUnit: 'sq_ft',
    totalUnits: 120,
    towerCount: 2,
    floorCount: 20,
    startingPrice: '9500000.00',
    yearBuilt: 2024,
    builderName: 'Skyline Builders',
    description: 'A test property.',
    ...overrides,
  });
  if (withImage) {
    await models.PropertyMedia.create({
      propertyId: property.id,
      mediaType: 'image',
      cloudinaryPublicId: `realestate/test/properties/${property.id}/cover-${n}`,
      cloudinaryResourceType: 'image',
      originalFilename: 'cover.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      sortOrder: 0,
    });
  }
  return property;
}

// Assigns properties to a staff member; `createdAt` (one date for all) sets the card order.
export function assignProperties(staffMemberId, propertyIds, { createdAt } = {}) {
  return models.StaffPropertyAssignment.bulkCreate(
    propertyIds.map((propertyId) => ({
      staffMemberId,
      propertyId,
      ...(createdAt && { createdAt, updatedAt: createdAt }),
    })),
    { silent: Boolean(createdAt) },
  );
}
