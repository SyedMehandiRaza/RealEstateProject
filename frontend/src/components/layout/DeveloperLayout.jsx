import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router';
import accountIcon from '../../assets/layout/account.svg';
import bellIcon from '../../assets/layout/bell.svg';
import crmIcon from '../../assets/layout/crm.svg';
import dashboardIcon from '../../assets/layout/dashboard.svg';
import facilityIcon from '../../assets/layout/facility.svg';
import logoutIcon from '../../assets/layout/logout.svg';
import marketingIcon from '../../assets/layout/marketing.svg';
import propertiesIcon from '../../assets/layout/properties.svg';
import staffIcon from '../../assets/layout/staff.svg';
import subscriptionIcon from '../../assets/layout/subscription.svg';
import supportIcon from '../../assets/layout/support.svg';
import { initials } from '../../lib/initials.js';
import { useLogoutMutation } from '../../modules/auth/api/authApi.js';
import { AUTH_PATHS } from '../../modules/auth/routes.jsx';
import { loggedOut, selectCurrentUser } from '../../modules/auth/store/authSlice.js';
import { baseApi } from '../../services/api/baseApi.js';
import styles from './DeveloperLayout.module.css';

// Sidebar and top bar of every developer page (Figma "Side bar" 13009:18179 and top bar 13009:17817 on the
// Staff Management frame; STAFF-DEC-008). Routes other than /staff belong to modules not built yet and show
// Not Found until then. Icons are the Figma SVGs used as masks, so the active item can recolour them.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: dashboardIcon },
  { label: 'My Properties', to: '/properties', icon: propertiesIcon },
  { label: 'CRM', to: '/crm', icon: crmIcon },
  { label: 'Marketing', to: '/marketing', icon: marketingIcon },
  { label: 'Staff Management', to: '/staff', icon: staffIcon },
  { label: 'Facility Management', to: '/facility', icon: facilityIcon },
  { label: 'Subscription', to: '/subscription', icon: subscriptionIcon },
  { label: 'Support', to: '/support', icon: supportIcon },
  { label: 'Account', to: '/account', icon: accountIcon },
];

const Icon = ({ src }) => (
  <span className={styles.icon} style={{ '--icon': `url("${src}")` }} aria-hidden="true" />
);

export default function DeveloperLayout({ title, children }) {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  function closeMenu() {
    setMenuOpen(false);
    menuButton.current?.focus();
  }

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Ends the session on the server and in memory, then opens Log in (as the auth status pages do).
  async function logOut() {
    try {
      await logout().unwrap();
    } catch {
      // POST /logout always succeeds per SPEC-001; if the request fails the local session is still cleared.
    }
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate(AUTH_PATHS.login, { replace: true });
  }

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`} id="developer-sidebar">
        <p className={styles.logo}>Real Estate</p>
        <nav className={styles.nav} aria-label="Main">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon src={item.icon} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.navItem} onClick={logOut} disabled={isLoggingOut}>
            <Icon src={logoutIcon} />
            Log out
          </button>
        </nav>
      </aside>
      {menuOpen && <div className={styles.backdrop} data-testid="menu-backdrop" onClick={closeMenu} />}

      <div className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.titleRow}>
            <button
              ref={menuButton}
              type="button"
              className={styles.menuButton}
              aria-label="Open menu"
              aria-controls="developer-sidebar"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={styles.menuBars} aria-hidden="true" />
            </button>
            <h1 className={styles.title}>{title}</h1>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.bell} aria-label="Notifications">
              <img src={bellIcon} alt="" className={styles.bellIcon} />
            </button>
            <span className={styles.avatar} role="img" aria-label={user?.fullName ?? 'Account'}>
              {initials(user?.fullName)}
            </span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
