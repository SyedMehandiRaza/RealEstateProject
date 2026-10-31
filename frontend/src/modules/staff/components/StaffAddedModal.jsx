import { staffMessages } from '@real-estate/shared';
import verifiedIcon from '../../../assets/staff/success-verified.svg';
import Modal from '../../../components/ui/Modal.jsx';
import styles from './StaffAddedModal.module.css';

// "Successfully Added" (Figma 13009:18180, 332 x 261) shown after Add Staff; Done returns to the list.
export default function StaffAddedModal({ onDone }) {
  return (
    <Modal
      title={staffMessages.ui.addedTitle}
      showHeader={false}
      onClose={onDone}
      width="332px"
      className={styles.modal}
      bodyClassName={styles.content}
    >
      <div className={styles.body}>
        <span className={styles.iconTile}>
          <img src={verifiedIcon} alt="" className={styles.icon} />
        </span>
        <div className={styles.copy}>
          <p className={styles.title}>{staffMessages.ui.addedTitle}</p>
          <p className={styles.text}>{staffMessages.ui.addedBody}</p>
        </div>
      </div>
      <button type="button" className={styles.done} onClick={onDone}>
        Done.
      </button>
    </Modal>
  );
}
