import styles from './Pagination.module.css';

// Previous / "Page n of m" / Next. Rendered only when there is more than one page.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={styles.button}
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      <span className={styles.label} aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className={styles.button}
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
