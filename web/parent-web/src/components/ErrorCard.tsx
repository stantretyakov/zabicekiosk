import React from 'react';
import { useTranslation } from '../lib/i18n';
import styles from './PassCard.module.css';

interface ErrorCardProps {
  message: string;
}

export default function ErrorCard({ message }: ErrorCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className={styles.errorCard}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2 className={styles.errorTitle}>{t('unableToLoadPass')}</h2>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
}