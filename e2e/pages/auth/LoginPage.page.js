// Log in (frontend /login, Figma 13038:3861). Arriving from Reset password shows `passwordChanged`.
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Welcome Back!' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password', { exact: true });
    this.submitButton = page.getByRole('button', { name: 'Log In' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    // Form-level API errors (role="alert") and the "Password changed" notice (role="status").
    this.alert = page.getByRole('alert');
    this.notice = page.getByRole('status');
  }

  goto() {
    return this.page.goto('/login');
  }

  async fill({ email, password }) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  submit() {
    return this.submitButton.click();
  }

  async logIn(credentials) {
    await this.fill(credentials);
    await this.submit();
  }
}
