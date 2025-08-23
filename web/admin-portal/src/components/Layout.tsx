import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

interface Props {
  onLogout?: () => void;
}

export default function Layout({ onLogout }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.active} ${styles.navLink}` : styles.navLink;

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <nav>
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/clients" className={linkClass}>
            Clients
          </NavLink>
          <NavLink to="/passes" className={linkClass}>
            Passes
          </NavLink>
          <NavLink to="/redeems" className={linkClass}>
            Redeems
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            Settings
          </NavLink>
          <NavLink to="/schedule" className={linkClass}>
            Schedule
          </NavLink>
          <NavLink to="/content" className={linkClass}>
            Content
          </NavLink>
        </nav>
        {onLogout && (
          <button className={styles.logout} onClick={onLogout}>
            Logout
          </button>
        )}
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
