import React from 'react';
import styles from './Sidebar.module.css';

export type SidebarItem = {
  to: string;
  label: string;
  icon?: React.ReactNode;
};

export type SidebarProps = {
  items: SidebarItem[];
  activePath: string;
  onLogout?: () => void;
};

export default function Sidebar({ items, activePath, onLogout }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {items.map((item) => (
          <a
            key={item.to}
            href={item.to}
            className={`${styles.navItem} ${
              activePath === item.to ? styles.active : ''
            }`}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span className={styles.label}>{item.label}</span>
          </a>
        ))}
      </nav>
      
      {onLogout && (
        <button
          type="button"
          className={styles.logoutButton}
          onClick={onLogout}
        >
          Logout
        </button>
      )}
    </aside>
  );
}