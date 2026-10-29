import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { authMessages, resetPasswordSchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import TextInput from '../../../../components/ui/TextInput.jsx';
import lockIcon from '../../../../assets/auth/icon-lock.svg';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import { useResetPasswordMutation } from '../../api/authApi.js';
import { AUTH_PATHS } from '../../routes.jsx';
import styles from './ResetPasswordPage.module.css';

// The API refuses an invalid, expired or used token with 401 (SPEC-001); a token problem reported as a
// field error is treated the same way, since the visitor cannot fix it on this page.
function refusedTokenMessage(error) {
  const apiError = error?.data?.error;
  if (!apiError) return null;
  const fieldMessage = apiError.fields?.resetToken?.[0];
  if (fieldMessage) return fieldMessage;
  return error.status === 401 ? apiError.message || authMessages.resetToken.required : null;
}

// Figma: Reset password (13038:4106). The reset token comes from Verify in the router state only
// (never storage or the URL). Without it, or when the API refuses it, the visitor goes back to
// Forgot Password with the message. Success opens Log in with `state: { passwordChanged: true }`.
export default function ResetPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [resetPassword] = useResetPasswordMutation();
  const [formError, setFormError] = useState(null);
  const resetToken = state?.resetToken;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { resetToken: resetToken ?? '', password: '', confirmPassword: '' },
  });

  if (!resetToken) return <Navigate to={AUTH_PATHS.forgotPassword} replace />;

  async function onSubmit(values) {
    setFormError(null);
    try {
      await resetPassword(values).unwrap();
      // Replace this entry so the used token does not stay in the history.
      navigate(AUTH_PATHS.login, { replace: true, state: { passwordChanged: true } });
    } catch (error) {
      const tokenMessage = refusedTokenMessage(error);
      if (tokenMessage) {
        navigate(AUTH_PATHS.forgotPassword, { replace: true, state: { resetError: tokenMessage } });
        return;
      }
      setFormError(applyServerErrors(error, setError));
    }
  }

  return (
    <AuthSplitLayout
      title="Reset Password"
      subtitle="Create a strong password for your account."
      tagline="Almost done — let’s secure your account with a new password."
      backLabel="Go back"
      backTo={null}
      contentGap={30}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          label="New Password"
          icon={lockIcon}
          type="password"
          placeholder="Enter New Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <TextInput
          label="Confirm Password"
          icon={lockIcon}
          type="password"
          placeholder="Enter Confirm Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <div className={styles.actions}>
          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Reset
          </Button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
