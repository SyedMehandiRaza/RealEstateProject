import {
  documentUploadSchema,
  forgotPasswordSchema,
  loginSchema,
  professionalInfoSchema,
  resendCodeSchema,
  resetPasswordSchema,
  selectCountrySchema,
  signUpSchema,
  verifyCodeSchema,
} from '../auth.schema.js';
import { authMessages as m } from '../../messages/auth.messages.js';
import { commonMessages } from '../../messages/common.messages.js';
import { toFieldErrors } from '../../errors/toFieldErrors.js';
import { LIMITS } from '../../limits.js';
import { resendCodeCases, signUpCases, verifyCodeCases } from '../../testing/index.js';

const L = LIMITS.auth;
const errorsOf = (schema, input) => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error(`expected a validation error for ${JSON.stringify(input)}`);
  return toFieldErrors(result.error);
};
const longText = (length) => 'a'.repeat(length);
const emailOfLength = (length) => `${'a'.repeat(length - '@example.com'.length)}@example.com`;

const validSignUp = signUpCases.valid;

describe('signUpSchema', () => {
  it('accepts a buyer and a developer, normalizing email and phone', () => {
    expect(signUpSchema.parse({ ...validSignUp, email: '  Sara@Example.COM ' })).toEqual({
      ...validSignUp,
      email: 'sara@example.com',
      phone: '+971501234567',
    });
    expect(signUpSchema.parse({ ...validSignUp, role: 'developer' }).role).toBe('developer');
  });

  it.each(signUpCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(signUpSchema, { ...validSignUp, ...input })[field]).toContain(message);
  });

  it('shows only the "required" message for an empty field', () => {
    expect(errorsOf(signUpSchema, { ...validSignUp, password: '', confirmPassword: '' }).password).toEqual([
      m.password.required,
    ]);
  });

  it('accepts the boundary lengths', () => {
    const input = {
      ...validSignUp,
      fullName: longText(L.fullName.max),
      email: emailOfLength(L.email.max),
      phone: `+${'1'.repeat(15)}`,
      password: `${'a'.repeat(L.password.max - 1)}1`,
    };
    input.confirmPassword = input.password;
    expect(signUpSchema.safeParse(input).success).toBe(true);
    expect(
      signUpSchema.safeParse({ ...validSignUp, password: 'abcdef12', confirmPassword: 'abcdef12' }).success,
    ).toBe(true);
  });
});

describe('verifyCodeSchema', () => {
  const valid = verifyCodeCases.valid;

  it('accepts a 6-digit code, keeping leading zeros', () => {
    expect(verifyCodeSchema.parse({ ...valid, code: ' 012345 ' })).toEqual(valid);
  });

  it.each(verifyCodeCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(verifyCodeSchema, { ...valid, ...input })[field]).toEqual([message]);
  });
});

describe('resendCodeSchema', () => {
  it('accepts an email', () => {
    expect(resendCodeSchema.parse({ email: 'Sara@Example.com' })).toEqual({ email: 'sara@example.com' });
  });

  it.each(resendCodeCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(resendCodeSchema, { ...resendCodeCases.valid, ...input })[field]).toEqual([message]);
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password, without applying the password policy', () => {
    expect(loginSchema.parse({ email: 'SARA@example.com', password: 'x' })).toEqual({
      email: 'sara@example.com',
      password: 'x',
    });
  });

  it.each([
    ['email', undefined, m.email.required],
    ['email', '+971501234567', m.email.invalid],
    ['password', undefined, m.password.required],
    ['password', '', m.password.required],
    ['password', longText(L.password.max + 1), m.password.max],
  ])('rejects %s=%j', (field, value, message) => {
    expect(
      errorsOf(loginSchema, { email: 'sara@example.com', password: 'x', [field]: value })[field],
    ).toEqual([message]);
  });

  it('rejects login by phone (email only, DEC-022)', () => {
    expect(errorsOf(loginSchema, { phone: '+971501234567', password: 'x' })._form).toEqual([
      commonMessages.unknownField,
    ]);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts an email', () => {
    expect(forgotPasswordSchema.parse({ email: ' sara@example.com ' })).toEqual({
      email: 'sara@example.com',
    });
  });

  it.each([
    [undefined, m.email.required],
    ['', m.email.required],
    ['sara@', m.email.invalid],
  ])('rejects email %j', (email, message) => {
    expect(errorsOf(forgotPasswordSchema, { email }).email).toEqual([message]);
  });
});

describe('resetPasswordSchema', () => {
  const valid = { resetToken: 'signed.reset.token', password: 'newpass12', confirmPassword: 'newpass12' };

  it('accepts a token and a matching new password', () => {
    expect(resetPasswordSchema.parse(valid)).toEqual(valid);
  });

  it.each([undefined, '', '  '])('rejects resetToken %j', (resetToken) => {
    expect(errorsOf(resetPasswordSchema, { ...valid, resetToken }).resetToken).toEqual([
      m.resetToken.required,
    ]);
  });

  it('applies the new-password policy and the match rule', () => {
    expect(
      errorsOf(resetPasswordSchema, { ...valid, password: 'short1', confirmPassword: 'short1' }).password,
    ).toEqual([m.password.min]);
    expect(errorsOf(resetPasswordSchema, { ...valid, confirmPassword: 'newpass13' }).confirmPassword).toEqual(
      [m.confirmPassword.mismatch],
    );
    expect(errorsOf(resetPasswordSchema, { ...valid, confirmPassword: undefined }).confirmPassword).toEqual([
      m.confirmPassword.required,
    ]);
  });
});

