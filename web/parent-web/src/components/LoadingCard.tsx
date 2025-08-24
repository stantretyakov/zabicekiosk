import React from 'react';
import styles from './PassCard.module.css';

export default function LoadingCard() {
  return (
    <div className={styles.loadingCard}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>Loading your pass...</p>
    </div>
  );
}