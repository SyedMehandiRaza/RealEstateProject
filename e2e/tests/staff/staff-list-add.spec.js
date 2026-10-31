import { ERROR_CODES, staffMessages } from '@real-estate/shared';
import { staffMemberCases } from '@real-estate/shared/testing';
import { expect, test, uniqueEmail } from '../../fixtures/harness.js';
import { forbidRequests, formCases } from '../../fixtures/parity.js';
import { StaffPage } from '../../pages/staff/StaffPage.page.js';

// STAFF-016: Staff Management against the real API — the list, Add Staff with the success modal, client
// and server validation parity, and access for a Developer who is not Active (STAFF-SPEC-001).
const valid = staffMemberCases.valid;

test.describe('Staff List and Add Staff', () => {
  let developer;
  let staff;

  test.beforeEach(async ({ page, harness }) => {
    developer = await harness.seedDeveloper({ documents: 'approved' });
    await harness.seedStaff(developer.email, {
      staff: [{ fullName: 'Seeded Member', email: 'seeded@example.com', status: 'disabled' }],
    });
    staff = new StaffPage(page);
    await staff.open(developer);
  });

  test('lists the staff and adds a member, who then comes first', async ({ page }) => {
    await expect(staff.heading).toBeVisible();
    await expect(staff.row('Seeded Member')).toContainText('Disable');

    await staff.addStaffLink.click();
    await expect(page).toHaveURL('/staff/new');
    await staff.fillForm({ ...valid, email: 'rajesh@example.com', permissions: ['leads_crm', 'marketing'] });
    await staff.submitAdd();

    const success = staff.successDialog();
    await expect(success).toContainText(staffMessages.ui.addedBody);
    await success.getByRole('button', { name: 'Done.' }).click();

    await expect(page).toHaveURL('/staff');
    await expect(staff.rows().first()).toContainText('Rajesh Mehta');
    await expect(staff.rows().first()).toContainText('rajesh@example.com');
    await expect(staff.rows().first()).toContainText('+917485961245');
    await expect(staff.rows().first()).toContainText('Active');
    await expect(staff.rows()).toHaveCount(2);
  });

  test('shows every required message for an empty form, without calling the API (client parity)', async ({
    page,
  }) => {
    await staff.addStaffLink.click();
    const noRequest = forbidRequests(page, '/api/staff');
    await staff.submitAdd();
    const form = staff.formDialog();
    for (const message of [
      staffMessages.fullName.required,
      staffMessages.email.required,
      staffMessages.phone.required,
      staffMessages.role.invalid,
      staffMessages.permissions.required,
    ]) {
      await expect(form.getByText(message, { exact: true })).toBeVisible();
    }
    noRequest();
  });

  for (const { name, input, field, message } of formCases(staffMemberCases, ['fullName', 'email', 'phone'])) {
    if (Object.values(input).every((value) => value.trim() === '')) continue;
    test(`shows the shared message for ${name} (client parity)`, async () => {
      await staff.addStaffLink.click();
      const label = { fullName: 'Full Name', email: 'Email', phone: 'Phone Number' }[field];
      await staff.formDialog().getByLabel(label).fill(input[field]);
      await staff.submitAdd();
      await expect(staff.formDialog().getByText(message, { exact: true })).toBeVisible();
    });
  }

  test('shows the server message for an email the developer already uses (server parity)', async () => {
    await staff.addStaffLink.click();
    await staff.fillForm({ ...valid, email: 'SEEDED@example.com', permissions: ['marketing'] });
    await staff.submitAdd();
    await expect(staff.formDialog().getByText(staffMessages.email.taken, { exact: true })).toBeVisible();
  });

  test("shows the server message for the developer's own email (server parity)", async () => {
    await staff.addStaffLink.click();
    await staff.fillForm({ ...valid, email: developer.email, permissions: ['marketing'] });
    await staff.submitAdd();
    await expect(staff.formDialog().getByText(staffMessages.email.self, { exact: true })).toBeVisible();
  });
});

test('a Developer under review sees "Your account is under review" on Staff Management', async ({
  page,
  harness,
}) => {
  const developer = await harness.seedDeveloper({ documents: 'pending', email: uniqueEmail('review') });
  const staff = new StaffPage(page);
  await staff.open(developer);
  await expect(staff.alert).toContainText(ERROR_CODES.DEVELOPER_NOT_ACTIVE.message);
});
