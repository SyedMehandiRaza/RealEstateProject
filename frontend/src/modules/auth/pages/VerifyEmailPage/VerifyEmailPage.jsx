import { useDispatch } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useResendVerificationMutation, useVerifyEmailMutation } from '../../api/authApi.js';
import VerifyCodeScreen from '../../components/VerifyCodeScreen.jsx';
import { AUTH_PATHS } from '../../routes.jsx';
import { credentialsSet } from '../../store/authSlice.js';

// After verifying, a Developer continues to Professional info and a Buyer to Select a country.
const nextPathFor = (user) =>
  user?.roles?.includes('developer') ? AUTH_PATHS.professionalInfo : AUTH_PATHS.selectCountry;

// Figma: Verify (buyer 13038:3920, developer 13038:4022). The email arrives in the router state from
// Sign up (or Log in for an unverified account); it is never put in the URL.
export default function VerifyEmailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification] = useResendVerificationMutation();
  const email = state?.email;

  if (!email) return <Navigate to={AUTH_PATHS.signUp} replace />;

  return (
    <VerifyCodeScreen
      email={email}
      verify={(body) => verifyEmail(body).unwrap()}
      resend={(body) => resendVerification(body).unwrap()}
      onVerified={({ accessToken, user }) => {
        // Memory only (Redux); the refresh token is the httpOnly cookie set by the API.
        dispatch(credentialsSet({ accessToken, user }));
        navigate(nextPathFor(user), { replace: true });
      }}
    />
  );
}
