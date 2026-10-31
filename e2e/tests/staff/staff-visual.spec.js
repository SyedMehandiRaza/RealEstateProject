/* global document, window -- the page.evaluate callbacks run in the browser */
import { staffMessages } from '@real-estate/shared';
import { expect, test } from '../../fixtures/harness.js';
import { expectPageScreenshot } from '../../fixtures/visual.js';
import { StaffPage } from '../../pages/staff/StaffPage.page.js';

// STAFF-019: visual baselines of every staff page and modal, checked by hand against Figma first
// (docs/modules/staff/figma.md, "Verification notes"), and the responsive rule of STAFF-SPEC-001 at the
// Figma frame size (1440x832), short laptops (1366x768, 1280x720), a tablet (768x1024) and a phone (375x812).
const FRAME = { width: 1440, height: 832 };
const SIZES = [
  FRAME,
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
];
const label = ({ width, height }) => `${width}x${height}`;

// At every size: no sideways scroll, any open dialog inside the viewport, and a baseline screenshot.
async function expectAtEverySize(page, name) {
  for (const size of SIZES) {
    await page.setViewportSize(size);
    const layout = await page.evaluate(() => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')].map((d) => d.getBoundingClientRect());
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        dialogs: dialogs.map((r) => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right })),
      };
    });
    expect(layout.scrollWidth, `${name} at ${label(size)} scrolls sideways`).toBeLessThanOrEqual(
      layout.innerWidth,
    );
    for (const box of layout.dialogs) {
      expect(box.left, `${name} dialog at ${label(size)}`).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(layout.innerWidth);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(layout.innerHeight);
    }
    await expectPageScreenshot(page, `${name}-${label(size)}.png`);
  }
  await page.setViewportSize(FRAME);
}

test.describe('Staff pages: visual and responsive', () => {
  let staff;
  let memberId;

  test.beforeEach(async ({ page, harness }) => {
    await page.setViewportSize(FRAME);
    const developer = await harness.seedDeveloper({ documents: 'approved', fullName: 'Shivam Gawali' });
    const seeded = await harness.seedStaff(developer.email, {
      properties: [
        { name: 'Skyline Tower', city: 'Mumbai', state: 'Maharashtra' },
        { name: 'Harbor View', city: 'Pune', state: 'Maharashtra', propertyStatus: 'under_construction' },
      ],
      staff: [
        {
          fullName: 'Rajesh Mehta',
          email: 'rajeshmehta@gmail.com',
          phone: '+917889456123',
          status: 'disabled',
        },
        { fullName: 'Rajesh Mehta', email: 'rajesh.m@gmail.com', phone: '+917889456123' },
        {
          fullName: 'Shivam Gawali',
          email: 'shivamgawali@gmail.com',
          phone: '+917485961245',
          permissions: ['properties_management', 'leads_crm', 'payment_tracking'],
          assignedProperties: ['Skyline Tower'],
        },
      ],
    });
    memberId = seeded.staff[2].id;
    staff = new StaffPage(page);
    await staff.open(developer);
    await expect(staff.rows()).toHaveCount(3);
  });

  test('Staff Management list', async ({ page }) => {
    await expectAtEverySize(page, 'staff-list');
  });

  test('the sidebar becomes a menu below 1024 px and the table becomes cards on narrow lists', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
    await expect(staff.table.getByRole('columnheader').first()).toBeHidden();

    await page.setViewportSize({ width: 1023, height: 768 });
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.setViewportSize(FRAME);
    await expect(staff.table.getByRole('columnheader').first()).toBeVisible();
  });

  test('Add Staff and its validation state', async ({ page }) => {
    await staff.addStaffLink.click();
    await expect(staff.formDialog()).toBeVisible();
    await expectAtEverySize(page, 'staff-add');
    await staff.submitAdd();
    await expect(staff.formDialog().getByText(staffMessages.fullName.required)).toBeVisible();
    await expectPageScreenshot(page, 'staff-add-errors-1440x832.png');
  });

  test('Successfully Added', async ({ page }) => {
    await staff.addStaffLink.click();
    await staff.fillForm({
      fullName: 'Asha Rao',
      email: 'asha@example.com',
      phone: '+917000000001',
      permissions: ['marketing'],
    });
    await staff.submitAdd();
    await expect(staff.successDialog()).toBeVisible();
    await expectAtEverySize(page, 'staff-added');
  });

  test('Edit Staff', async ({ page }) => {
    await staff.visit(`/staff/${memberId}/edit`);
    await expect(staff.formDialog().getByLabel('Full Name')).toHaveValue('Shivam Gawali');
    await expectPageScreenshot(page, 'staff-edit-1440x832.png');
  });

  test('Staff Detail', async ({ page }) => {
    await staff.visit(`/staff/${memberId}`);
    await expect(staff.detail('Shivam Gawali').getByRole('article', { name: 'Skyline Tower' })).toBeVisible();
    await expectAtEverySize(page, 'staff-detail');
  });

  test('Remove confirmation', async ({ page }) => {
    await staff.visit(`/staff/${memberId}`);
    await staff.detail('Shivam Gawali').getByRole('button', { name: 'Remove Staff' }).click();
    await expect(staff.removeDialog('Shivam Gawali')).toBeVisible();
    await expectAtEverySize(page, 'staff-remove');
  });

  test('Assign Property picker', async ({ page }) => {
    await staff.visit(`/staff/${memberId}`);
    await staff.detail('Shivam Gawali').getByRole('button', { name: 'Assign Property' }).click();
    await expect(staff.pickerDialog().getByRole('radio')).toHaveCount(1);
    await expectAtEverySize(page, 'staff-assign');
  });
});
