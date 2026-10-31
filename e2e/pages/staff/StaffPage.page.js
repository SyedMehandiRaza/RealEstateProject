import { staffMessages } from '@real-estate/shared';
import { LoginPage } from '../auth/LoginPage.page.js';

// Staff Management (/staff, Figma 13009:17816) with its modals: Add / Edit Staff (13009:18190), Successfully
// Added (13009:18180), Staff Detail (13009:18226), the Remove confirmation and the Assign Property picker.
export class StaffPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Staff Management' });
    this.addStaffLink = page.getByRole('link', { name: 'Add Staff' });
    this.table = page.getByRole('table', { name: 'Staff List' });
    this.alert = page.getByRole('alert');
  }

  // Logs in through the Log in page, waits for the landing page, then opens Staff Management.
  async open(credentials, path = '/staff') {
    const login = new LoginPage(this.page);
    await login.goto();
    await login.logIn(credentials);
    await this.page.waitForURL((url) => url.pathname !== '/login');
    await this.page.goto(path);
  }

  rows() {
    return this.table.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  row(fullName) {
    return this.rows().filter({ hasText: fullName });
  }

  // ---------------------------------------------------------------- form
  dialog(name) {
    return this.page.getByRole('dialog', { name });
  }

  formDialog() {
    return this.page.getByRole('dialog', { name: /^(Add|Edit) Staff$/ });
  }

  async fillForm({ fullName, email, phone, permissions = [] }) {
    const form = this.formDialog();
    await form.getByLabel('Full Name').fill(fullName);
    await form.getByLabel('Email').fill(email);
    await form.getByLabel('Phone Number').fill(phone);
    await form.getByRole('combobox', { name: /Role/ }).click();
    await form.getByRole('option', { name: 'Agent' }).click();
    if (permissions.length) {
      await form.getByRole('combobox', { name: /Assign Access Permissions/ }).click();
      for (const permission of permissions) {
        await form.getByRole('option', { name: staffMessages.labels.permissions[permission] }).click();
      }
      await this.page.keyboard.press('Escape');
    }
  }

  submitAdd() {
    return this.formDialog().getByRole('button', { name: 'Add Staff' }).click();
  }

  successDialog() {
    return this.dialog(staffMessages.ui.addedTitle);
  }

  // -------------------------------------------------------------- detail
  detail(fullName) {
    return this.dialog(fullName);
  }

  removeDialog(fullName) {
    return this.dialog(staffMessages.ui.removeTitle(fullName));
  }

  pickerDialog() {
    return this.dialog('Assign Property');
  }
}
