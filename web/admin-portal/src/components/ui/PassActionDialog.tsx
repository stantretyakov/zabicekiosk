import React, { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import styles from './PassActionDialog.module.css';

export type PassActionType = 'convert' | 'deduct';

export interface PassActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count?: number) => Promise<void>;
  actionType: PassActionType;
  passInfo: {
    remaining: number;
    planSize: number;
    childName: string;
  };
}

export default function PassActionDialog({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  passInfo
}: PassActionDialogProps) {
  const { t } = useTranslation();
  const [deductCount, setDeductCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      if (actionType === 'deduct') {
        if (deductCount <= 0 || deductCount > passInfo.remaining) {
          setError(`Введите число от 1 до ${passInfo.remaining}`);
          return;
        }
        await onConfirm(deductCount);
      } else {
        await onConfirm();
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const getDialogConfig = () => {
    if (actionType === 'convert') {
      return {
        icon: '🔄',
        title: t('convertLastVisitTitle'),
        description: t('convertLastVisitDescription'),
        confirmText: t('convertVisit'),
        cancelText: t('cancel'),
        color: 'var(--warn)',
        bgColor: 'rgba(255, 209, 102, 0.1)',
        borderColor: 'rgba(255, 209, 102, 0.3)',
      };
    } else {
      return {
        icon: '➖',
        title: t('deductSessionsTitle'),
        description: t('deductSessionsDescription'),
        confirmText: t('deductSessions'),
        cancelText: t('cancel'),
        color: 'var(--error)',
        bgColor: 'rgba(255, 107, 107, 0.1)',
        borderColor: 'rgba(255, 107, 107, 0.3)',
      };
    }
  };

  if (!isOpen) return null;

  const config = getDialogConfig();

  return (
    <div className={styles.backdrop} onClick={onClose} onKeyDown={handleKeyDown}>
      <div 
        className={styles.dialog} 
        onClick={(e) => e.stopPropagation()}
        style={{
          '--dialog-color': config.color,
          '--dialog-bg': config.bgColor,
          '--dialog-border': config.borderColor,
        } as React.CSSProperties}
      >
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>{config.icon}</span>
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{config.title}</h2>
            <p className={styles.subtitle}>
              {passInfo.childName} • {passInfo.remaining}/{passInfo.planSize} {t('sessionsRemaining')}
            </p>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            type="button"
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.description}>
            {config.description}
          </div>

          {actionType === 'convert' && (
            <div className={styles.warningBox}>
              <div className={styles.warningIcon}>⚠️</div>
              <div className={styles.warningText}>
                <strong>{t('importantNote')}</strong>
                <p>{t('convertWarningText')}</p>
              </div>
            </div>
          )}

          {actionType === 'deduct' && (
            <div className={styles.inputSection}>
              <label className={styles.inputLabel}>
                {t('sessionsToDeduct')}
              </label>
              <div className={styles.inputContainer}>
                <input
                  type="number"
                  value={deductCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setDeductCount(Math.max(1, Math.min(value, passInfo.remaining)));
                    setError(null);
                  }}
                  className={styles.numberInput}
                  min="1"
                  max={passInfo.remaining}
                  autoFocus
                  disabled={loading}
                />
                <div className={styles.inputHint}>
                  {t('maxSessions')}: {passInfo.remaining}
                </div>
              </div>
              
              <div className={styles.calculationBox}>
                <div className={styles.calculationRow}>
                  <span className={styles.calculationLabel}>{t('currentRemaining')}:</span>
                  <span className={styles.calculationValue}>{passInfo.remaining}</span>
                </div>
                <div className={styles.calculationRow}>
                  <span className={styles.calculationLabel}>{t('toDeduct')}:</span>
                  <span className={styles.calculationValue}>-{deductCount}</span>
                </div>
                <div className={`${styles.calculationRow} ${styles.total}`}>
                  <span className={styles.calculationLabel}>{t('afterDeduction')}:</span>
                  <span className={styles.calculationValue}>
                    {passInfo.remaining - deductCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={styles.cancelButton}
          >
            {config.cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (actionType === 'deduct' && (deductCount <= 0 || deductCount > passInfo.remaining))}
            className={styles.confirmButton}
          >
            {loading ? (
              <>
                <div className={styles.spinner} />
                {t('processing')}
              </>
            ) : (
              <>
                <span className={styles.confirmIcon}>{config.icon}</span>
                {config.confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}