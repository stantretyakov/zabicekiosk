import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import { useState, useEffect } from 'react';

interface Props {
  onLogout?: () => void;
}

export default function Layout({ onLogout }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.active} ${styles.navLink}` : styles.navLink;

  return (
    <div className={styles.app}>
      {/* Mobile Header */}
      {isMobile && (
        <header className={styles.mobileHeader}>
          <div className={styles.mobileHeaderContent}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🏊‍♀️</div>
              <span className={styles.logoText}>Swimming Admin</span>
            </div>
            <button
              className={`${styles.menuToggle} ${isMobileMenuOpen ? styles.menuToggleOpen : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </button>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={closeMobileMenu} />
      )}

      <aside className={`${styles.sidebar} ${isMobile && isMobileMenuOpen ? styles.sidebarMobileOpen : ''}`}>
        {/* Desktop Logo */}
        {!isMobile && (
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🏊‍♀️</div>
              <span className={styles.logoText}>Swimming Admin</span>
            </div>
          </div>
        )}

        <nav className={styles.nav}>
          <NavLink to="/" end className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>Dashboard</span>
          </NavLink>
          <NavLink to="/clients" className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>👥</span>
            <span className={styles.navText}>Clients</span>
          </NavLink>
          <NavLink to="/passes" className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>🎫</span>
            <span className={styles.navText}>Passes</span>
          </NavLink>
          <NavLink to="/redeems" className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>💳</span>
            <span className={styles.navText}>Redeems</span>
          </NavLink>
          <NavLink to="/settings" className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>⚙️</span>
            <span className={styles.navText}>Settings</span>
          </NavLink>
          <NavLink to="/schedule" className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>📅</span>
            <span className={styles.navText}>Schedule</span>
          </NavLink>
          <NavLink to="/content" className={linkClass} onClick={closeMobileMenu}>
            <span className={styles.navIcon}>📝</span>
            <span className={styles.navText}>Content</span>
          </NavLink>
        </nav>

        {onLogout && (
          <div className={styles.sidebarFooter}>
            <button className={styles.logout} onClick={() => { onLogout(); closeMobileMenu(); }}>
              <span className={styles.logoutIcon}>🚪</span>
              <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
        )}
      </aside>

      <main className={`${styles.main} ${isMobile ? styles.mainMobile : ''}`}>
        <div className={styles.mainContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
          </button>
        )}
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
