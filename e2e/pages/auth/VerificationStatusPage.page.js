// Developer status screens (frontend /developer/status): Pending 13038:4703, Approved 13038:4765,
// Reject 13038:4825. The heading names the headline; each required document is a list item with its
// file name, its badge (Pending / Approved / Reject) and, when rejected, the reason.
export const STATUS_HEADINGS = {
  under_review: 'Your Account is Under Review',
  active: 'Your Account is Active!',
  unsuccessful: 'Verification Unsuccessful',
};

export class VerificationStatusPage {
  constructor(page) {
    this.page = page;
    this.documents = page.getByRole('list', { name: 'Uploaded Document' }).getByRole('listitem');
    this.backToLoginButton = page.getByRole('button', { name: 'Back to login' });
    this.viewPlanButton = page.getByRole('button', { name: 'View plan' });
    this.resubmitButton = page.getByRole('button', { name: 'Resubmit Documents' });
  }

  // outcome: 'under_review' | 'active' | 'unsuccessful'.
  heading(outcome) {
    return this.page.getByRole('heading', { level: 1, name: STATUS_HEADINGS[outcome] });
  }

  document(fileName) {
    return this.documents.filter({ hasText: fileName });
  }
}
