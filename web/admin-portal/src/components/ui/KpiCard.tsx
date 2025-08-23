import React from 'react';
import styles from './KpiCard.module.css';

export type KpiCardProps = {
  title: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
};

export default function KpiCard({ title, value, delta, trend }: KpiCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      {delta && trend && (
        <div className={`${styles.delta} ${styles[trend]}`}>
          <span className={styles.trendIcon}>
            {trend === 'up' && '↗'}
            {trend === 'down' && '↘'}
            {trend === 'flat' && '→'}
          </span>
          {delta}
        </div>
      )}
    </div>
  );
}