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
