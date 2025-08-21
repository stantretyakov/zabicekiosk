import type { HTMLAttributes, PropsWithChildren } from 'react';
import styles from './DataTable.module.css';

export default function DataTable(
  { children, ...rest }: PropsWithChildren<HTMLAttributes<HTMLTableElement>>
) {
  return (
    <table className={styles.table} {...rest}>
      {children}
    </table>
  );
}
