// Verify (frontend /verify-email, Figma buyer 13038:3920 / developer 13038:4022): six one-digit boxes.
// The password reset Verify (/forgot-password/verify, 13038:4052) is the same screen, so it uses this too.
export class VerifyEmailPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Verify Your Account' });
    this.code = page.getByRole('group', { name: 'Verification code' });
    this.verifyButton = page.getByRole('button', { name: 'Verify', exact: true });
  }

  // Types the code into the boxes (each digit moves focus to the next box).
  async enterCode(code) {
    await this.code.getByLabel('Digit 1 of 6').click();
    await this.page.keyboard.type(code);
  }

  async verify(code) {
    await this.enterCode(code);
    await this.verifyButton.click();
  }
}
