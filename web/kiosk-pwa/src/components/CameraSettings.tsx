import React, { useState, useEffect } from 'react';
import styles from './CameraSettings.module.css';

interface CameraSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentPosition: 'left' | 'right' | 'top';
  onPositionChange: (position: 'left' | 'right' | 'top') => void;
  adminPin: string;
}

export default function CameraSettings({ 
  isOpen, 
  onClose, 
  currentPosition, 
  onPositionChange,
  adminPin 
}: CameraSettingsProps) {
  const [step, setStep] = useState<'pin' | 'settings'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempPosition, setTempPosition] = useState(currentPosition);

  useEffect(() => {
    if (isOpen) {
      setStep('pin');
      setPinInput('');
      setPinError(null);
      setTempPosition(currentPosition);
    }
  }, [isOpen, currentPosition]);

  const verifyPin = async () => {
    if (!pinInput.trim()) {
      setPinError('Please enter the admin PIN');
      return;
    }

    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('PIN must be 4 digits');
      return;
    }

    try {
      setLoading(true);
      setPinError(null);
      
      // In dev mode, accept any 4-digit PIN
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep('settings');
        return;
      }
      
      // Verify PIN
      if (pinInput !== adminPin) {
        setPinError('Invalid PIN');
        return;
      }
      
      setStep('settings');
    } catch (err: any) {
      setPinError('Failed to verify PIN');
      console.error('PIN verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    onPositionChange(tempPosition);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && step === 'pin') {
      e.preventDefault();
      verifyPin();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step === 'pin' ? (
          <div className={styles.pinStep}>
            <div className={styles.header}>
              <div className={styles.icon}>🔐</div>
              <h2 className={styles.title}>Admin Access Required</h2>
              <p className={styles.subtitle}>
                Enter admin PIN to access camera settings
              </p>
            </div>

            {pinError && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {pinError}
              </div>
            )}

            <div className={styles.pinSection}>
              <label className={styles.pinLabel}>Admin PIN</label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                className={`${styles.pinInput} ${pinError ? styles.inputError : ''}`}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                pattern="\d{4}"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={verifyPin}
                disabled={loading || !pinInput.trim()}
                className={styles.verifyButton}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <span className={styles.verifyIcon}>🔓</span>
                    Verify PIN
                  </>
                )}
              </button>
            </div>

            {import.meta.env.DEV && (
              <div className={styles.devHint}>
                <div className={styles.devIcon}>🚧</div>
                <div className={styles.devText}>
                  <strong>Development Mode</strong>
                  <span>Any 4-digit PIN will work</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.settingsStep}>
            <div className={styles.header}>
              <div className={styles.icon}>📷</div>
              <h2 className={styles.title}>Camera Settings</h2>
              <p className={styles.subtitle}>
                Configure scanner position and camera settings
              </p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Scanner Position</label>
                <p className={styles.description}>
                  Choose where the camera scanner should be positioned on the screen
                </p>
                
                <div className={styles.positionGrid}>
                  {(['left', 'right', 'top'] as const).map((position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => setTempPosition(position)}
                      className={`${styles.positionButton} ${
                        tempPosition === position ? styles.selected : ''
                      }`}
                    >
                      <span className={styles.positionIcon}>
                        {position === 'left' && '⬅️'}
                        {position === 'right' && '➡️'}
                        {position === 'top' && '⬆️'}
                      </span>
                      <span className={styles.positionLabel}>
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </span>
                      <span className={styles.positionDescription}>
                        {position === 'left' && 'Scanner on left side'}
                        {position === 'right' && 'Scanner on right side'}
                        {position === 'top' && 'Scanner at top'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.previewSection}>
                <h3 className={styles.previewTitle}>Layout Preview</h3>
                <div className={`${styles.layoutPreview} ${styles[`preview${tempPosition.charAt(0).toUpperCase() + tempPosition.slice(1)}`]}`}>
                  <div className={styles.previewScanner}>
                    <span className={styles.previewScannerIcon}>📷</span>
                    <span className={styles.previewScannerLabel}>Scanner</span>
                  </div>
                  <div className={styles.previewContent}>
                    <span className={styles.previewContentIcon}>📋</span>
                    <span className={styles.previewContentLabel}>Content Area</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => setStep('pin')}
                className={styles.backButton}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className={styles.saveButton}
              >
                <span className={styles.saveIcon}>💾</span>
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}