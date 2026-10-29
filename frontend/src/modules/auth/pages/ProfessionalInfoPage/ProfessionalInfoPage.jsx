import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { DEVELOPER_TYPES, EXPERIENCE_LEVELS, professionalInfoSchema } from '@real-estate/shared';
import AuthSplitLayout from '../../../../components/ui/AuthSplitLayout.jsx';
import Button from '../../../../components/ui/Button.jsx';
import Select from '../../../../components/ui/Select.jsx';
import TextInput from '../../../../components/ui/TextInput.jsx';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import { useSaveProfessionalProfileMutation } from '../../api/authApi.js';
import { AUTH_PATHS } from '../../routes.jsx';
import styles from './ProfessionalInfoPage.module.css';

// Option labels per shared enum value, in the shared order.
// "WEB Select role" (13038:5020) and "WEB Select Experience" (13038:4966).
const DEVELOPER_TYPE_LABELS = { individual: 'Individual', company: 'Company' };
const EXPERIENCE_LEVEL_LABELS = { '0_2': '0–2', '3_5': '3–5', '6_10': '6–10', '10_plus': '10+' };

const toOptions = (values, labels) => values.map((value) => ({ value, label: labels[value] }));
const DEVELOPER_TYPE_OPTIONS = toOptions(DEVELOPER_TYPES, DEVELOPER_TYPE_LABELS);
const EXPERIENCE_LEVEL_OPTIONS = toOptions(EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS);

// Figma 13038:4484: "Company Name" with a smaller "(optional)". The schema still requires it for a
// Company (refine on companyName), and that message is shown as the field error.
const companyNameLabel = (
  <>
    Company Name <span className={styles.optional}>(optional)</span>
  </>
);

// Figma: Professional info (developer) (13038:4466). Developer only (ProtectedRoute; the API
// enforces it too). PUT /auth/me/professional-profile creates or replaces the profile, then Next
// opens Upload Document. Every API refusal (403, or a refusal once Active while Q-033 is open) is
// shown as returned: field errors under their field, anything else in the form alert.
export default function ProfessionalInfoPage() {
  const navigate = useNavigate();
  const [saveProfessionalProfile] = useSaveProfessionalProfileMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      companyName: '',
      developerType: '',
      licenseNumber: '',
      experienceLevel: '',
      location: '',
    },
  });

  async function onSubmit(values) {
    setFormError(null);
    try {
      await saveProfessionalProfile(values).unwrap();
      navigate(AUTH_PATHS.uploadDocuments);
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  }

  return (
    <AuthSplitLayout
      title="Professional Information"
      subtitle="Add your agency or personal info to get verified and start managing listings and clients."
      tagline="Provide your professional details to get verified and start managing listings, clients, and projects seamlessly"
      backLabel="Go back"
      backTo={null}
      contentGap={20}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.fields}>
          <TextInput
            label={companyNameLabel}
            placeholder="Enter Name"
            autoComplete="organization"
            error={errors.companyName?.message}
            {...register('companyName')}
          />
          <Controller
            name="developerType"
            control={control}
            render={({ field }) => (
              <Select
                label="Type of Developer:"
                options={DEVELOPER_TYPE_OPTIONS}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={errors.developerType?.message}
              />
            )}
          />
          <TextInput
            label="License / Registration Number"
            placeholder="Enter License / Registration Number"
            error={errors.licenseNumber?.message}
            {...register('licenseNumber')}
          />
          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <Select
                label="Experience Level"
                options={EXPERIENCE_LEVEL_OPTIONS}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={errors.experienceLevel?.message}
              />
            )}
          />
          <TextInput
            label="Location"
            placeholder="Enter Location"
            error={errors.location?.message}
            {...register('location')}
          />
        </div>
        <div className={styles.actions}>
          {formError && (
            <p role="alert" className={styles.error}>
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Next
          </Button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
