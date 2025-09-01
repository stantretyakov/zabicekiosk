import React from 'react';
import { useTranslation } from '../lib/i18n';
import styles from './PassCard.module.css';

export default function LoadingCard() {
  const { t } = useTranslation();
  
  return (
    <div className={styles.loadingCard}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>{t('loadingPass')}</p>
    </div>
  );
}