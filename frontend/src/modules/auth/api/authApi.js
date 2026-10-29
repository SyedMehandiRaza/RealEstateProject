import { baseApi } from '../../../services/api/baseApi.js';

// Success bodies are { success: true, data }; each endpoint returns `data`.
const unwrap = (response) => response.data;

// Auth endpoints (SPEC-001, all under /api/auth). Each page ticket adds its own endpoints here:
// login (TASK-033), signUp / verifyEmail / resendVerification (TASK-034), the password reset
// endpoints (TASK-036), selectCountry (TASK-035), saveProfessionalProfile (TASK-038),
// getVerification / submitDocuments (TASK-039), logout (TASK-040), ...
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // loginSchema body -> 200 { accessToken, user } plus the refresh cookie;
    // 401 invalidCredentials for every failure, 403 EMAIL_NOT_VERIFIED (a new code is sent).
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // signUpSchema body -> 201 { email }; a verification code is emailed.
    signUp: build.mutation({
      query: (body) => ({ url: '/auth/sign-up', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // verifyCodeSchema body -> 200 { accessToken, user } plus the refresh cookie.
    verifyEmail: build.mutation({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // resendCodeSchema body -> 200 { sent: true }; 429 with resendTooSoon / resendLimit.
    resendVerification: build.mutation({
      query: (body) => ({ url: '/auth/verify-email/resend', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // forgotPasswordSchema body -> 200 { sent: true } whether or not the Account exists; 429 as for resend.
    forgotPassword: build.mutation({
      query: (body) => ({ url: '/auth/password/forgot', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // verifyCodeSchema body -> 200 { resetToken }, valid 10 minutes; 422 as for verify-email.
    verifyResetCode: build.mutation({
      query: (body) => ({ url: '/auth/password/verify', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // resendCodeSchema body -> 200 { sent: true }; 429 with resendTooSoon / resendLimit.
    resendResetCode: build.mutation({
      query: (body) => ({ url: '/auth/password/resend', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // resetPasswordSchema body -> 200 { message: passwordChanged }; every refresh token is revoked.
    // 401 UNAUTHORIZED with resetToken.required when the token is invalid, expired or already used.
    resetPassword: build.mutation({
      query: (body) => ({ url: '/auth/password/reset', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    // selectCountrySchema body -> 200 { user } with user.preferredCountryCode (Buyer only).
    // 403 FORBIDDEN without the Buyer role; 422 countryCode.invalid outside COUNTRY_CODES.
    selectCountry: build.mutation({
      query: (body) => ({ url: '/auth/me/country', method: 'PUT', body }),
      transformResponse: unwrap,
    }),
    // professionalInfoSchema body -> 200 { profile } (creates or replaces the Developer's profile).
    // 403 FORBIDDEN without the Developer role; 422 per field (companyName.required for a Company).
    saveProfessionalProfile: build.mutation({
      query: (body) => ({ url: '/auth/me/professional-profile', method: 'PUT', body }),
      transformResponse: unwrap,
    }),
    // Refresh cookie -> 204, the token revoked and the cookie cleared; always succeeds (SPEC-001).
    logout: build.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    // GET -> 200 { status, documents } (Developer only, 403 otherwise). `documents` holds one entry per
    // required kind (2 for an Individual, 3 for a Company, DEC-022) with the latest document's status.
    // Assumed entry shape until TASK-030 lands: { documentKind, status: null | DOCUMENT_STATUSES, rejectionReason }.
    getVerification: build.query({
      query: () => '/auth/me/verification',
      transformResponse: unwrap,
    }),
    // FormData (one file part per document kind, named after the kind, plus idDocumentType) ->
    // 201 { verification }. 422 per file under fields["documents.<kind>.<field>"]; 409 CONFLICT for a
    // kind whose latest document is pending or approved. The new status replaces the cached GET.
    submitDocuments: build.mutation({
      query: (formData) => ({ url: '/auth/me/documents', method: 'POST', body: formData }),
      transformResponse: unwrap,
      async onQueryStarted(_formData, { dispatch, queryFulfilled }) {
        let data;
        try {
          ({ data } = await queryFulfilled);
        } catch {
          return; // The page shows the failure from the mutation result.
        }
        if (data?.verification) {
          dispatch(authApi.util.upsertQueryData('getVerification', undefined, data.verification));
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignUpMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
  useResendResetCodeMutation,
  useResetPasswordMutation,
  useSelectCountryMutation,
  useSaveProfessionalProfileMutation,
  useGetVerificationQuery,
  useSubmitDocumentsMutation,
  useLogoutMutation,
} = authApi;
