import { Link, useNavigate } from 'react-router';
import backIcon from '../../assets/auth/icon-back.svg';
import styles from './AuthSplitLayout.module.css';

// Gap between the heading block and the content below it, per Figma frame:
// 20 on Sign Up, 30 on Reset password, 32 on Log in, 48 on Verify, Forgot Password and Select a country.
const GAPS = {
  20: 'var(--space-20)',
  30: 'var(--space-30)',
  32: 'var(--space-32)',
  48: 'var(--space-48)',
};

// Layout shared by every Auth Module frame: hero image with the "Real Estate" mark, a back link and a
// tagline on the left; a white rounded card on the right holding the page heading and content.
// backTo: a path renders a link (Figma "Back to home"); omit it for a "Go back" button (history back).
// icon: an element shown above the heading (the status screens' icon tile), with the same contentGap.
export default function AuthSplitLayout({
  title,
  subtitle,
  tagline,
  backLabel = 'Back to home',
  backTo = '/',
  contentGap = 32,
  icon,
  children,
}) {
  const navigate = useNavigate();
  const back = (
    <>
      <img src={backIcon} alt="" width={10} height={20} />
      <span>{backLabel}</span>
    </>
  );

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroHeader}>
          <p className={styles.brand}>Real Estate</p>
          {backTo ? (
            <Link to={backTo} className={styles.back}>
              {back}
            </Link>
          ) : (
            <button type="button" className={styles.back} onClick={() => navigate(-1)}>
              {back}
            </button>
          )}
        </div>
        {tagline && <p className={styles.tagline}>{tagline}</p>}
      </div>

      <main className={styles.card}>
        <div className={styles.content} style={{ gap: GAPS[contentGap] ?? GAPS[32] }}>
          {icon}
          <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
