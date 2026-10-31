import { SeedError } from './e2eSeeds.js';
import { assignProperties, createProperty, createStaffMember } from './staffFactories.js';

// Staff seed for the e2e harness (STAFF-016), behind POST /api/__e2e/seed/staff. Properties have no API
// on this branch and staff are built faster without the UI, so both are written through the models.
// Body: { employerEmail, properties: [{ name, city?, state?, propertyStatus? }],
//         staff: [{ fullName, email?, phone?, role?, status?, permissions?, assignedProperties?: [name] }] }
// Staff are dated a minute apart in the given order, so the last one is the newest in the Staff List.
// Returns { properties: [{ id, name }], staff: [{ id, fullName, email }] }.
export async function seedStaff(models, { employerEmail, properties = [], staff = [] } = {}) {
  if (typeof employerEmail !== 'string') throw new SeedError('employerEmail is required');
  const employer = await models.User.findOne({ where: { email: employerEmail.toLowerCase() } });
  if (!employer) throw new SeedError(`No account with the email ${employerEmail}`, 404);
  if (!Array.isArray(properties) || !Array.isArray(staff)) {
    throw new SeedError('properties and staff must be arrays');
  }

  const seededProperties = [];
  for (const property of properties) {
    seededProperties.push(await createProperty(employer.id, property));
  }
  const propertyIdByName = new Map(seededProperties.map((property) => [property.name, property.id]));

  const now = Math.floor(Date.now() / 1000) * 1000;
  const seededStaff = [];
  for (const [index, { assignedProperties = [], ...member }] of staff.entries()) {
    const ids = assignedProperties.map((name) => {
      if (!propertyIdByName.has(name))
        throw new SeedError(`assignedProperties: no seeded property "${name}"`);
      return propertyIdByName.get(name);
    });
    const createdAt = new Date(now - (staff.length - index) * 60_000);
    const created = await createStaffMember(employer.id, { ...member, createdAt });
    if (ids.length) await assignProperties(created.id, ids);
    seededStaff.push(created);
  }

  return {
    properties: seededProperties.map(({ id, name }) => ({ id, name })),
    staff: seededStaff.map(({ id, fullName, email }) => ({ id, fullName, email })),
  };
}
