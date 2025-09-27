import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import styles from './PassActionDialog.module.css';

export type PassActionType = 'convert' | 'deduct' | 'restore';

export interface PassActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count?: number) => Promise<void>;
  actionType: PassActionType;
  passInfo: {
    remaining: number;
    planSize: number;
    childName: string;
    used: number;
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
  const [sessionsCount, setSessionsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionsCount(1);
    setError(null);
  }, [actionType, passInfo]);

  const maxCount = actionType === 'restore' ? passInfo.used : passInfo.remaining;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      if (actionType === 'deduct' || actionType === 'restore') {
        if (sessionsCount <= 0 || sessionsCount > maxCount) {
          setError(`Введите число от 1 до ${maxCount}`);
          return;
        }
        await onConfirm(sessionsCount);
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
    }

    if (actionType === 'restore') {
      return {
        icon: '➕',
        title: t('restoreSessionsTitle'),
        description: t('restoreSessionsDescription'),
        confirmText: t('restoreSessions'),
        cancelText: t('cancel'),
        color: 'var(--accent)',
        bgColor: 'rgba(43, 224, 144, 0.1)',
        borderColor: 'rgba(43, 224, 144, 0.3)',
      };
    }

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

          {(actionType === 'deduct' || actionType === 'restore') && (
            <div className={styles.inputSection}>
              <label className={styles.inputLabel}>
                {actionType === 'deduct' ? t('sessionsToDeduct') : t('sessionsToRestore')}
              </label>
              <div className={styles.inputContainer}>
                <input
                  type="number"
                  value={sessionsCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const safeMax = Math.max(1, maxCount);
                    setSessionsCount(Math.max(1, Math.min(value, safeMax)));
                    setError(null);
                  }}
                  className={styles.numberInput}
                  min="1"
                  max={maxCount}
                  autoFocus
                  disabled={loading}
                />
                <div className={styles.inputHint}>
                  {t('maxSessions')}: {maxCount}
                </div>
              </div>

              <div className={styles.calculationBox}>
                <div className={styles.calculationRow}>
                  <span className={styles.calculationLabel}>{t('currentRemaining')}:</span>
                  <span className={styles.calculationValue}>{passInfo.remaining}</span>
                </div>
                <div className={styles.calculationRow}>
                  <span className={styles.calculationLabel}>
                    {actionType === 'deduct' ? t('toDeduct') : t('toRestore')}:
                  </span>
                  <span className={styles.calculationValue}>
                    {actionType === 'deduct' ? `-${sessionsCount}` : `+${sessionsCount}`}
                  </span>
                </div>
                <div className={`${styles.calculationRow} ${styles.total}`}>
                  <span className={styles.calculationLabel}>
                    {actionType === 'deduct' ? t('afterDeduction') : t('afterRestoration')}:
                  </span>
                  <span className={styles.calculationValue}>
                    {actionType === 'deduct'
                      ? Math.max(0, passInfo.remaining - sessionsCount)
                      : Math.min(passInfo.planSize, passInfo.remaining + sessionsCount)}
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
            disabled={
              loading ||
              ((actionType === 'deduct' || actionType === 'restore') &&
                (sessionsCount <= 0 || sessionsCount > maxCount))
            }
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