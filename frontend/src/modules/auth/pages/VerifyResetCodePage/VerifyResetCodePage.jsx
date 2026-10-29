import { Navigate, useLocation, useNavigate } from 'react-router';
import { useResendResetCodeMutation, useVerifyResetCodeMutation } from '../../api/authApi.js';
import VerifyCodeScreen from '../../components/VerifyCodeScreen.jsx';
import { AUTH_PATHS } from '../../routes.jsx';

// Figma: Verify (password reset, 13038:4052), identical to the email Verify frames, so it reuses
// VerifyCodeScreen with the password reset mutations. The email arrives in the router state from
// Forgot Password; without it the visitor goes back there.
export default function VerifyResetCodePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [verifyResetCode] = useVerifyResetCodeMutation();
  const [resendResetCode] = useResendResetCodeMutation();
  const email = state?.email;

  if (!email) return <Navigate to={AUTH_PATHS.forgotPassword} replace />;

  return (
    <VerifyCodeScreen
      email={email}
      verify={(body) => verifyResetCode(body).unwrap()}
      resend={(body) => resendResetCode(body).unwrap()}
      onVerified={({ resetToken }) => {
        // The reset token lives only in the router state (never in storage or the URL). Replacing this
        // entry means Back from Reset password returns to Forgot Password, not to a used code.
        navigate(AUTH_PATHS.resetPassword, { replace: true, state: { resetToken } });
      }}
    />
  );
}
