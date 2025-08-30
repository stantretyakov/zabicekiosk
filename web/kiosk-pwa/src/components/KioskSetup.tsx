import React, { useState, useEffect } from 'react';
import styles from './KioskSetup.module.css';

interface KioskConfig {
  kioskId: string;
  location: string;
  description: string;
  adminPin: string;
  scannerPosition: 'left' | 'right' | 'top';
  soundEnabled: boolean;
  cameraFacingMode: 'user' | 'environment';
  scanCooldownSec: number;
  maxIdleMinutes: number;
}

interface KioskSetupProps {
  onConfigured: (config: KioskConfig) => void;
  onCancel?: () => void;
}

export default function KioskSetup({ onConfigured, onCancel }: KioskSetupProps) {
  const [step, setStep] = useState<'pin' | 'config'>('pin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<Omit<KioskConfig, 'adminPin'>>({
    kioskId: '',
    location: '',
    description: '',
    scannerPosition: 'left',
    soundEnabled: true,
    cameraFacingMode: 'environment',
    scanCooldownSec: 2,
    maxIdleMinutes: 30,
  });

  useEffect(() => {
    // Generate unique kiosk ID
    const existingId = localStorage.getItem('kioskId');
    if (existingId) {
      setConfig(prev => ({ ...prev, kioskId: existingId }));
    } else {
      const newId = `kiosk-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
      setConfig(prev => ({ ...prev, kioskId: newId }));
      localStorage.setItem('kioskId', newId);
    }
  }, []);

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
        await new Promise(resolve => setTimeout(resolve, 800));
        setStep('config');
        return;
      }
      
      // Verify PIN with backend
      const response = await fetch('/api/v1/admin/kiosks/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setPinError(data.message || 'Invalid PIN');
        return;
      }
      
      setStep('config');
    } catch (err: any) {
      setPinError('Failed to verify PIN. Please check your connection.');
      console.error('PIN verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config.location.trim()) {
      setError('Location is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const fullConfig: KioskConfig = {
        ...config,
        adminPin: pinInput,
        location: config.location.trim(),
        description: config.description.trim(),
      };
      
      // In dev mode, just save to localStorage
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.setItem('kioskConfig', JSON.stringify(fullConfig));
        onConfigured(fullConfig);
        return;
      }
      
      // Save configuration to backend
      const response = await fetch('/api/v1/admin/kiosks/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to save configuration');
        return;
      }
      
      // Save to localStorage for future use
      localStorage.setItem('kioskConfig', JSON.stringify(fullConfig));
      onConfigured(fullConfig);
    } catch (err: any) {
      setError('Failed to save configuration. Please check your connection.');
      console.error('Configuration save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyPin();
    }
  };

  const handleConfigKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveConfiguration();
    }
  };

  if (step === 'pin') {
    return (
      <div className={styles.overlay}>
        <div className={styles.setupCard}>
          <div className={styles.setupHeader}>
            <div className={styles.setupIcon}>🔐</div>
            <h1 className={styles.setupTitle}>Kiosk Setup</h1>
            <p className={styles.setupSubtitle}>
              Enter the admin PIN to configure this kiosk
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
              onKeyDown={handlePinKeyDown}
              className={`${styles.pinInput} ${pinError ? styles.inputError : ''}`}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              pattern="\d{4}"
              autoFocus
              disabled={loading}
            />
            <p className={styles.pinHint}>
              Get the PIN from your administrator or the admin portal
            </p>
          </div>

          <div className={styles.setupActions}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            )}
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
      </div>
    );
  }

  return (
    <div className={styles.overlay} onKeyDown={handleConfigKeyDown}>
      <div className={styles.configCard}>
        <div className={styles.configHeader}>
          <div className={styles.configIcon}>⚙️</div>
          <h1 className={styles.configTitle}>Kiosk Configuration</h1>
          <p className={styles.configSubtitle}>
            Configure this kiosk device settings
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.configForm}>
          {/* Basic Information */}
          <section className={styles.configSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📱</span>
              Device Information
            </h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Kiosk ID</label>
                <input
                  type="text"
                  value={config.kioskId}
                  readOnly
                  className={styles.readonlyInput}
                />
                <p className={styles.fieldHint}>
                  Unique identifier for this device
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Location *</label>
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                  className={styles.input}
                  placeholder="e.g., Main Entrance, Pool Area"
                  required
                  disabled={loading}
                />
                <p className={styles.fieldHint}>
                  Physical location of this kiosk
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <input
                  type="text"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  className={styles.input}
                  placeholder="e.g., Check-in kiosk for swimming sessions"
                  disabled={loading}
                />
                <p className={styles.fieldHint}>
                  Optional description for this kiosk
                </p>
              </div>
            </div>
          </section>

          {/* Scanner Settings */}
          <section className={styles.configSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📷</span>
              Scanner Settings
            </h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Scanner Position</label>
                <div className={styles.positionGrid}>
                  {(['left', 'right', 'top'] as const).map((position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, scannerPosition: position }))}
                      className={`${styles.positionButton} ${
                        config.scannerPosition === position ? styles.selected : ''
                      }`}
                      disabled={loading}
                    >
                      <span className={styles.positionIcon}>
                        {position === 'left' && '⬅️'}
                        {position === 'right' && '➡️'}
                        {position === 'top' && '⬆️'}
                      </span>
                      {position.charAt(0).toUpperCase() + position.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Default Camera</label>
                <select
                  value={config.cameraFacingMode}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    cameraFacingMode: e.target.value as 'user' | 'environment' 
                  }))}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="environment">Back Camera (Recommended)</option>
                  <option value="user">Front Camera</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Scan Cooldown (seconds)</label>
                <input
                  type="number"
                  value={config.scanCooldownSec}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    scanCooldownSec: parseInt(e.target.value) || 2 
                  }))}
                  className={styles.input}
                  min="1"
                  max="10"
                  disabled={loading}
                />
                <p className={styles.fieldHint}>
                  Minimum time between consecutive scans
                </p>
              </div>
            </div>
          </section>

          {/* Behavior Settings */}
          <section className={styles.configSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🎛️</span>
              Behavior Settings
            </h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Idle Timeout (minutes)</label>
                <input
                  type="number"
                  value={config.maxIdleMinutes}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    maxIdleMinutes: parseInt(e.target.value) || 30 
                  }))}
                  className={styles.input}
                  min="1"
                  max="120"
                  disabled={loading}
                />
                <p className={styles.fieldHint}>
                  Time before returning to main screen
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={config.soundEnabled}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      soundEnabled: e.target.checked 
                    }))}
                    className={styles.toggleInput}
                    disabled={loading}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span className={styles.toggleText}>Sound Effects</span>
                </label>
                <p className={styles.fieldHint}>
                  Play beep sounds for scan feedback
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.configActions}>
          <button
            type="button"
            onClick={() => setStep('pin')}
            disabled={loading}
            className={styles.backButton}
          >
            ← Back to PIN
          </button>
          <button
            type="button"
            onClick={saveConfiguration}
            disabled={loading || !config.location.trim()}
            className={styles.saveButton}
          >
            {loading ? (
              <>
                <div className={styles.spinner} />
                Configuring...
              </>
            ) : (
              <>
                <span className={styles.saveIcon}>💾</span>
                Complete Setup
              </>
            )}
          </button>
        </div>

        {import.meta.env.DEV && (
          <div className={styles.devInfo}>
            <div className={styles.devIcon}>🚧</div>
            <div className={styles.devText}>
              <strong>Development Mode</strong>
              <span>Configuration will be saved locally</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}