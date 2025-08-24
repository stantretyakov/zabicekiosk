import React from 'react';
import styles from './PassCard.module.css';

interface ErrorCardProps {
  message: string;
}

export default function ErrorCard({ message }: ErrorCardProps) {
  return (
    <div className={styles.errorCard}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2 className={styles.errorTitle}>Unable to Load Pass</h2>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
}