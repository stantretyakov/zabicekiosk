import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { PassWithClient } from '../../types';
import { RenewPassOptions } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';

export type RenewPassDialogProps = {
  open: boolean;
  mode: 'single' | 'bulk';
  pass?: PassWithClient;
  selectedCount?: number;
  onClose: () => void;
  onConfirm: (options: RenewPassOptions) => Promise<void>;
};

export default function RenewPassDialog({
  open,
  mode,
  pass,
  selectedCount = 0,
  onClose,
  onConfirm,
}: RenewPassDialogProps) {
  const { t } = useTranslation();
  const [validityDays, setValidityDays] = useState<number>(30);
  const [price, setPrice] = useState('');
  const [keepRemaining, setKeepRemaining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const initialValidity = mode === 'single' && pass?.validityDays ? pass.validityDays : pass?.validityDays ?? 30;
    setValidityDays(initialValidity || 30);
    setPrice('');
    setKeepRemaining(false);
    setError(null);
  }, [open, mode, pass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!Number.isFinite(validityDays) || validityDays < 1) {
      setError(t('renewValidityError'));
      return;
    }

    const payload: RenewPassOptions = {
      validityDays: Math.max(1, Math.min(365, Math.round(validityDays))),
      keepRemaining,
    };

    if (price.trim() !== '') {
      const parsed = Number(price);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError(t('renewPriceError'));
        return;
      }
      payload.priceRSD = parsed;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(payload);
    } catch (err: any) {
      setError(err?.message || t('renewFailed'));
      return;
    } finally {
      setSubmitting(false);
    }

    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const title =
    mode === 'single'
      ? t('renewPassTitle', { child: pass?.client.childName ?? '' })
      : t('renewSelectedTitle', { count: selectedCount });

  const description =
    mode === 'single'
      ? t('renewPassDescription', {
          remaining: pass?.remaining ?? 0,
          plan: pass?.basePlanSize ?? pass?.planSize ?? 0,
        })
      : t('renewSelectedDescription', { count: selectedCount });

  const expiresAtText = pass?.expiresAt
    ? new Date(pass.expiresAt).toLocaleDateString()
    : t('no');

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, color: 'var(--muted)' }}>{description}</p>

        {mode === 'single' && pass && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('sessionsLabel')}</div>
              <div style={{ fontWeight: 600 }}>{pass.remaining} / {pass.planSize}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('expiresAt')}</div>
              <div style={{ fontWeight: 600 }}>{expiresAtText}</div>
            </div>
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>{t('renewValidityDaysLabel')}</span>
          <input
            type="number"
            min={1}
            max={365}
            value={validityDays}
            onChange={e => setValidityDays(Number(e.target.value) || 1)}
            disabled={submitting}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>{t('renewPriceLabel')}</span>
          <input
            type="number"
            min={0}
            step={50}
            value={price}
            onChange={e => setPrice(e.target.value)}
            disabled={submitting}
            placeholder="0"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text)',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('renewPriceHint')}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="checkbox"
            checked={keepRemaining}
            onChange={e => setKeepRemaining(e.target.checked)}
            disabled={submitting}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{t('renewKeepRemainingLabel')}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('renewKeepRemainingHelp')}</div>
          </div>
        </label>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              background: 'rgba(255, 107, 107, 0.12)',
              border: '1px solid rgba(255, 107, 107, 0.35)',
              color: 'var(--text)',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--text)',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {submitting ? t('renewing') : t('renewConfirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
