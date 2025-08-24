import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { getClientToken, listPasses } from '../../lib/api';
import styles from './ClientForm.module.css';
import type { PassWithClient } from '../../types';

export type Client = {
  id: string;
  parentName: string;
  childName: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  active: boolean;
};

export type ClientFormProps = {
  initial?: Partial<Client>;
  mode: 'create' | 'edit';
  onSubmit: (values: Partial<Client>) => void;
  onCancel: () => void;
  submitting?: boolean;
  error?: string | null;
};

export default function ClientForm({
  initial,
  mode,
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
}: ClientFormProps) {
  const [values, setValues] = useState({
    parentName: initial?.parentName || '',
    childName: initial?.childName || '',
    phone: initial?.phone || '',
    telegram: initial?.telegram || '',
    instagram: initial?.instagram || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [passes, setPasses] = useState<PassWithClient[]>([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  // Reset form when initial values change
  useEffect(() => {
    setValues({
      parentName: initial?.parentName || '',
      childName: initial?.childName || '',
      phone: initial?.phone || '',
      telegram: initial?.telegram || '',
      instagram: initial?.instagram || '',
    });
    setValidationErrors({});
    setPassUrl(null);
  }, [initial]);

  // Load token and render QR code when editing an existing client
  useEffect(() => {
    if (mode !== 'edit' || !initial?.id) return;

    const clientId = initial.id as string;
    loadClientPasses(clientId);
    loadClientToken(clientId);
  }, [mode, initial?.id]);

  const loadClientPasses = async (clientId: string) => {
    try {
      setLoadingPasses(true);
      const data = await listPasses({ clientId });
      setPasses(data.items);
    } catch (err) {
      console.error('Failed to load client passes:', err);
    } finally {
      setLoadingPasses(false);
    }
  };

  const loadClientToken = async (clientId: string) => {
    async function loadToken() {
      try {
        setLoadingToken(true);
        const { token } = await getClientToken(clientId);
        const baseUrl =
          import.meta.env.VITE_PARENT_PORTAL_URL ||
          window.location.origin.replace(/admin[^.]*/, 'parent');
        const url = `${baseUrl}?token=${token}`;
        setPassUrl(url);

        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          qrInstance.current = new QRCodeStyling({
            width: 200,
            height: 200,
            data: url,
            dotsOptions: {
              color: '#2be090',
              type: 'rounded',
            },
            backgroundOptions: {
              color: '#1a1a1a',
            },
            cornersSquareOptions: {
              color: '#2be090',
              type: 'extra-rounded',
            },
            cornersDotOptions: {
              color: '#2be090',
              type: 'dot',
            },
          });
          qrInstance.current.append(qrRef.current);
        }
      } catch (err) {
        console.error('Failed to load client token:', err);
      } finally {
        setLoadingToken(false);
      }
    }

    loadToken();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const shareViaWebShare = async () => {
    if (!passUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Swimming Pass - ${values.childName}`,
          text: `Access your swimming pass for ${values.childName}`,
          url: passUrl,
        });
      } else {
        // Fallback to copying
        await copyToClipboard(passUrl);
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const downloadQR = () => {
    if (qrInstance.current) {
      qrInstance.current.download({
        name: `${values.childName.replace(/\s+/g, '_')}_swimming_pass`,
        extension: 'png'
      });
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'parentName':
        return !value.trim() ? 'Parent name is required' : '';
      case 'childName':
        return !value.trim() ? 'Child name is required' : '';
      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return 'Invalid phone format';
        }
        return '';
      case 'telegram':
        if (value && !/^@?[A-Za-z0-9_]{3,32}$/.test(value)) {
          return 'Invalid telegram handle';
        }
        return '';
      case 'instagram':
        if (value && !/^@?[A-Za-z0-9._]{1,30}$/.test(value.replace(/^https?:\/\/(www\.)?instagram\.com\//, ''))) {
          return 'Invalid instagram handle';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    Object.entries(values).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) errors[name] = error;
    });

    setValidationErrors(errors);

    // Don't submit if there are validation errors
    if (Object.values(errors).some(error => error)) {
      return;
    }

    // Clean up values before submitting
    const cleanValues = {
      parentName: values.parentName.trim(),
      childName: values.childName.trim(),
      phone: values.phone.trim() || undefined,
      telegram: values.telegram.trim().replace(/^@/, '') || undefined,
      instagram: values.instagram.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '') || undefined,
    };

    onSubmit(cleanValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const hasValidationErrors = Object.values(validationErrors).some(error => error);

  return (
    <div className={styles.backdrop} onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>
            {mode === 'create' ? 'Add Client' : 'Edit Client'}
          </h2>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="parentName" className={styles.label}>
              Parent Name *
            </label>
            <input
              id="parentName"
              name="parentName"
              type="text"
              value={values.parentName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={`${styles.input} ${validationErrors.parentName ? styles.inputError : ''}`}
              maxLength={80}
              required
              aria-describedby={validationErrors.parentName ? 'parentName-error' : undefined}
            />
            {validationErrors.parentName && (
              <div id="parentName-error" className={styles.fieldError} role="alert">
                {validationErrors.parentName}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="childName" className={styles.label}>
              Child Name *
            </label>
            <input
              id="childName"
              name="childName"
              type="text"
              value={values.childName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={`${styles.input} ${validationErrors.childName ? styles.inputError : ''}`}
              maxLength={80}
              required
              aria-describedby={validationErrors.childName ? 'childName-error' : undefined}
            />
            {validationErrors.childName && (
              <div id="childName-error" className={styles.fieldError} role="alert">
                {validationErrors.childName}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={`${styles.input} ${validationErrors.phone ? styles.inputError : ''}`}
              placeholder="+381 60 123 4567"
              aria-describedby={validationErrors.phone ? 'phone-error' : undefined}
            />
            {validationErrors.phone && (
              <div id="phone-error" className={styles.fieldError} role="alert">
                {validationErrors.phone}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="telegram" className={styles.label}>
              Telegram
            </label>
            <input
              id="telegram"
              name="telegram"
              type="text"
              value={values.telegram}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={`${styles.input} ${validationErrors.telegram ? styles.inputError : ''}`}
              placeholder="@username"
              aria-describedby={validationErrors.telegram ? 'telegram-error' : undefined}
            />
            {validationErrors.telegram && (
              <div id="telegram-error" className={styles.fieldError} role="alert">
                {validationErrors.telegram}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="instagram" className={styles.label}>
              Instagram
            </label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              value={values.instagram}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={`${styles.input} ${validationErrors.instagram ? styles.inputError : ''}`}
              placeholder="@username or instagram.com/username"
              aria-describedby={validationErrors.instagram ? 'instagram-error' : undefined}
            />
            {validationErrors.instagram && (
              <div id="instagram-error" className={styles.fieldError} role="alert">
                {validationErrors.instagram}
              </div>
            )}
          </div>

          {mode === 'edit' && initial?.id && (
            <>
              <div className={styles.clientQrSection}>
                <h3 className={styles.sectionTitle}>Client Pass Card</h3>
                <p className={styles.sectionDescription}>
                  Share this QR code or link with the parent to access their swimming pass
                </p>
                
                {loadingToken ? (
                  <div className={styles.loadingQr}>
                    <div className={styles.qrSpinner} />
                    <p>Generating QR code...</p>
                  </div>
                ) : passUrl ? (
                  <div className={styles.qrContainer}>
                    <div className={styles.qrCodeWrapper}>
                      <div ref={qrRef} className={styles.qrCode}></div>
                      <div className={styles.qrOverlay}>
                        <span className={styles.qrLabel}>Swimming Pass</span>
                      </div>
                    </div>
                    
                    <div className={styles.urlSection}>
                      <label className={styles.urlLabel}>Pass URL:</label>
                      <div className={styles.urlContainer}>
                        <input
                          type="text"
                          value={passUrl}
                          readOnly
                          className={styles.urlInput}
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(passUrl)}
                          className={styles.copyButton}
                          title="Copy link"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.qrActions}>
                      <button
                        type="button"
                        onClick={shareViaWebShare}
                        className={styles.shareButton}
                      >
                        <span className={styles.shareIcon}>📱</span>
                        <span className={styles.shareText}>
                          <span className={styles.shareLabel}>Share via Telegram</span>
                          <span className={styles.shareSubtext}>Send to parent</span>
                        </span>
                        <span className={styles.shareArrow}>→</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={downloadQR}
                        className={styles.downloadButton}
                      >
                        <span className={styles.downloadIcon}>💾</span>
                        Download QR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.qrError}>
                    <span className={styles.errorIcon}>⚠️</span>
                    Failed to generate QR code
                  </div>
                )}
              </div>

              <div className={styles.passesSection}>
                <h3 className={styles.sectionTitle}>Active Passes</h3>
                <p className={styles.sectionDescription}>
                  Current swimming passes for this client
                </p>
                
                {loadingPasses ? (
                  <div className={styles.loadingPasses}>
                    <div className={styles.passSpinner} />
                    <p>Loading passes...</p>
                  </div>
                ) : passes.length > 0 ? (
                  <div className={styles.passesList}>
                    {passes.map((pass) => (
                      <div key={pass.id} className={styles.passItem}>
                        <div className={styles.passInfo}>
                          <span className={styles.passRemaining}>{pass.remaining}</span>
                          <span className={styles.passSeparator}>/</span>
                          <span className={styles.passTotal}>{pass.planSize}</span>
                        </div>
                        <div className={styles.passDetails}>
                          <div className={styles.passType}>{pass.type}</div>
                          <div className={styles.passDate}>
                            {new Date(pass.purchasedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={styles.passProgress}>
                          <div 
                            className={styles.passProgressBar}
                            style={{ width: `${(pass.remaining / pass.planSize) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noPasses}>
                    <span className={styles.noPassesIcon}>🎫</span>
                    <p>No active passes found</p>
                    <p className={styles.noPassesHint}>
                      Create a pass for this client in the Passes section
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || hasValidationErrors}
              className={styles.submitButton}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}