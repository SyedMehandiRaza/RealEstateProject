import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Upload Document and its Uploaded state (frontend /developer/documents, Figma 13038:4578 / 13038:4887).
// One slot per document kind still to send: a labelled group holding a dropzone (file input labelled
// "<Label> file") until a file is picked, then a card with "Remove <file name>".
const FILES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures/files');
export const fixtureFile = (name) => path.join(FILES_DIR, name);

const LABELS = {
  government_id: 'Government ID',
  company_registration_certificate: 'Company Registration Certificate',
  profile_photo: 'Profile Photo',
};
const ID_TYPES = { driving_license: 'Driving License', passport: 'Passport', pan_card: 'PAN Card' };

export class UploadDocumentsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Upload Documents' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.alert = page.getByRole('alert');
    this.slots = page.getByRole('group', {
      name: /^(Government ID|Company Registration Certificate|Profile Photo)$/,
    });
  }

  // kind: a DOCUMENT_KINDS value.
  slot(kind) {
    return this.page.getByRole('group', { name: LABELS[kind], exact: true });
  }

  fileInput(kind) {
    return this.page.getByLabel(`${LABELS[kind]} file`, { exact: true });
  }

  idTypeSelect() {
    return this.page.getByRole('combobox', { name: /^Government ID/ });
  }

  async chooseIdType(idDocumentType) {
    await this.idTypeSelect().click();
    await this.page.getByRole('option', { name: ID_TYPES[idDocumentType], exact: true }).click();
  }

  // file: a fixture name in fixtures/files, or a Playwright file payload { name, mimeType, buffer }.
  pick(kind, file) {
    return this.fileInput(kind).setInputFiles(typeof file === 'string' ? fixtureFile(file) : file);
  }

  submit() {
    return this.nextButton.click();
  }
}
