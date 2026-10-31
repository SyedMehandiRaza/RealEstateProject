import { staffMessages } from '@real-estate/shared';
import { expect, test } from '../../fixtures/harness.js';
import { StaffPage } from '../../pages/staff/StaffPage.page.js';

// STAFF-017: a member's life against the real API — Detail from View, Edit from the list and the Detail,
// the status dropdown, Remove with confirmation, refresh and back on modal URLs (STAFF-DEC-011, 013, 014).
test.describe('Staff Detail, Edit, status and Remove', () => {
  let staff;
  let seeded;

  test.beforeEach(async ({ page, harness }) => {
    const developer = await harness.seedDeveloper({ documents: 'approved' });
    seeded = await harness.seedStaff(developer.email, {
      staff: [
        { fullName: 'Kept Member', email: 'kept@example.com' },
        {
          fullName: 'Shivam Gawali',
          email: 'shivam@example.com',
          phone: '+917485961245',
          permissions: ['properties_management', 'leads_crm'],
        },
      ],
    });
    staff = new StaffPage(page);
    await staff.open(developer);
  });

  const shivam = () => seeded.staff.find((member) => member.fullName === 'Shivam Gawali');

  test('View opens the Detail with the member and the permission ticks', async ({ page }) => {
    await staff.row('Shivam Gawali').getByRole('link', { name: 'View Shivam Gawali' }).click();
    await expect(page).toHaveURL(`/staff/${shivam().id}`);
    const detail = staff.detail('Shivam Gawali');
    await expect(detail.getByText('shivam@example.com')).toBeVisible();
    await expect(detail.getByText('+917485961245')).toBeVisible();
    const areas = detail.getByRole('list', { name: 'Assigned Permissions / Access' }).getByRole('listitem');
    await expect(areas.nth(0).getByRole('img', { name: 'Granted' })).toBeVisible();
    await expect(areas.nth(1).getByRole('img', { name: 'Granted' })).toBeVisible();
    await expect(areas.nth(3).getByRole('img', { name: 'Not granted' })).toBeVisible();
  });

  test('Edit from the list saves and returns to the list', async ({ page }) => {
    await staff.row('Shivam Gawali').getByRole('link', { name: 'Edit Shivam Gawali' }).click();
    const form = staff.formDialog();
    await expect(form.getByLabel('Full Name')).toHaveValue('Shivam Gawali');
    await form.getByLabel('Full Name').fill('Shivam K Gawali');
    await form.getByRole('combobox', { name: /Assign Access Permissions/ }).click();
    await form.getByRole('option', { name: 'Marketing' }).click();
    await page.keyboard.press('Escape');
    await form.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page).toHaveURL('/staff');
    await expect(staff.row('Shivam K Gawali')).toBeVisible();
    await page.reload();
    await expect(staff.row('Shivam K Gawali')).toBeVisible();
  });

  test('Edit from the Detail returns to the Detail with the new values', async ({ page }) => {
    await staff.visit(`/staff/${shivam().id}`);
    await staff.detail('Shivam Gawali').getByRole('link', { name: 'Edit' }).click();
    const form = staff.formDialog();
    await expect(form.getByLabel('Email')).toHaveValue('shivam@example.com');
    await form.getByLabel('Email').fill('shivam.new@example.com');
    await form.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page).toHaveURL(`/staff/${shivam().id}`);
    await expect(staff.detail('Shivam Gawali').getByText('shivam.new@example.com')).toBeVisible();
  });

  test('Edit shows the shared message for an invalid value (client parity)', async () => {
    await staff.visit(`/staff/${shivam().id}/edit`);
    const form = staff.formDialog();
    await expect(form.getByLabel('Full Name')).toHaveValue('Shivam Gawali');
    await form.getByLabel('Phone Number').fill('0501234567');
    await form.getByRole('button', { name: 'Save Changes' }).click();
    await expect(form.getByText(staffMessages.phone.invalid, { exact: true })).toBeVisible();
  });

  test('Edit shows the server message for a colleague’s email (server parity)', async () => {
    await staff.visit(`/staff/${shivam().id}/edit`);
    const form = staff.formDialog();
    await expect(form.getByLabel('Full Name')).toHaveValue('Shivam Gawali');
    await form.getByLabel('Email').fill('kept@example.com');
    await form.getByRole('button', { name: 'Save Changes' }).click();
    await expect(form.getByText(staffMessages.email.taken, { exact: true })).toBeVisible();
  });

  test('the status dropdown disables and re-activates, and it survives a reload', async ({ page }) => {
    await staff.visit(`/staff/${shivam().id}`);
    const detail = staff.detail('Shivam Gawali');
    await detail.getByRole('combobox', { name: 'Status' }).click();
    await detail.getByRole('option', { name: 'Disable' }).click();
    await expect(detail.getByTestId('status-value')).toHaveText('Disable');

    await page.reload();
    await expect(staff.detail('Shivam Gawali').getByTestId('status-value')).toHaveText('Disable');
    await staff.detail('Shivam Gawali').getByRole('button', { name: 'Close' }).click();
    await expect(staff.row('Shivam Gawali')).toContainText('Disable');

    await staff.row('Shivam Gawali').getByRole('link', { name: 'View Shivam Gawali' }).click();
    await staff.detail('Shivam Gawali').getByRole('combobox', { name: 'Status' }).click();
    await staff.detail('Shivam Gawali').getByRole('option', { name: 'Active' }).click();
    await expect(staff.detail('Shivam Gawali').getByTestId('status-value')).toHaveText('Active');
  });

  test('Remove from the list asks first; Cancel keeps the member, Remove deletes it', async ({ page }) => {
    await staff.row('Shivam Gawali').getByRole('button', { name: 'Remove Shivam Gawali' }).click();
    await staff.removeDialog('Shivam Gawali').getByRole('button', { name: 'Cancel' }).click();
    await expect(staff.row('Shivam Gawali')).toBeVisible();

    await staff.row('Shivam Gawali').getByRole('button', { name: 'Remove Shivam Gawali' }).click();
    await expect(staff.removeDialog('Shivam Gawali')).toContainText(staffMessages.ui.removeBody);
    await staff.removeDialog('Shivam Gawali').getByRole('button', { name: 'Remove' }).click();
    await expect(staff.row('Shivam Gawali')).toHaveCount(0);
    await page.reload();
    await expect(staff.row('Kept Member')).toBeVisible();
    await expect(staff.row('Shivam Gawali')).toHaveCount(0);
  });

  test('Remove Staff from the Detail returns to the list, and the old link shows "not found"', async ({
    page,
  }) => {
    const id = shivam().id;
    await staff.visit(`/staff/${id}`);
    await staff.detail('Shivam Gawali').getByRole('button', { name: 'Remove Staff' }).click();
    await staff.removeDialog('Shivam Gawali').getByRole('button', { name: 'Remove' }).click();
    await expect(page).toHaveURL('/staff');
    await expect(staff.row('Shivam Gawali')).toHaveCount(0);

    await staff.visit(`/staff/${id}`);
    await expect(page.getByRole('dialog').getByText(staffMessages.api.notFound)).toBeVisible();
  });

  test('a modal URL survives a refresh, and Back closes it', async ({ page }) => {
    await staff.row('Shivam Gawali').getByRole('link', { name: 'View Shivam Gawali' }).click();
    await page.reload();
    await expect(staff.detail('Shivam Gawali')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL('/staff');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await staff.visit(`/staff/${shivam().id}/edit`);
    await expect(staff.formDialog().getByLabel('Full Name')).toHaveValue('Shivam Gawali');
  });
});
