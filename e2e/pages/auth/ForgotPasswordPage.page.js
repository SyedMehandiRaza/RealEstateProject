// Forgot Password (frontend /forgot-password, Figma 13038:4082). A refused reset token comes back here
// with the shared message in the form alert.
export class ForgotPasswordPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Forgot Password?' });
    this.email = page.getByLabel('Email');
    this.sendCodeButton = page.getByRole('button', { name: 'Send Code' });
    this.alert = page.getByRole('alert');
  }

  goto() {
    return this.page.goto('/forgot-password');
  }

  async requestCode(email) {
    await this.email.fill(email);
    await this.sendCodeButton.click();
  }
}
