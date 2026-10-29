import ProtectedRoute from '../../components/routing/ProtectedRoute.jsx';
import AuthPlaceholderPage from './pages/AuthPlaceholderPage/AuthPlaceholderPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage.jsx';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import ProfessionalInfoPage from './pages/ProfessionalInfoPage/ProfessionalInfoPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.jsx';
import SelectCountryPage from './pages/SelectCountryPage/SelectCountryPage.jsx';
import SignUpPage from './pages/SignUpPage/SignUpPage.jsx';
import UploadDocumentsPage from './pages/UploadDocumentsPage/UploadDocumentsPage.jsx';
import VerificationStatusPage from './pages/VerificationStatusPage/VerificationStatusPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage/VerifyEmailPage.jsx';
import VerifyResetCodePage from './pages/VerifyResetCodePage/VerifyResetCodePage.jsx';

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
  plans: '/developer/plans', // "View plan" on Approved: a placeholder until a plans module exists (DEC-022)
};

const placeholder = (title) => <AuthPlaceholderPage title={title} />;

export const authRoutes = [
  { path: AUTH_PATHS.login, element: <LoginPage /> },
  { path: AUTH_PATHS.signUp, element: <SignUpPage /> },
  { path: AUTH_PATHS.verifyEmail, element: <VerifyEmailPage /> },
  { path: AUTH_PATHS.forgotPassword, element: <ForgotPasswordPage /> },
  { path: AUTH_PATHS.verifyResetCode, element: <VerifyResetCodePage /> },
  { path: AUTH_PATHS.resetPassword, element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute roles={['buyer']} />,
    children: [{ path: AUTH_PATHS.selectCountry, element: <SelectCountryPage /> }],
  },
  {
    element: <ProtectedRoute roles={['developer']} />,
    children: [
      { path: AUTH_PATHS.professionalInfo, element: <ProfessionalInfoPage /> },
      { path: AUTH_PATHS.uploadDocuments, element: <UploadDocumentsPage /> },
      { path: AUTH_PATHS.verificationStatus, element: <VerificationStatusPage /> },
      { path: AUTH_PATHS.plans, element: placeholder('Plans coming soon') },
    ],
  },
];
