// Sign up (frontend /sign-up, Figma Buyer 13038:4146 / Developer 13038:4318).
export class SignUpPage {
  constructor(page) {
    this.page = page;
    this.fullName = page.getByLabel('Full Name');
    this.email = page.getByLabel('Email');
    this.phone = page.getByLabel('Phone number');
    this.password = page.getByLabel('Password', { exact: true });
    this.confirmPassword = page.getByLabel('Confirm Password');
    this.submitButton = page.getByRole('button', { name: 'Sign Up' });
  }

  // role: 'buyer' (default) or 'developer' (the Developers tab).
  goto(role = 'buyer') {
    return this.page.goto(role === 'developer' ? '/sign-up?role=developer' : '/sign-up');
  }

  async fill({ fullName, email, phone, password, confirmPassword = password }) {
    await this.fullName.fill(fullName);
    await this.email.fill(email);
    await this.phone.fill(phone);
    await this.password.fill(password);
    await this.confirmPassword.fill(confirmPassword);
  }

  submit() {
    return this.submitButton.click();
  }
}
