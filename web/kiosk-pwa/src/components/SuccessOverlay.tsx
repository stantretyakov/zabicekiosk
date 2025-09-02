import React from 'react';
import styles from './SuccessOverlay.module.css';

interface SuccessOverlayProps {
  isVisible: boolean;
  message: string;
  details?: string;
  remaining?: number;
  planSize?: number;
  expiresAt?: string;
  }


export default function SuccessOverlay({ 
  isVisible, 
  message, 
  details, 
  remaining, 
  planSize, 
  expiresAt 
}: SuccessOverlayProps) {
  if (!isVisible) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
  <div className={styles.overlay} tabIndex={0} role="dialog" aria-label="Успешное сканирование">
      {/* Floating particles */}
      <div className={styles.particles}>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
      </div>

      {/* Ripple effect */}
      <div className={styles.ripple}></div>

      {/* Main content */}
      <div className={styles.checkmarkContainer}>
        <svg className={styles.checkmark} viewBox="0 0 60 60" aria-hidden="true">
          <path
            className={styles.checkmarkPath}
            d="M15 30 L25 40 L45 20"
          />
        </svg>
      </div>

      <h1 className={styles.successTitle}>
        УСПЕШНОЕ СПИСАНИЕ
      </h1>

      <p className={styles.successMessage}>
        {message}
      </p>

      {details && (
        <p className={styles.successDetails}>
          {details}
        </p>
      )}

      {/* Pass information */}
      {(remaining !== undefined && planSize !== undefined) && (
        <div className={styles.passInfo}>
          <div className={styles.passInfoGrid}>
            <div className={styles.passInfoItem}>
              <span className={styles.passInfoLabel}>Осталось посещений</span>
              <span className={styles.remainingValue}>{remaining}</span>
            </div>
            <div className={styles.passInfoItem}>
              <span className={styles.passInfoLabel}>Всего в абонементе</span>
              <span className={styles.passInfoValue}>{planSize}</span>
            </div>
            {expiresAt && (
              <>
                <div className={styles.passInfoItem}>
                  <span className={styles.passInfoLabel}>Действителен до</span>
                  <span className={`${styles.passInfoValue} ${styles.expiryValue}`}>
                    {formatDate(expiresAt)}
                  </span>
                </div>
                <div className={styles.passInfoItem}>
                  <span className={styles.passInfoLabel}>Прогресс</span>
                  <span className={styles.passInfoValue}>
                    {Math.round(((planSize - remaining) / planSize) * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
