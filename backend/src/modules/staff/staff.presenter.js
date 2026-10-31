import { STAFF_PERMISSIONS } from '@real-estate/shared';

// Response shapes of STAFF-SPEC-001 §Shapes. `employerId` and `userId` are never returned.

export const toStaffMemberSummary = (member) => ({
  id: member.id,
  fullName: member.fullName,
  email: member.email,
  phone: member.phone,
  role: member.role,
  status: member.status,
  createdAt: member.createdAt,
});

export const toPropertyCard = (property, assignedAt) => ({
  id: property.id,
  name: property.name,
  city: property.city,
  state: property.state,
  propertyStatus: property.propertyStatus,
  ...(assignedAt && { assignedAt }),
});

// A member loaded with the repository's detail includes. Permissions follow the STAFF_PERMISSIONS order.
export function toStaffMember(member) {
  const granted = new Set(member.permissions.map((p) => p.permission));
  return {
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    role: member.role,
    status: member.status,
    permissions: STAFF_PERMISSIONS.filter((permission) => granted.has(permission)),
    assignedProperties: member.propertyAssignments.map((a) => toPropertyCard(a.property, a.createdAt)),
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}
