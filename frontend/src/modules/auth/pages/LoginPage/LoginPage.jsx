import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router';
import { authMessages, loginSchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import TextInput from '../../../../components/ui/TextInput.jsx';
import emailIcon from '../../../../assets/auth/icon-email.svg';
import lockIcon from '../../../../assets/auth/icon-lock.svg';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import { useLoginMutation } from '../../api/authApi.js';
import { landingPathFor } from '../../hooks/landingPath.js';
import { AUTH_PATHS } from '../../routes.jsx';
import { credentialsSet } from '../../store/authSlice.js';
import styles from './LoginPage.module.css';

// Figma: Log in (13038:3861). Login is by email only, so the "Email/ Phone number" label of the
// frame is "Email" (DEC-022). Google / Apple and the "or" divider are hidden until built (DEC-021).
// Reset password opens this page with `state: { passwordChanged: true }` (TASK-036).
export default function LoginPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(state?.passwordChanged ? authMessages.api.passwordChanged : null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values) {
    setFormError(null);
    setNotice(null);
    try {
      const { accessToken, user } = await login(values).unwrap();
      // Memory only (Redux); the refresh token is the httpOnly cookie set by the API.
      dispatch(credentialsSet({ accessToken, user }));
      navigate(landingPathFor(user), { replace: true });
    } catch (error) {
      // Right password, unverified email: the API has sent a new code; Verify reads the email from state.
      if (error?.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
        navigate(AUTH_PATHS.verifyEmail, { state: { email: values.email } });
        return;
      }
      setFormError(applyServerErrors(error, setError));
    }
  }

  const fieldError = (name) => errors[name]?.message;

  return (
    <AuthSplitLayout
      title="Welcome Back!"
      subtitle="Access your account to explore, manage, and grow your real estate connections."
      tagline="Discover, book, and manage properties effortlessly — all in one platform for buyers, agents, and developers."
      contentGap={32}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.credentials}>
          <div className={styles.fields}>
            <TextInput
              label="Email"
              icon={emailIcon}
              type="email"
              placeholder="Enter Email"
              autoComplete="email"
              error={fieldError('email')}
              {...register('email')}
            />
            <TextInput
              label="Password"
              icon={lockIcon}
              type="password"
              placeholder="Enter Password"
              autoComplete="current-password"
              error={fieldError('password')}
              {...register('password')}
            />
          </div>
          <Link to={AUTH_PATHS.forgotPassword} className={styles.forgot}>
            Forgot Password?
          </Link>
        </div>

        <div className={styles.actions}>
          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}
            </p>
          )}
          {notice && !formError && (
            <p role="status" className={styles.notice}>
              {notice}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Log In
          </Button>
        </div>
      </form>

      <p className={styles.switch}>
        Don’t have an account?{' '}
        <Link to={AUTH_PATHS.signUp} className={styles.link}>
          Sign Up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
