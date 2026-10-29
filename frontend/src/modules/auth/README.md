# auth module (frontend)

- `store/authSlice.js`: access token + current user (memory only)
- `pages/`: one folder per Figma frame (built with `/figma-to-module auth <page>`)
  - `LoginPage` (TASK-033): label "Email" (DEC-022), `loginSchema`; success stores `{ accessToken, user }` in the auth slice and opens `landingPathFor(user)`; any other error (401 `invalidCredentials`, 429, ...) shows the API message in the form alert; 403 `EMAIL_NOT_VERIFIED` opens Verify with `{ email }` in the router state; `state: { passwordChanged: true }` (from Reset password, TASK-036) shows `authMessages.api.passwordChanged`. Google / Apple hidden (DEC-021)
  - `SignUpPage` (TASK-034): Buyer / Developers tabs (`/sign-up`, `/sign-up?role=developer`), `signUpSchema`; success opens Verify with `{ email }` in the router state
  - `ForgotPasswordPage` (TASK-036): `forgotPasswordSchema`, copy "email address" (DEC-022); every accepted email opens the reset Verify with `{ email }` in the router state (the API answers 200 for unknown emails too); shows `state.resetError` from Reset password in the form alert
  - `VerifyResetCodePage` (TASK-036): `VerifyCodeScreen` with `verifyResetCode` / `resendResetCode`; redirects to Forgot Password without an email; on success replaces itself with Reset password and `{ resetToken }` in the router state
  - `ResetPasswordPage` (TASK-036): `resetPasswordSchema`; the reset token lives only in the router state (not Redux, browser storage or the URL); success replaces the entry with Log in and `state: { passwordChanged: true }`; a missing token, a 401 or a `resetToken` field error goes back to Forgot Password with `{ resetError }`
  - `VerifyEmailPage` (TASK-034): reads `email` from the router state (redirects to Sign up without it); on success stores `{ accessToken, user }` in the auth slice and opens Professional info (developer) or Select a country (buyer)
- `components/`, `hooks/`: module-specific pieces
  - `hooks/landingPath.js`: `landingPathFor(user)`, where Log in and Verify email send the Account (Developer: Professional info, otherwise Select a country). Placeholder until Q-034; TASK-041 replaces it
  - `VerifyCodeScreen`: the Verify frame (OTP form, `verifyCodeSchema`, Resend); takes `email`, `verify`, `resend`, `onVerified`, so the password-reset Verify (TASK-036) reuses it with its own mutations
- `api/authApi.js`: `baseApi.injectEndpoints(...)`; each page ticket adds its endpoints (TASK-033: `login`; TASK-034: `signUp`, `verifyEmail`, `resendVerification`; TASK-036: `forgotPassword`, `verifyResetCode`, `resendResetCode`, `resetPassword`; each returning the response `data`)
- `routes.jsx`: `AUTH_PATHS` and `authRoutes` (spread into `app/routes.jsx`); routes point at `AuthPlaceholderPage` until their page ticket replaces them
- Shared UI used by the pages: `components/ui/` AuthSplitLayout, TextInput, Button, Tabs, OtpInput (TASK-031)
