import closeIcon from '../../assets/auth/icon-close.svg';
import StatusBadge from './StatusBadge.jsx';
import { formatFileSize } from './formatFileSize.js';
import styles from './UploadedFileCard.module.css';

// A chosen or submitted file (Figma: Uploaded 13038:4910; status screens 13038:4730, 13038:4851).
// Right side: a remove (x) button when `onRemove` is given, else a StatusBadge when `status` is.
// `thumbnail` is an image URL (an object URL for a picked image); without one, a blank tile shows.
export default function UploadedFileCard({ name, size, thumbnail, onRemove, status, className }) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.file}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className={styles.thumbnail} />
        ) : (
          <span className={[styles.thumbnail, styles.blank].join(' ')} aria-hidden="true" />
        )}
        <div className={styles.text}>
          <p className={styles.name}>{name}</p>
          <p className={styles.size}>Size: {formatFileSize(size)}</p>
        </div>
      </div>
      {onRemove ? (
        <button type="button" className={styles.remove} aria-label={`Remove ${name}`} onClick={onRemove}>
          <img src={closeIcon} alt="" width={24} height={24} />
        </button>
      ) : (
        status && <StatusBadge status={status} />
      )}
    </div>
  );
}
