import { staffMessages } from '@real-estate/shared';
import placeholderIcon from '../../../assets/staff/property-placeholder.svg';
import styles from './PropertySummary.module.css';

// The property summary of the Assigned Property card (Figma 13009:18310) and of the Assign Property picker:
// cover (a placeholder until STAFF-Q-023), name and "city, state". Spans only, so it fits inside a label.
// `wrap` lets long text wrap (the picker) instead of the card's one-line ellipsis.
export function PropertySummary({ property, wrap = false }) {
  return (
    <span className={styles.summary} data-wrap={wrap || undefined}>
      <span className={styles.cover} aria-hidden="true">
        <img src={placeholderIcon} alt="" width="16" height="16" />
      </span>
      <span className={styles.titles}>
        <span className={styles.name}>{property.name}</span>
        <span className={styles.location}>
          {property.city}, {property.state}
        </span>
      </span>
    </span>
  );
}

// Ready to move / Under construction (Figma 13009:18346); the caller places it.
export function PropertyStatusBadge({ status, className }) {
  return (
    <span className={[styles.badge, className].filter(Boolean).join(' ')} data-status={status}>
      {staffMessages.labels.propertyStatuses[status]}
    </span>
  );
}
