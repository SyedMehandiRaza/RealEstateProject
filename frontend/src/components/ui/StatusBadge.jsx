import pendingDot from '../../assets/auth/dot-pending.svg';
import approvedDot from '../../assets/auth/dot-approved.svg';
import rejectedDot from '../../assets/auth/dot-reject.svg';
import styles from './StatusBadge.module.css';

// Document review status (Figma: Pending 13038:4739, Approved 13038:4799, Reject 13038:4860).
// `status` is one of DOCUMENT_STATUSES from @real-estate/shared: 'pending' | 'approved' | 'rejected'.
const VARIANTS = {
  pending: { label: 'Pending', dot: pendingDot, className: styles.pending },
  approved: { label: 'Approved', dot: approvedDot, className: styles.approved },
  rejected: { label: 'Reject', dot: rejectedDot, className: styles.rejected },
};

export default function StatusBadge({ status, className }) {
  const variant = VARIANTS[status];
  if (!variant) throw new Error(`StatusBadge: unknown status "${status}"`);
  return (
    <span className={[styles.badge, variant.className, className].filter(Boolean).join(' ')}>
      <img src={variant.dot} alt="" width={12} height={12} className={styles.dot} />
      {variant.label}
    </span>
  );
}
