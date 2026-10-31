import { useState } from 'react';
import { staffMessages } from '@real-estate/shared';
import placeholderIcon from '../../../assets/staff/property-placeholder.svg';
import Modal from '../../../components/ui/Modal.jsx';
import {
  apiErrorMessage,
  useAssignPropertyMutation,
  useListAssignablePropertiesQuery,
} from '../api/staffApi.js';
import styles from './AssignPropertyModal.module.css';

// Assign Property picker (STAFF-DEC-015; no Figma frame, built from the Add Staff modal and the property
// card). One property per Assign. `hasAssigned` tells "none at all" from "all already assigned".
export default function AssignPropertyModal({ staffMemberId, hasAssigned, onClose }) {
  const {
    data: properties,
    error,
    isError,
    isFetching,
    refetch,
  } = useListAssignablePropertiesQuery(staffMemberId);
  const [assignProperty, { isLoading: assigning }] = useAssignPropertyMutation();
  const [selected, setSelected] = useState(null);
  const [assignError, setAssignError] = useState(null);

  async function assign() {
    setAssignError(null);
    try {
      await assignProperty({ id: staffMemberId, propertyId: selected }).unwrap();
      onClose();
    } catch (failure) {
      setSelected(null);
      setAssignError(apiErrorMessage(failure, staffMessages.ui.loadFailed));
    }
  }

  let body;
  if (isError && !isFetching) {
    body = (
      <div role="alert" className={styles.alert}>
        <p>{apiErrorMessage(error, staffMessages.ui.loadFailed)}</p>
        <button type="button" className={styles.retry} onClick={refetch}>
          Retry
        </button>
      </div>
    );
  } else if (!properties) {
    body = <div role="status" aria-label="Loading properties" className={styles.skeleton} />;
  } else if (properties.length === 0) {
    body = (
      <p className={styles.empty}>
        {hasAssigned ? staffMessages.ui.allPropertiesAssigned : staffMessages.ui.noProperties}
      </p>
    );
  } else {
    body = (
      <fieldset className={styles.options}>
        <legend className={styles.legend}>Choose a property</legend>
        {properties.map((property) => (
          <label
            key={property.id}
            className={styles.option}
            data-checked={selected === property.id || undefined}
          >
            <input
              type="radio"
              name="propertyId"
              value={property.id}
              checked={selected === property.id}
              onChange={() => setSelected(property.id)}
              className={styles.radio}
            />
            <span className={styles.cover} aria-hidden="true">
              <img src={placeholderIcon} alt="" width="16" height="16" />
            </span>
            <span className={styles.titles}>
              <span className={styles.name}>{property.name}</span>
              <span className={styles.location}>
                {property.city}, {property.state}
              </span>
            </span>
            <span className={styles.badge} data-status={property.propertyStatus}>
              {staffMessages.labels.propertyStatuses[property.propertyStatus]}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <Modal title="Assign Property" onClose={onClose} className={styles.modal} bodyClassName={styles.content}>
      {body}
      {assignError && (
        <p role="alert" className={styles.error}>
          {assignError}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancel
        </button>
        {properties?.length > 0 && (
          <button type="button" className={styles.assign} onClick={assign} disabled={!selected || assigning}>
            Assign
          </button>
        )}
      </div>
    </Modal>
  );
}
