import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export default function Layout(){
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <nav>
          <NavLink to="/" end className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Dashboard</NavLink>
          <NavLink to="/clients" className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Clients</NavLink>
          <NavLink to="/passes" className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Passes</NavLink>
          <NavLink to="/redeems" className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Redeems</NavLink>
          <NavLink to="/settings" className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Settings</NavLink>
          <NavLink to="/schedule" className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Schedule</NavLink>
          <NavLink to="/content" className={({isActive})=> isActive ? styles.active+" "+styles.navLink : styles.navLink}>Content</NavLink>
        </nav>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
