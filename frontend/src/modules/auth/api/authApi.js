import { baseApi } from '../../../services/api/baseApi.js';

// Success bodies are { success: true, data }; each endpoint returns `data`.
const unwrap = (response) => response.data;

// Auth endpoints (SPEC-001, all under /api/auth). Each page ticket adds its own endpoints here:
// login (TASK-033), signUp / verifyEmail / resendVerification (TASK-034), the password reset
// endpoints (TASK-036), selectCountry (TASK-035), ...
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
} = authApi;
