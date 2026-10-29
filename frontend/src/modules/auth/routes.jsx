import ProtectedRoute from '../../components/routing/ProtectedRoute.jsx';
import AuthPlaceholderPage from './pages/AuthPlaceholderPage/AuthPlaceholderPage.jsx';
import SignUpPage from './pages/SignUpPage/SignUpPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage/VerifyEmailPage.jsx';

// Frontend routes of the auth module (also listed in the Route column of docs/modules/auth/figma.md).
export const AUTH_PATHS = {
  login: '/login',
  signUp: '/sign-up', // Buyer tab; the Developers tab is /sign-up?role=developer
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  verifyResetCode: '/forgot-password/verify',
  resetPassword: '/reset-password',
  selectCountry: '/onboarding/country',
  professionalInfo: '/developer/professional-info',
  uploadDocuments: '/developer/documents',
  verificationStatus: '/developer/status',
};

const placeholder = (title) => <AuthPlaceholderPage title={title} />;

export const authRoutes = [
  { path: AUTH_PATHS.login, element: placeholder('Welcome Back!') },
  { path: AUTH_PATHS.signUp, element: <SignUpPage /> },
  { path: AUTH_PATHS.verifyEmail, element: <VerifyEmailPage /> },
  { path: AUTH_PATHS.forgotPassword, element: placeholder('Forgot Password') },
  { path: AUTH_PATHS.verifyResetCode, element: placeholder('Verify Your Account') },
  { path: AUTH_PATHS.resetPassword, element: placeholder('Reset Password') },
  {
    element: <ProtectedRoute roles={['buyer']} />,
    children: [{ path: AUTH_PATHS.selectCountry, element: placeholder('Select a country') }],
  },
  {
    element: <ProtectedRoute roles={['developer']} />,
    children: [
      { path: AUTH_PATHS.professionalInfo, element: placeholder('Professional info') },
      { path: AUTH_PATHS.uploadDocuments, element: placeholder('Upload Document') },
      { path: AUTH_PATHS.verificationStatus, element: placeholder('Verification status') },
    ],
  },
];
