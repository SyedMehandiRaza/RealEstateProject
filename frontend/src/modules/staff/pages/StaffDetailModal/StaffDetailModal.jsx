import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { STAFF_PERMISSIONS, STAFF_STATUSES, staffMessages } from '@real-estate/shared';
import closeIcon from '../../../../assets/ui/close.svg';
import emailIcon from '../../../../assets/staff/email.svg';
import grantedIcon from '../../../../assets/staff/permission-granted.svg';
import deniedIcon from '../../../../assets/staff/permission-denied.svg';
import phoneIcon from '../../../../assets/staff/phone.svg';
import statusIcon from '../../../../assets/staff/status-time.svg';
import Modal from '../../../../components/ui/Modal.jsx';
import Select from '../../../../components/ui/Select.jsx';
import { initials } from '../../../../lib/initials.js';
import { apiErrorMessage, useChangeStaffStatusMutation, useGetStaffQuery } from '../../api/staffApi.js';
import PropertyCard from '../../components/PropertyCard.jsx';
import RemoveStaffModal from '../../components/RemoveStaffModal.jsx';
import { STAFF_PATHS } from '../../routes.jsx';
import styles from './StaffDetailModal.module.css';

const { labels } = staffMessages;
const STATUS_OPTIONS = STAFF_STATUSES.map((status) => ({ value: status, label: labels.statuses[status] }));

// Staff Detail (/staff/:id, Figma 13009:18226, 833 x 593). The status dropdown saves at once (STAFF-DEC-014);
// Remove Staff asks first (STAFF-DEC-013).
export default function StaffDetailModal() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const toList = () => navigate(STAFF_PATHS.list);
  const { data: member, error, isError } = useGetStaffQuery(id);
  const [changeStatus, { isLoading: savingStatus }] = useChangeStaffStatusMutation();
  const [statusError, setStatusError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (isError) {
    return (
      <Modal title="Staff member" onClose={toList} className={styles.messageModal}>
        <p role="alert" className={styles.alert}>
          {apiErrorMessage(error, staffMessages.ui.loadFailed)}
        </p>
      </Modal>
    );
  }
  if (!member) {
    return (
      <Modal title="Staff member" showHeader={false} onClose={toList} width="833px" className={styles.modal}>
        <div role="status" aria-label="Loading staff member" className={styles.skeleton} />
      </Modal>
    );
  }

  async function onStatusChange(status) {
    if (status === member.status) return;
    setStatusError(null);
    try {
      await changeStatus({ id, status }).unwrap();
    } catch (failure) {
      setStatusError(apiErrorMessage(failure, staffMessages.ui.loadFailed));
    }
  }

  const granted = new Set(member.permissions);
  return (
    <>
      <Modal
        title={member.fullName}
        showHeader={false}
        onClose={toList}
        width="833px"
        className={styles.modal}
      >
        <button type="button" className={styles.close} aria-label="Close" onClick={toList}>
          <img src={closeIcon} alt="" width="28" height="28" />
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.identity}>
              <span className={styles.avatarRing}>
                <span className={styles.avatar} role="img" aria-label={member.fullName}>
                  {initials(member.fullName)}
                </span>
              </span>
              <div className={styles.names}>
                <p className={styles.name}>{member.fullName}</p>
                <p className={styles.role}>{labels.roles[member.role]}</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.statusSelect} data-status={member.status}>
                <Select
                  ariaLabel="Status"
                  options={STATUS_OPTIONS}
                  value={member.status}
                  onChange={onStatusChange}
                  disabled={savingStatus}
                />
              </div>
              <Link
                to={STAFF_PATHS.edit(id)}
                state={{ returnTo: STAFF_PATHS.detail(id) }}
                className={styles.edit}
              >
                Edit
              </Link>
              <button type="button" className={styles.remove} onClick={() => setConfirmRemove(true)}>
                Remove Staff
              </button>
            </div>
          </div>

          {statusError && (
            <p role="alert" className={styles.alert}>
              {statusError}
            </p>
          )}

          <div className={styles.sections}>
            <div className={styles.info}>
              <div className={styles.infoItem}>
                <img src={phoneIcon} alt="" width="20" height="20" />
                <div className={styles.infoText}>
                  <p className={styles.infoValue}>{member.phone}</p>
                  <p className={styles.infoLabel}>Phone number</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <img src={emailIcon} alt="" width="20" height="20" />
                <div className={styles.infoText}>
                  <p className={styles.infoValue}>{member.email}</p>
                  <p className={styles.infoLabel}>Email Address</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.statusIcon}>
                  <img src={statusIcon} alt="" />
                </span>
                <div className={styles.infoText}>
                  <p className={styles.infoValue} data-status={member.status} data-testid="status-value">
                    {labels.statuses[member.status]}
                  </p>
                  <p className={styles.infoLabel}>Status</p>
                </div>
              </div>
            </div>

            <div className={styles.panels}>
              <section className={styles.permissions} aria-labelledby="staff-permissions-title">
                <h3 id="staff-permissions-title" className={styles.panelTitle}>
                  Assigned Permissions / Access
                </h3>
                <ul className={styles.permissionList} aria-labelledby="staff-permissions-title">
                  {STAFF_PERMISSIONS.map((permission) => (
                    <li key={permission} className={styles.permission}>
                      <img
                        src={granted.has(permission) ? grantedIcon : deniedIcon}
                        alt={granted.has(permission) ? 'Granted' : 'Not granted'}
                        width="16"
                        height="16"
                      />
                      {labels.permissions[permission]}
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.properties} aria-labelledby="staff-properties-title">
                <h3 id="staff-properties-title" className={styles.panelTitle}>
                  Assigned Property
                </h3>
                {member.assignedProperties.length === 0 ? (
                  <p className={styles.empty}>{staffMessages.ui.noPropertiesAssigned}</p>
                ) : (
                  <ul className={styles.propertyList} aria-labelledby="staff-properties-title">
                    {member.assignedProperties.map((property) => (
                      <li key={property.id}>
                        <PropertyCard property={property} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </Modal>
      {confirmRemove && (
        <RemoveStaffModal member={member} onCancel={() => setConfirmRemove(false)} onRemoved={toList} />
      )}
    </>
  );
}
