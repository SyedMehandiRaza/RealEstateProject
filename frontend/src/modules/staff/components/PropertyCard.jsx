import { Link } from 'react-router';
import { staffMessages } from '@real-estate/shared';
import placeholderIcon from '../../../assets/staff/property-placeholder.svg';
import styles from './PropertyCard.module.css';

// Assigned Property card (Figma 13009:18309). The cover is a placeholder until property gives image URLs
// (STAFF-Q-023); the card's second "Active" and "Leads Assigned" are not shown (STAFF-DEC-009).
// `actions` renders extra controls next to View Property (Unassign, STAFF-015).
export default function PropertyCard({ property, actions }) {
  return (
    <article className={styles.card} aria-label={property.name}>
      <span className={styles.badge} data-status={property.propertyStatus}>
        {staffMessages.labels.propertyStatuses[property.propertyStatus]}
      </span>
      <div className={styles.head}>
        <span className={styles.cover} aria-hidden="true">
          <img src={placeholderIcon} alt="" width="16" height="16" />
        </span>
        <div className={styles.titles}>
          <p className={styles.name}>{property.name}</p>
          <p className={styles.location}>
            {property.city}, {property.state}
          </p>
        </div>
      </div>
      <div className={styles.footer}>
        {actions}
        <Link to={`/properties/${property.id}`} className={styles.view}>
          View Property
        </Link>
      </div>
    </article>
  );
}