describe('selectCountrySchema', () => {
  it.each(['AE', 'SG', 'US', 'GB'])('accepts %s', (countryCode) => {
    expect(selectCountrySchema.parse({ countryCode })).toEqual({ countryCode });
  });

  it.each(['IN', 'ae', undefined])('rejects %j', (countryCode) => {
    expect(errorsOf(selectCountrySchema, { countryCode }).countryCode).toEqual([m.countryCode.invalid]);
  });
});

describe('professionalInfoSchema', () => {
  const valid = {
    companyName: 'Skyline Homes',
    developerType: 'company',
    licenseNumber: 'RERA-12345',
    experienceLevel: '6_10',
    location: 'Dubai Marina',
  };

  it('accepts a company and an individual without a company name', () => {
    expect(professionalInfoSchema.parse(valid)).toEqual(valid);
    const individual = { ...valid, developerType: 'individual', companyName: undefined };
    expect(professionalInfoSchema.parse(individual)).toEqual(individual);
  });

  it('treats an empty company name as not given', () => {
    expect(
      professionalInfoSchema.parse({ ...valid, developerType: 'individual', companyName: '  ' }).companyName,
    ).toBe(undefined);
  });

  it.each([undefined, '', '   '])('requires the company name for a company (%j)', (companyName) => {
    expect(errorsOf(professionalInfoSchema, { ...valid, companyName }).companyName).toEqual([
      m.companyName.required,
    ]);
  });

  it.each([
    ['companyName', 42, m.companyName.invalid],
    ['companyName', longText(L.companyName.max + 1), m.companyName.max],
    ['developerType', 'agency', m.developerType.invalid],
    ['developerType', undefined, m.developerType.invalid],
    ['licenseNumber', undefined, m.licenseNumber.required],
    ['licenseNumber', '  ', m.licenseNumber.required],
    ['licenseNumber', longText(L.licenseNumber.max + 1), m.licenseNumber.max],
    ['experienceLevel', '10+', m.experienceLevel.invalid],
    ['experienceLevel', undefined, m.experienceLevel.invalid],
    ['location', undefined, m.location.required],
    ['location', '', m.location.required],
    ['location', 'D', m.location.min],
    ['location', longText(L.location.max + 1), m.location.max],
  ])('rejects %s=%j', (field, value, message) => {
    expect(errorsOf(professionalInfoSchema, { ...valid, [field]: value })[field]).toContain(message);
  });

  it('accepts the maximum lengths', () => {
    const input = {
      ...valid,
      companyName: longText(L.companyName.max),
      licenseNumber: longText(L.licenseNumber.max),
      location: longText(L.location.max),
    };
    expect(professionalInfoSchema.safeParse(input).success).toBe(true);
  });

  it('rejects unknown fields', () => {
    expect(errorsOf(professionalInfoSchema, { ...valid, agencyName: 'x' })._form).toEqual([
      commonMessages.unknownField,
    ]);
  });
});

describe('documentUploadSchema', () => {
  const governmentId = {
    documentKind: 'government_id',
    idDocumentType: 'passport',
    fileName: 'passport.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4_760_000,
  };

  it('accepts a government ID, a PDF certificate and an image photo', () => {
    expect(documentUploadSchema.parse(governmentId)).toEqual(governmentId);
    const certificate = {
      documentKind: 'company_registration_certificate',
      fileName: 'certificate.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
    };
    expect(documentUploadSchema.safeParse(certificate).success).toBe(true);
    const photo = {
      documentKind: 'profile_photo',
      fileName: 'me.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    };
    expect(documentUploadSchema.safeParse(photo).success).toBe(true);
  });

  it('requires the document type for a government ID, and only for it', () => {
    expect(
      errorsOf(documentUploadSchema, { ...governmentId, idDocumentType: undefined }).idDocumentType,
    ).toEqual([m.idDocumentType.required]);
    expect(
      errorsOf(documentUploadSchema, { ...governmentId, documentKind: 'company_registration_certificate' })
        .idDocumentType,
    ).toEqual([m.idDocumentType.notAllowed]);
    expect(
      errorsOf(documentUploadSchema, { ...governmentId, idDocumentType: 'national_id' }).idDocumentType,
    ).toEqual([m.idDocumentType.required]);
  });

  it('accepts only JPG or PNG for the profile photo', () => {
    const photoPdf = {
      documentKind: 'profile_photo',
      fileName: 'me.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    };
    expect(errorsOf(documentUploadSchema, photoPdf).mimeType).toEqual([m.mimeType.photo]);
  });

  it.each([
    ['documentKind', 'selfie', m.documentKind.invalid],
    ['documentKind', undefined, m.documentKind.invalid],
    ['fileName', undefined, m.fileName.required],
    ['fileName', '  ', m.fileName.required],
    ['fileName', `${longText(L.fileName.max - 3)}.pdf`, m.fileName.max],
    ['mimeType', 'image/gif', m.mimeType.invalid],
    ['mimeType', undefined, m.mimeType.invalid],
    ['sizeBytes', 0, m.sizeBytes.empty],
    ['sizeBytes', L.maxFileBytes + 1, m.sizeBytes.max],
    ['sizeBytes', '1024', m.sizeBytes.invalid],
    ['sizeBytes', 1.5, m.sizeBytes.invalid],
  ])('rejects %s=%j', (field, value, message) => {
    expect(errorsOf(documentUploadSchema, { ...governmentId, [field]: value })[field]).toContain(message);
  });

  it('accepts exactly 10 MB and a 255-character file name', () => {
    const input = {
      ...governmentId,
      sizeBytes: L.maxFileBytes,
      fileName: `${longText(L.fileName.max - 4)}.pdf`,
    };
    expect(documentUploadSchema.safeParse(input).success).toBe(true);
  });

  it('rejects unknown fields', () => {
    expect(errorsOf(documentUploadSchema, { ...governmentId, url: 'http://x' })._form).toEqual([
      commonMessages.unknownField,
    ]);
  });
});
