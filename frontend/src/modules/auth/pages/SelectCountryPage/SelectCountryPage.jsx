import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { COUNTRY_CODES, selectCountrySchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import CountryOption from '../../../../components/ui/CountryOption.jsx';
import flagAE from '../../../../assets/auth/flag-ae.png';
import flagGB from '../../../../assets/auth/flag-gb.png';
import flagSG from '../../../../assets/auth/flag-sg.png';
import flagUS from '../../../../assets/auth/flag-us.png';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import { useSelectCountryMutation } from '../../api/authApi.js';
import { afterCountrySelectedPath } from '../../hooks/landingPath.js';
import { credentialsSet, selectCurrentUser } from '../../store/authSlice.js';
import styles from './SelectCountryPage.module.css';

// Display name and flag per shared country code (Figma 13038:3958, same order as COUNTRY_CODES).
const COUNTRIES = {
  AE: { label: 'United Arab Emirates', flag: flagAE },
  SG: { label: 'Singapore', flag: flagSG },
  US: { label: 'United States', flag: flagUS },
  GB: { label: 'United Kingdom', flag: flagGB },
};

// Keeps the access token that is current when the response arrives (a refresh may have rotated it).
const userReplaced = (user) => (dispatch, getState) =>
  dispatch(credentialsSet({ accessToken: getState().auth.accessToken, user }));

// Figma: Select a country (13038:3950). Buyer only (ProtectedRoute; the API enforces it too).
// The Buyer's saved country starts selected; with none saved nothing is selected, and Continue shows
// the shared countryCode message. Success stores the returned user and opens
// afterCountrySelectedPath (placeholder until Q-034, TASK-041).
export default function SelectCountryPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [selectCountry] = useSelectCountryMutation();
  const [formError, setFormError] = useState(null);
  const errorId = useId();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(selectCountrySchema),
    defaultValues: { countryCode: user?.preferredCountryCode ?? '' },
  });

  async function onSubmit(values) {
    setFormError(null);
    try {
      const { user: updatedUser } = await selectCountry(values).unwrap();
      dispatch(userReplaced(updatedUser));
      navigate(afterCountrySelectedPath(updatedUser), { replace: true });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  }

  const countryError = errors.countryCode?.message;

  return (
    <AuthSplitLayout
      title="Select a Country"
      subtitle="Choose the country where you want to explore properties. You can change it anytime later"
      tagline="Verify your account to start exploring, listing, or connecting."
      backLabel="Go back"
      backTo={null}
      contentGap={48}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.field}>
          <div
            role="radiogroup"
            aria-label="Country"
            aria-invalid={countryError ? true : undefined}
            aria-describedby={countryError ? errorId : undefined}
            className={styles.options}
          >
            {COUNTRY_CODES.map((code) => (
              <CountryOption
                key={code}
                flag={COUNTRIES[code].flag}
                label={COUNTRIES[code].label}
                value={code}
                {...register('countryCode')}
              />
            ))}
          </div>
          {countryError && (
            <p id={errorId} className={styles.error}>
              {countryError}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          {formError && (
            <p role="alert" className={styles.error}>
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Continue
          </Button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
