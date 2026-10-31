import { useState } from 'react';
import { staffMessages } from '@real-estate/shared';
import Modal from '../../../components/ui/Modal.jsx';
import { apiErrorMessage, useRemoveStaffMutation } from '../api/staffApi.js';
import styles from './RemoveStaffModal.module.css';

// Remove confirmation (STAFF-DEC-013; no Figma frame, built in the success modal's style). Calls
// onRemoved after the delete, also when the member was already gone (404); other errors stay here.
export default function RemoveStaffModal({ member, onCancel, onRemoved }) {
  const [removeStaff, { isLoading }] = useRemoveStaffMutation();
  const [error, setError] = useState(null);
  const title = staffMessages.ui.removeTitle(member.fullName);

  async function confirm() {
    setError(null);
    try {
      await removeStaff(member.id).unwrap();
      onRemoved();
    } catch (failure) {
      if (failure?.status === 404) onRemoved();
      else setError(apiErrorMessage(failure, staffMessages.ui.loadFailed));
    }
  }

  return (
    <Modal
      title={title}
      showHeader={false}
      onClose={onCancel}
      width="332px"
      className={styles.modal}
      bodyClassName={styles.content}
    >
      <div className={styles.copy}>
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{staffMessages.ui.removeBody}</p>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.remove} onClick={confirm} disabled={isLoading}>
          Remove
        </button>
      </div>
    </Modal>
  );
}
