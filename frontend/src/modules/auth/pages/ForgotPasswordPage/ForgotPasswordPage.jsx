import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { forgotPasswordSchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import TextInput from '../../../../components/ui/TextInput.jsx';
import emailIcon from '../../../../assets/auth/icon-email.svg';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import { useForgotPasswordMutation } from '../../api/authApi.js';
import { AUTH_PATHS } from '../../routes.jsx';
import styles from './ForgotPasswordPage.module.css';

// Figma: Forgot Password (13038:4082). Reset is by email only, so the copy says "email address"
// instead of "email address or phone number" (DEC-022).
// The API answers 200 whether or not the Account exists, so every accepted email opens the same Verify.
// Reset password sends the user back here with `state: { resetError }` when the reset token is refused.
export default function ForgotPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [forgotPassword] = useForgotPasswordMutation();
  const [formError, setFormError] = useState(state?.resetError ?? null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    setFormError(null);
    try {
      await forgotPassword(values).unwrap();
      // The email travels in the router state only, never in the URL.
      navigate(AUTH_PATHS.verifyResetCode, { state: { email: values.email } });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  }

  return (
    <AuthSplitLayout
      title="Forgot Password?"
      subtitle="Enter your registered email address, and we’ll send you a code to reset your password."
      tagline="Forgot your password? Let’s help you get back to managing your real estate journey."
      backLabel="Go back"
      backTo={null}
      contentGap={48}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          label="Email"
          icon={emailIcon}
          type="email"
          placeholder="Enter Email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className={styles.actions}>
          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Send Code
          </Button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
