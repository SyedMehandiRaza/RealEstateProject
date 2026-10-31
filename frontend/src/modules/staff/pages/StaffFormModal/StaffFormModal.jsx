import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, useParams } from 'react-router';
import { STAFF_PERMISSIONS, STAFF_ROLES, staffMemberSchema, staffMessages } from '@real-estate/shared';
import Modal from '../../../../components/ui/Modal.jsx';
import MultiSelect from '../../../../components/ui/MultiSelect.jsx';
import Select from '../../../../components/ui/Select.jsx';
import TextInput from '../../../../components/ui/TextInput.jsx';
import { applyServerErrors } from '../../../../lib/applyServerErrors.js';
import {
  apiErrorMessage,
  useCreateStaffMutation,
  useGetStaffQuery,
  useUpdateStaffMutation,
} from '../../api/staffApi.js';
import StaffAddedModal from '../../components/StaffAddedModal.jsx';
import { STAFF_PATHS } from '../../routes.jsx';
import styles from './StaffFormModal.module.css';

const { labels } = staffMessages;
const ROLE_OPTIONS = STAFF_ROLES.map((role) => ({ value: role, label: labels.roles[role] }));
const PERMISSION_OPTIONS = STAFF_PERMISSIONS.map((permission) => ({
  value: permission,
  label: labels.permissions[permission],
}));
const EMPTY = { fullName: '', email: '', phone: '', role: '', permissions: [] };

// Add Staff (/staff/new) and Edit Staff (/staff/:id/edit): the Figma Add Staff modal (13009:18190), reused
// for Edit with its own title and button (STAFF-DEC-011). Edit returns to `location.state.returnTo` (the
// Detail when opened from there) or the list; Add shows the success modal, whose Done returns to the list.
export default function StaffFormModal({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo ?? STAFF_PATHS.list;
  const close = () => navigate(returnTo);

  const member = useGetStaffQuery(Number(id), { skip: !isEdit });
  const [createStaff] = useCreateStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [formError, setFormError] = useState(null);
  const [added, setAdded] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(staffMemberSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (member.data) {
      const { fullName, email, phone, role, permissions } = member.data;
      reset({ fullName, email, phone, role, permissions });
    }
  }, [member.data, reset]);

  async function onSubmit(values) {
    setFormError(null);
    try {
      if (isEdit) {
        await updateStaff({ id: Number(id), ...values }).unwrap();
        close();
      } else {
        await createStaff(values).unwrap();
        setAdded(true);
      }
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  }

  if (added) return <StaffAddedModal onDone={() => navigate(STAFF_PATHS.list)} />;

  const title = isEdit ? 'Edit Staff' : 'Add Staff';
  if (isEdit && member.isError) {
    return (
      <Modal title={title} onClose={close} className={styles.modal}>
        <p role="alert" className={styles.formError}>
          {apiErrorMessage(member.error, staffMessages.ui.loadFailed)}
        </p>
      </Modal>
    );
  }

  const loading = isEdit && !member.data;
  return (
    <Modal title={title} onClose={close} className={styles.modal}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset className={styles.fields} disabled={loading} aria-busy={loading || undefined}>
          <TextInput
            label="Full Name"
            placeholder="Enter Full Name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextInput
            label="Email"
            type="email"
            placeholder="Enter Email"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextInput
            label="Phone Number"
            type="tel"
            placeholder="Enter Phone Number"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={errors.role?.message}
                disabled={loading}
              />
            )}
          />
          <Controller
            name="permissions"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Assign Access Permissions"
                options={PERMISSION_OPTIONS}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={errors.permissions?.message}
                disabled={loading}
              />
            )}
          />
        </fieldset>
        {formError && (
          <p role="alert" className={styles.formError}>
            {formError}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={isSubmitting || loading}>
            {isEdit ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
