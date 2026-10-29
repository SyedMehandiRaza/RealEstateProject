import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { signUpSchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import Tabs from '../../../../components/ui/Tabs.jsx';
import TextInput from '../../../../components/ui/TextInput.jsx';
import emailIcon from '../../../../assets/auth/icon-email.svg';
import lockIcon from '../../../../assets/auth/icon-lock.svg';
import personIcon from '../../../../assets/auth/icon-person.svg';
import phoneIcon from '../../../../assets/auth/icon-phone.svg';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import { useSignUpMutation } from '../../api/authApi.js';
import { AUTH_PATHS } from '../../routes.jsx';
import styles from './SignUpPage.module.css';

const PANEL_ID = 'sign-up-form';
// The Agent tab of the Figma frame is hidden: agents are deferred (DEC-017, Q-035).
const TABS = [
  { value: 'buyer', label: 'Buyer', panelId: PANEL_ID },
  { value: 'developer', label: 'Developers', panelId: PANEL_ID },
];

// The Developers tab is /sign-up?role=developer; anything else is the Buyer tab.
const roleFromParams = (params) => (params.get('role') === 'developer' ? 'developer' : 'buyer');

// Figma: Buyer Sign Up (13038:4146) and Developer Sign Up (13038:4318). Same form for both roles.
export default function SignUpPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = roleFromParams(searchParams);
  const [signUp] = useSignUpMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role, fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  function selectRole(next) {
    setValue('role', next);
    setSearchParams(next === 'developer' ? { role: next } : {}, { replace: true });
  }

  async function onSubmit(values) {
    setFormError(null);
    try {
      const { email } = await signUp(values).unwrap();
      navigate(AUTH_PATHS.verifyEmail, { state: { email } });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  }

  const fieldError = (name) => errors[name]?.message;
  const roleError = fieldError('role');

  return (
    <AuthSplitLayout
      title="Create Your Account"
      subtitle="Sign up to explore properties, manage listings, and connect with clients — all in one place."
      tagline="Join a platform that connects buyers, agents, and developers to simplify every step of the real estate journey."
      contentGap={20}
    >
      <Tabs tabs={TABS} value={role} onChange={selectRole} label="Account type" idPrefix="sign-up-tab" />

      <form
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`sign-up-tab-${role}`}
        className={styles.form}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...register('role')} />
        <div className={styles.fields}>
          <TextInput
            label="Full Name"
            icon={personIcon}
            placeholder="Enter Name"
            autoComplete="name"
            error={fieldError('fullName')}
            {...register('fullName')}
          />
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
            label="Phone number"
            icon={phoneIcon}
            type="tel"
            placeholder="Enter Phone number"
            autoComplete="tel"
            error={fieldError('phone')}
            {...register('phone')}
          />
          <TextInput
            label="Password"
            icon={lockIcon}
            type="password"
            placeholder="Enter Password"
            autoComplete="new-password"
            error={fieldError('password')}
            {...register('password')}
          />
          <TextInput
            label="Confirm Password"
            icon={lockIcon}
            type="password"
            placeholder="Enter Confirm Password"
            autoComplete="new-password"
            error={fieldError('confirmPassword')}
            {...register('confirmPassword')}
          />
        </div>

        <div className={styles.actions}>
          {(formError || roleError) && (
            <p role="alert" className={styles.formError}>
              {formError ?? roleError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Sign Up
          </Button>
        </div>
      </form>

      <p className={styles.switch}>
        Already have an account?{' '}
        <Link to={AUTH_PATHS.login} className={styles.switchLink}>
          Sign In
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
