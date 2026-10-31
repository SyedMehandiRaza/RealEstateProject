import { staffMessages } from '@real-estate/shared';
import { expect, test } from '../../fixtures/harness.js';
import { StaffPage } from '../../pages/staff/StaffPage.page.js';

// STAFF-018: assigning and unassigning properties against the real API (STAFF-DEC-005, 009, 015).
test.describe('Assign and unassign properties', () => {
  let staff;
  let developer;

  test.beforeEach(async ({ page, harness }) => {
    developer = await harness.seedDeveloper({ documents: 'approved' });
    staff = new StaffPage(page);
  });

  async function openDetail(harness, { properties, member = {} }) {
    const seeded = await harness.seedStaff(developer.email, {
      properties,
      staff: [{ fullName: 'Shivam Gawali', email: 'shivam@example.com', ...member }],
    });
    await staff.open(developer, `/staff/${seeded.staff[0].id}`);
    return staff.detail('Shivam Gawali');
  }

  test('assigns a property, shows its card first, unassigns it and offers it again', async ({
    page,
    harness,
  }) => {
    const detail = await openDetail(harness, {
      properties: [
        { name: 'Skyline Tower', city: 'Mumbai', state: 'Maharashtra' },
        { name: 'Harbor View', city: 'Pune', state: 'Maharashtra', propertyStatus: 'under_construction' },
      ],
    });
    await expect(detail.getByText(staffMessages.ui.noPropertiesAssigned)).toBeVisible();

    await detail.getByRole('button', { name: 'Assign Property' }).click();
    const picker = staff.pickerDialog();
    await picker.getByRole('radio', { name: /Harbor View/ }).check();
    await picker.getByRole('button', { name: 'Assign' }).click();
    await expect(picker).toHaveCount(0);

    const card = detail.getByRole('article', { name: 'Harbor View' });
    await expect(card).toContainText('Pune, Maharashtra');
    await expect(card).toContainText('Under construction');
    await expect(card.getByRole('link', { name: 'View Property' })).toHaveAttribute(
      'href',
      /\/properties\/\d+$/,
    );

    await page.reload();
    await expect(staff.detail('Shivam Gawali').getByRole('article', { name: 'Harbor View' })).toBeVisible();

    await staff.detail('Shivam Gawali').getByRole('button', { name: 'Unassign Harbor View' }).click();
    await expect(staff.detail('Shivam Gawali').getByRole('article', { name: 'Harbor View' })).toHaveCount(0);

    await staff.detail('Shivam Gawali').getByRole('button', { name: 'Assign Property' }).click();
    await expect(staff.pickerDialog().getByRole('radio', { name: /Harbor View/ })).toBeVisible();
    await expect(staff.pickerDialog().getByRole('radio')).toHaveCount(2);
  });

  test("never offers another developer's property", async ({ harness }) => {
    const other = await harness.seedDeveloper({ documents: 'approved' });
    await harness.seedStaff(other.email, { properties: [{ name: 'Foreign Tower' }] });
    const detail = await openDetail(harness, { properties: [{ name: 'Own Tower' }] });

    await detail.getByRole('button', { name: 'Assign Property' }).click();
    await expect(staff.pickerDialog().getByRole('radio', { name: /Own Tower/ })).toBeVisible();
    await expect(staff.pickerDialog().getByText('Foreign Tower')).toHaveCount(0);
  });

  test('says when the developer has no properties', async ({ harness }) => {
    const detail = await openDetail(harness, { properties: [] });
    await detail.getByRole('button', { name: 'Assign Property' }).click();
    await expect(staff.pickerDialog().getByText(staffMessages.ui.noProperties)).toBeVisible();
  });

  test('says when every property is already assigned to the member', async ({ harness }) => {
    const detail = await openDetail(harness, {
      properties: [{ name: 'Only Tower' }],
      member: { assignedProperties: ['Only Tower'] },
    });
    await detail.getByRole('button', { name: 'Assign Property' }).click();
    await expect(staff.pickerDialog().getByText(staffMessages.ui.allPropertiesAssigned)).toBeVisible();
  });

  test('assigns a property to a disabled member', async ({ harness }) => {
    const detail = await openDetail(harness, {
      properties: [{ name: 'Skyline Tower' }],
      member: { status: 'disabled' },
    });
    await expect(detail.getByTestId('status-value')).toHaveText('Disable');
    await detail.getByRole('button', { name: 'Assign Property' }).click();
    await staff
      .pickerDialog()
      .getByRole('radio', { name: /Skyline Tower/ })
      .check();
    await staff.pickerDialog().getByRole('button', { name: 'Assign' }).click();
    await expect(detail.getByRole('article', { name: 'Skyline Tower' })).toBeVisible();
  });
});
