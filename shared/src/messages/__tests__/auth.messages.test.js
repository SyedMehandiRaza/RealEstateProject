import { DOCUMENT_KINDS } from '../../enums/auth.enums.js';
import { authMessages as m } from '../auth.messages.js';

// Messages the API returns for POST /me/documents beyond the schema rules (Q-036, wording assumed).
describe('document submission messages', () => {
  it('has an "Upload your <document name>" message for every document kind', () => {
    expect(Object.keys(m.documents.required).sort()).toEqual([...DOCUMENT_KINDS].sort());
    expect(m.documents.required).toEqual({
      government_id: 'Upload your Government ID',
      company_registration_certificate: 'Upload your Company Registration Certificate',
      profile_photo: 'Upload your Profile Photo',
    });
  });

  it('has the 409 message for a kind already pending or approved', () => {
    expect(m.api.documentAlreadySubmitted).toBe('This document is already under review or approved');
  });
});

// The 429 forgot/resend password answer while the reset guessing cap is in force (Q-044, DEC-041).
describe('reset guessing cap message', () => {
  it('tells the user to wait, without naming the exact time left', () => {
    expect(m.api.resetCodesPaused).toBe(
      'Too many wrong codes. For your security, new codes are paused for up to 24 hours',
    );
  });

  it('differs from the resend messages, so the user knows this is not the 60 s cooldown', () => {
    expect(m.api.resetCodesPaused).not.toBe(m.api.resendLimit);
    expect(m.api.resetCodesPaused).not.toBe(m.api.codeTooManyAttempts);
  });
});
