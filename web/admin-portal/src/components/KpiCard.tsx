import type { ReactNode } from 'react';
import styles from './KpiCard.module.css';

interface Props {
  title: string;
  value: ReactNode;
}

export default function KpiCard({ title, value }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}
