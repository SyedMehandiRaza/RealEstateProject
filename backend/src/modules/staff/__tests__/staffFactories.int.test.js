import { UniqueConstraintError } from 'sequelize';
import models, { sequelize } from '../../../models/index.js';
import { verifyAccessToken } from '../../../utils/jwt.js';
import {
  activeDeveloper,
  assignProperties,
  buyerAccount,
  createProperty,
  createStaffMember,
  developerUnderReview,
} from '../../../test/staffFactories.js';

// STAFF-001: the staff test factories, and the staff tables' associations and DB rules they rely on.

describe('staff test factories', () => {
  it('creates an Active developer with a signed access token', async () => {
    const developer = await activeDeveloper();
    expect(verifyAccessToken(developer.accessToken)).toMatchObject({ sub: String(developer.id) });
    const roles = await models.UserRole.findAll({ where: { userId: developer.id } });
    expect(roles.map((r) => r.role)).toEqual(['developer']);
    const documents = await models.VerificationDocument.findAll({
      where: { professionalProfileId: developer.professionalProfileId },
    });
    expect(documents.length).toBeGreaterThan(0);
    expect(documents.every((d) => d.status === 'approved')).toBe(true);
  });

  it('creates a Developer under review and a Buyer, each with a token', async () => {
    const pending = await developerUnderReview();
    const documents = await models.VerificationDocument.findAll({
      where: { professionalProfileId: pending.professionalProfileId },
    });
    expect(documents.every((d) => d.status === 'pending')).toBe(true);
    const buyer = await buyerAccount();
    expect(verifyAccessToken(buyer.accessToken).roles).toEqual(['buyer']);
  });

  it('creates a staff member with permissions and assigned properties', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, {
      fullName: 'Rajesh Mehta',
      permissions: ['marketing', 'leads_crm'],
    });
    const property = await createProperty(developer.id, { name: 'Skyline Tower' }, { withImage: true });
    await assignProperties(member.id, [property.id]);

    const loaded = await models.StaffMember.findByPk(member.id, {
      include: [
        { model: models.StaffMemberPermission, as: 'permissions' },
        { model: models.Property, as: 'assignedProperties' },
      ],
    });
    expect(loaded).toMatchObject({ employerId: developer.id, fullName: 'Rajesh Mehta', status: 'active' });
    expect(loaded.permissions.map((p) => p.permission).sort()).toEqual(['leads_crm', 'marketing']);
    expect(loaded.assignedProperties.map((p) => p.name)).toEqual(['Skyline Tower']);
    expect(await models.PropertyMedia.count({ where: { propertyId: property.id } })).toBe(1);
  });
});

describe('staff tables', () => {
  it('deletes the permissions and assignments with the staff member, keeping the property', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, { permissions: ['marketing'] });
    const property = await createProperty(developer.id);
    await assignProperties(member.id, [property.id]);

    await models.StaffMember.destroy({ where: { id: member.id } });

    expect(await models.StaffMemberPermission.count({ where: { staffMemberId: member.id } })).toBe(0);
    expect(await models.StaffPropertyAssignment.count({ where: { staffMemberId: member.id } })).toBe(0);
    expect(await models.Property.count({ where: { id: property.id } })).toBe(1);
  });

  it('deletes the assignments of a deleted property, keeping the staff member', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const property = await createProperty(developer.id);
    await assignProperties(member.id, [property.id]);

    await models.Property.destroy({ where: { id: property.id } });

    expect(await models.StaffPropertyAssignment.count({ where: { propertyId: property.id } })).toBe(0);
    expect(await models.StaffMember.count({ where: { id: member.id } })).toBe(1);
  });

  it('refuses a second staff member with the same email for one employer, but not for another', async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    await createStaffMember(developer.id, { email: 'same@example.com' });
    await expect(createStaffMember(developer.id, { email: 'same@example.com' })).rejects.toBeInstanceOf(
      UniqueConstraintError,
    );
    await expect(createStaffMember(other.id, { email: 'same@example.com' })).resolves.toBeDefined();
  });

  it.each([
    ['an uppercase email', { email: 'Upper@Example.com' }, /chk_staff_members_email_lowercase/],
    ['a phone that is not E.164', { phone: '0501234567' }, /chk_staff_members_phone_e164/],
    ['a blank full name', { fullName: '   ' }, /chk_staff_members_full_name/],
  ])('refuses %s through its CHECK constraint', async (_, overrides, constraint) => {
    const developer = await activeDeveloper();
    await expect(createStaffMember(developer.id, overrides)).rejects.toThrow(constraint);
  });

  it('refuses to delete an employer account that still employs staff (RESTRICT)', async () => {
    const developer = await activeDeveloper();
    await createStaffMember(developer.id);
    await expect(
      sequelize.query('DELETE FROM users WHERE id = ?', { replacements: [developer.id] }),
    ).rejects.toThrow(/foreign key constraint/i);
  });
});
