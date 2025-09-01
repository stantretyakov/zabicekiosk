import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import SellPassForm from './SellPassForm';
import { useTranslation } from '../../lib/i18n';
import {
  getClientToken,
  listPasses,
  fetchSettings,
  type SettingsResponse,
} from '../../lib/api';
import styles from './ClientForm.module.css';
import type { PassWithClient, Client as ApiClient } from '../../types';

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
  const { t } = useTranslation();
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
  const [showSellPassForm, setShowSellPassForm] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);
  const ticketCanvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<SettingsResponse>({});

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

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

  // Generate ticket when values change (for immediate preview)
  useEffect(() => {
    if (mode === 'edit' && passUrl && values.parentName && values.childName) {
      setTimeout(() => {
        generateTicketCard(passUrl, values.parentName, values.childName);
      }, 100);
    }
  }, [passUrl, values.parentName, values.childName, mode, settings]);

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
    try {
      setLoadingToken(true);
      const { token } = await getClientToken(clientId);
      const baseUrl =
        import.meta.env.VITE_PARENT_PORTAL_URL ||
        window.location.origin.replace(/admin[^.]*/, 'parent-web');
      const url = `${baseUrl}?token=${token}`;
      setPassUrl(url);

      // Generate QR code
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

      // Generate ticket card
      setTimeout(() => {
        generateTicketCard(url, values.parentName, values.childName);
      }, 100);
    } catch (error) {
      console.error('Failed to load client token:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  const handleSellPassSuccess = async () => {
    if (initial?.id) {
      await loadClientPasses(initial.id as string);
    }
  };

  const generateTicketCard = async (url: string, parentName: string, childName: string) => {
    if (!ticketCanvasRef.current) return;

    const canvas = ticketCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high quality
    canvas.width = 900;
    canvas.height = 600;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0F1115');
    gradient.addColorStop(0.5, '#12161C');
    gradient.addColorStop(1, '#171E27');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Accent border
    ctx.strokeStyle = '#2BE090';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Header section
    ctx.fillStyle = '#2BE090';
    ctx.fillRect(0, 0, canvas.width, 90);

    // Business logo/icon
    ctx.fillStyle = '#0F1115';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏊‍♀️', 40, 60);

    // Business name
    ctx.fillStyle = '#0F1115';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(settings.businessName || 'Swimming Academy', 100, 45);

    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('Professional Swimming Lessons', 100, 70);

    // Client information
    ctx.fillStyle = '#EAEFF5';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Swimming Pass', 40, 140);

    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = '#2BE090';
    ctx.fillText(`Parent: ${parentName}`, 40, 180);

    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#4AD6FF';
    ctx.fillText(`Child: ${childName}`, 40, 210);

    // Pass type indicator
    ctx.fillStyle = '#2BE090';
    ctx.fillRect(40, 240, 250, 3);
    
    ctx.fillStyle = '#EAEFF5';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('Swimming Pass Access', 40, 270);
    
    // Business information
    ctx.fillStyle = '#9AA5B1';
    ctx.font = '16px Inter, sans-serif';
    let infoY = 310;
    const lineHeight = 25;
    if (settings.businessAddress) {
      ctx.fillText(`📍 ${settings.businessAddress}`, 40, infoY);
      infoY += lineHeight;
    }
    if (settings.businessPhone) {
      ctx.fillText(`📞 ${settings.businessPhone}`, 40, infoY);
      infoY += lineHeight;
    }
    if (settings.businessEmail) {
      ctx.fillText(`📧 ${settings.businessEmail}`, 40, infoY);
      infoY += lineHeight;
    }
    if (settings.businessTelegram) {
      ctx.fillText(`💬 ${settings.businessTelegram}`, 40, infoY);
      infoY += lineHeight;
    }
    if (settings.businessInstagram) {
      ctx.fillText(`📸 ${settings.businessInstagram}`, 40, infoY);
    }

    // Instructions
    ctx.fillStyle = '#EAEFF5';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('How to use:', 40, 430);
    
    ctx.fillStyle = '#9AA5B1';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('1. Scan QR code or visit the link', 40, 455);
    ctx.fillText('2. Show digital pass at the facility', 40, 480);
    ctx.fillText('3. Scan at kiosk to check in for sessions', 40, 505);

    // QR Code area
    const qrSize = 200;
    const qrX = canvas.width - qrSize - 50;
    const qrY = 140;

    // QR background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
    ctx.strokeStyle = '#2BE090';
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);

    // QR code placeholder with text
    ctx.fillStyle = '#0F1115';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2 - 25);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Scan for Digital Pass', qrX + qrSize/2, qrY + qrSize/2);
    ctx.fillText(url.slice(-20), qrX + qrSize/2, qrY + qrSize/2 + 25);
    
    // Generate and draw actual QR code
    setTimeout(() => {
      try {
        const qrCodeStyling = new QRCodeStyling({
          width: qrSize,
          height: qrSize,
          data: url,
          dotsOptions: {
            color: '#0F1115',
            type: 'rounded',
          },
          backgroundOptions: {
            color: '#FFFFFF',
          },
          cornersSquareOptions: {
            color: '#2BE090',
            type: 'extra-rounded',
          },
          cornersDotOptions: {
            color: '#2BE090',
            type: 'dot',
          },
        });

        // Create temporary div for QR generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        qrCodeStyling.append(tempDiv);
        
        // Wait for QR code to render, then draw on canvas
        setTimeout(() => {
          const qrCanvas = tempDiv.querySelector('canvas');
          if (qrCanvas) {
            // Clear QR area and redraw with actual QR
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(qrX, qrY, qrSize, qrSize);
            ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
          }
          document.body.removeChild(tempDiv);
        }, 200);
      } catch (err) {
        console.error('Failed to generate QR for ticket:', err);
      }
    }, 50);

    // QR label
    ctx.fillStyle = '#EAEFF5';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan for Digital Pass', qrX + qrSize/2, qrY + qrSize + 35);

    // Footer
    ctx.fillStyle = '#2BE090';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
    
    ctx.fillStyle = '#0F1115';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Keep this pass safe • Valid for swimming sessions', canvas.width/2, canvas.height - 40);
    
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, canvas.width/2, canvas.height - 20);
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

  const downloadTicket = () => {
    if (!ticketCanvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${values.childName.replace(/\s+/g, '_')}_swimming_ticket.png`;
    link.href = ticketCanvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  const shareTicketImage = async () => {
    if (!ticketCanvasRef.current) return;
    
    try {
      // Convert canvas to blob
      ticketCanvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `${values.childName.replace(/\s+/g, '_')}_swimming_ticket.png`, {
          type: 'image/png'
        });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Swimming Pass - ${values.childName}`,
            text: `Swimming pass ticket for ${values.childName}`,
            files: [file]
          });
        } else {
          // Fallback to download
          downloadTicket();
        }
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Failed to share ticket image:', err);
      downloadTicket();
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
        if (value) {
          const handle = value
            .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
            .replace(/[\/?].*$/, '');
          if (!/^@?[A-Za-z0-9._]{1,30}$/.test(handle)) {
            return 'Invalid instagram handle';
          }
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
      instagram: values.instagram
        .trim()
        .replace(/^@/, '')
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
        .replace(/[\/?].*$/, '') || undefined,
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
            {mode === 'create' ? t('addClient') : t('editClient')}
          </h2>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="parentName" className={styles.label}>
              {t('parentName')} *
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
              {t('childName')} *
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
              {t('phone')}
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
              {t('telegram')}
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
              {t('instagram')}
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
                <h3 className={styles.sectionTitle}>{t('clientPassCard')}</h3>
                <p className={styles.sectionDescription}>
                  {t('sharePassCard')}
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
                      <label className={styles.urlLabel}>{t('passUrl')}</label>
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
                          title={t('copyLink')}
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
                          <span className={styles.shareLabel}>{t('shareViaTelegram')}</span>
                          <span className={styles.shareSubtext}>{t('sendToParent')}</span>
                        </span>
                        <span className={styles.shareArrow}>→</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={downloadQR}
                        className={styles.downloadButton}
                      >
                        <span className={styles.downloadIcon}>💾</span>
                        {t('downloadQr')}
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

              <div className={styles.ticketSection}>
                <h3 className={styles.sectionTitle}>{t('swimmingPassTicket')}</h3>
                <p className={styles.sectionDescription}>
                  {t('professionalTicket')}
                </p>
                
                {loadingToken ? (
                  <div className={styles.loadingTicket}>
                    <div className={styles.ticketSpinner} />
                    <p>Generating ticket...</p>
                  </div>
                ) : passUrl ? (
                  <div className={styles.ticketContainer}>
                    <div className={styles.ticketPreview}>
                      <canvas
                        ref={ticketCanvasRef}
                        className={styles.ticketCanvas}
                        width="800"
                        height="500"
                      />
                      <div className={styles.ticketOverlay}>
                        <span className={styles.ticketLabel}>Swimming Pass Ticket</span>
                      </div>
                    </div>
                    
                    <div className={styles.ticketActions}>
                      <button
                        type="button"
                        onClick={shareTicketImage}
                        className={styles.shareTicketButton}
                      >
                        <span className={styles.shareIcon}>📤</span>
                        <span className={styles.shareText}>
                          <span className={styles.shareLabel}>{t('shareTicket')}</span>
                          <span className={styles.shareSubtext}>{t('sendAsImage')}</span>
                        </span>
                        <span className={styles.shareArrow}>→</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={downloadTicket}
                        className={styles.downloadTicketButton}
                      >
                        <span className={styles.downloadIcon}>🖨️</span>
                        {t('printTicket')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.ticketError}>
                    <span className={styles.errorIcon}>⚠️</span>
                    Failed to generate ticket
                  </div>
                )}
              </div>
              <div className={styles.passesSection}>
                <h3 className={styles.sectionTitle}>{t('activePasses')}</h3>
                <p className={styles.sectionDescription}>
                  {t('currentSwimmingPasses')}
                </p>
                
                {loadingPasses ? (
                  <div className={styles.loadingPasses}>
                    <div className={styles.passSpinner} />
                    <p>{t('loadingPasses')}</p>
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
                    <p>{t('noActivePassesFound')}</p>
                  </div>
                )}
                <div className={styles.addPassForm}>
                  <button
                    type="button"
                    onClick={() => setShowSellPassForm(true)}
                    className={styles.btnSellPass}
                  >
                    <span className={styles.addIcon}>+</span>
                    {t('sellNewPass')}
                  </button>
                </div>
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || hasValidationErrors}
              className={styles.submitButton}
            >
              {submitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
        
        {showSellPassForm && initial?.id && (
          <SellPassForm
            open={showSellPassForm}
            onClose={() => setShowSellPassForm(false)}
            onSuccess={handleSellPassSuccess}
            preselectedClient={initial as ApiClient}
          />
        )}
      </div>
    </div>
  );
}