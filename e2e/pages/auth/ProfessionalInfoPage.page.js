// Professional info (frontend /developer/professional-info, Figma 13038:4466). Developer only.
// The two dropdowns are select-only comboboxes (components/ui/Select.jsx).
const DEVELOPER_TYPES = { individual: 'Individual', company: 'Company' };
const EXPERIENCE_LEVELS = { '0_2': '0–2', '3_5': '3–5', '6_10': '6–10', '10_plus': '10+' };

export class ProfessionalInfoPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Professional Information' });
    this.companyName = page.getByLabel('Company Name');
    this.developerType = page.getByRole('combobox', { name: /^Type of Developer:/ });
    this.licenseNumber = page.getByLabel('License / Registration Number');
    this.experienceLevel = page.getByRole('combobox', { name: /^Experience Level/ });
    this.location = page.getByLabel('Location');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.alert = page.getByRole('alert');
  }

  async choose(combobox, label) {
    await combobox.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  // values: professionalInfoCases.valid shape (shared enum values for the dropdowns). A dropdown value
  // of undefined leaves it as it is.
  async fill({ companyName = '', developerType, licenseNumber, experienceLevel, location }) {
    await this.companyName.fill(companyName);
    if (developerType) await this.choose(this.developerType, DEVELOPER_TYPES[developerType]);
    await this.licenseNumber.fill(licenseNumber);
    if (experienceLevel) await this.choose(this.experienceLevel, EXPERIENCE_LEVELS[experienceLevel]);
    await this.location.fill(location);
  }

  submit() {
    return this.nextButton.click();
  }
}
