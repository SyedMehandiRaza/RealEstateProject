// Select a country (frontend /onboarding/country, Figma 13038:3950). Buyer only.
export class SelectCountryPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Select a Country' });
    this.countries = page.getByRole('radiogroup', { name: 'Country' });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.alert = page.getByRole('alert');
  }

  // name: the display name, e.g. 'United Arab Emirates'.
  country(name) {
    return this.countries.getByRole('radio', { name });
  }

  // The radio is visually hidden inside its row, so the row's label is what the user clicks.
  choose(name) {
    return this.countries.getByText(name, { exact: true }).click();
  }

  submit() {
    return this.continueButton.click();
  }
}
