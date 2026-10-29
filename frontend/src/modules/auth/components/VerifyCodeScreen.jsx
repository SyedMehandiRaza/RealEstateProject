import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LIMITS, verifyCodeSchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../components/ui/Button.jsx';
import OtpInput from '../../../components/ui/OtpInput.jsx';
import { applyServerErrors } from '../../../lib/applyServerErrors.js';
import styles from './VerifyCodeScreen.module.css';

const CODE_ERROR_ID = 'verify-code-error';

// Figma "Verify" (13038:3920, 13038:4022, and 13038:4052 for password reset; the frames are identical).
// Reusable for both purposes: the page passes the mutations.
//   verify({ email, code })  -> promise of the response data (an RTK Query mutation's .unwrap())
//   resend({ email })        -> promise
//   onVerified(data)         -> called with verify's data (awaited when it returns a promise)
export default function VerifyCodeScreen({ email, verify, resend, onVerified }) {
  const [formError, setFormError] = useState(null);
  const [isResending, setIsResending] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { email, code: '' },
  });

  async function onSubmit(values) {
    setFormError(null);
    try {
      await onVerified(await verify(values)); // may be async (the landing GET), Verify stays disabled
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  }

  async function onResend() {
    setFormError(null);
    clearErrors();
    setIsResending(true);
    try {
      await resend({ email });
      resetField('code');
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    } finally {
      setIsResending(false);
    }
  }

  const codeError = errors.code?.message;
  // The email is not an editable field here, so a message about it is shown with the form messages.
  const message = formError ?? errors.email?.message;

  return (
    <AuthSplitLayout
      title="Verify Your Account"
      subtitle={`We’ve sent a ${LIMITS.auth.codeLength}-digit code to ${email}. Please enter it below to continue.`}
      tagline="Verify your account to start exploring, listing, or connecting."
      backLabel="Go back"
      backTo={null}
      contentGap={48}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.code}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <OtpInput
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                length={LIMITS.auth.codeLength}
                error={codeError}
                errorId={CODE_ERROR_ID}
                autoFocus
              />
            )}
          />
          {codeError && (
            <p id={CODE_ERROR_ID} className={styles.error}>
              {codeError}
            </p>
          )}
        </div>
        {message && (
          <p role="alert" className={styles.error}>
            {message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Verify
        </Button>
      </form>

      <p className={styles.resend}>
        Don’t Receive the code?{' '}
        <button type="button" className={styles.resendButton} onClick={onResend} disabled={isResending}>
          Resend
        </button>
      </p>
    </AuthSplitLayout>
  );
}
