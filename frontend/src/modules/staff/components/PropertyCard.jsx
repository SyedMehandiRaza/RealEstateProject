import { Link } from 'react-router';
import styles from './PropertyCard.module.css';
import { PropertyStatusBadge, PropertySummary } from './PropertySummary.jsx';

// Assigned Property card (Figma 13009:18309). The card's second "Active" and "Leads Assigned" are not shown
// (STAFF-DEC-009). `actions` renders extra controls next to View Property (Unassign, STAFF-015).
export default function PropertyCard({ property, actions }) {
  return (
    <article className={styles.card} aria-label={property.name}>
      <PropertyStatusBadge status={property.propertyStatus} className={styles.badge} />
      <div className={styles.head}>
        <PropertySummary property={property} />
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
