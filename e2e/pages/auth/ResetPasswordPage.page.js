// Reset password (frontend /reset-password, Figma 13038:4106). Opened only from the reset Verify page,
// which passes the reset token in the router state.
export class ResetPasswordPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Reset Password' });
    this.password = page.getByLabel('New Password');
    this.confirmPassword = page.getByLabel('Confirm Password');
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.alert = page.getByRole('alert');
  }

  async fill({ password, confirmPassword = password }) {
    await this.password.fill(password);
    await this.confirmPassword.fill(confirmPassword);
  }

  async reset(values) {
    await this.fill(values);
    await this.resetButton.click();
  }
}
