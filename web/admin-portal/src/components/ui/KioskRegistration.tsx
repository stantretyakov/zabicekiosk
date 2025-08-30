import React, { useState, useEffect } from 'react';
import styles from './KioskRegistration.module.css';
import { fetchJSON } from '../../lib/api';

export type KioskRegistrationProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

interface KioskSettings {
  adminPin: string;
  maxIdleMinutes: number;
  autoLogoutEnabled: boolean;
  soundEnabled: boolean;
  cameraFacingMode: 'user' | 'environment';
  scanCooldownSec: number;
}

interface RegisteredKiosk {
  id: string;
  registeredAt: string;
  lastSeen: string;
  status: 'online' | 'offline';
  version?: string;
  location?: string;
}

export default function KioskRegistration({ open, onClose, onSaved }: KioskRegistrationProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<KioskSettings>({
    adminPin: '',
    maxIdleMinutes: 30,
    autoLogoutEnabled: true,
    soundEnabled: true,
    cameraFacingMode: 'environment',
    scanCooldownSec: 2,
  });

  const [registeredKiosks, setRegisteredKiosks] = useState<RegisteredKiosk[]>([]);

  useEffect(() => {
    if (open) {
      loadKioskSettings();
    }
  }, [open]);

  const loadKioskSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In dev mode, use mock data
      if (import.meta.env.DEV) {
        const mockSettings: KioskSettings = {
          adminPin: generatePin(),
          maxIdleMinutes: 30,
          autoLogoutEnabled: true,
          soundEnabled: true,
          cameraFacingMode: 'environment',
          scanCooldownSec: 2,
        };
        
        const mockKiosks: RegisteredKiosk[] = [
          {
            id: 'kiosk-001',
            registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'online',
            version: '1.0.0',
            location: 'Main Entrance'
          },
          {
            id: 'kiosk-002',
            registeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'offline',
            version: '1.0.0',
            location: 'Pool Area'
          }
        ];
        
        setTimeout(() => {
          setSettings(mockSettings);
          setRegisteredKiosks(mockKiosks);
          setLoading(false);
        }, 800);
        return;
      }
      
      const response = await fetchJSON<{ settings: KioskSettings; kiosks: Omit<RegisteredKiosk, 'status'>[] }>(
        '/admin/kiosks/settings'
      );
      setSettings(response.settings);
      setRegisteredKiosks(
        response.kiosks.map(k => ({ ...k, status: getKioskStatus(k.lastSeen) }))
      );
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load kiosk settings');
      setLoading(false);
    }
  };

  const generatePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const regeneratePin = () => {
    setSettings(prev => ({
      ...prev,
      adminPin: generatePin()
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // In dev mode, simulate save
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess('Kiosk settings saved successfully!');
        setTimeout(() => {
          setSuccess(null);
          onSaved();
          onClose();
        }, 1500);
        return;
      }
      
      await fetchJSON('/admin/kiosks/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      setSuccess('Kiosk settings saved successfully!');
      setTimeout(() => {
        setSuccess(null);
        onSaved();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save kiosk settings');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getKioskStatus = (lastSeen: string): 'online' | 'offline' => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffInMinutes < 5 ? 'online' : 'offline';
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Kiosk Management</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✅</span>
              {success}
            </div>
          )}

          {loading ? (
            <div className={styles.loadingKiosks}>
              <div className={styles.loadingSpinner} />
              <p>Loading kiosk settings...</p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className={styles.instructionsCard}>
                <h3 className={styles.instructionsTitle}>
                  <span className={styles.instructionsIcon}>📋</span>
                  Setup Instructions
                </h3>
                <ol className={styles.instructionsList}>
                  <li className={styles.instructionItem}>
                    <span className={styles.instructionNumber}>1</span>
                    <div className={styles.instructionText}>
                      Configure the admin PIN below and save settings
                    </div>
                  </li>
                  <li className={styles.instructionItem}>
                    <span className={styles.instructionNumber}>2</span>
                    <div className={styles.instructionText}>
                      Open the kiosk application and enter the admin PIN to access settings
                    </div>
                  </li>
                  <li className={styles.instructionItem}>
                    <span className={styles.instructionNumber}>3</span>
                    <div className={styles.instructionText}>
                      The kiosk will automatically register and appear in the list below
                    </div>
                  </li>
                </ol>
              </div>

              {/* Admin PIN Configuration */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🔐</span>
                  Admin PIN
                </h3>
                <p className={styles.sectionDescription}>
                  PIN code required to access kiosk admin settings
                </p>

                <div className={styles.pinDisplay}>
                  <div className={styles.pinLabel}>Current Admin PIN</div>
                  <div className={styles.pinValue}>{settings.adminPin}</div>
                  <div className={styles.pinActions}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.adminPin)}
                      className={styles.copyPinButton}
                    >
                      📋 Copy PIN
                    </button>
                    <button
                      type="button"
                      onClick={regeneratePin}
                      className={styles.regeneratePinButton}
                    >
                      🔄 Generate New
                    </button>
                  </div>
                </div>
              </section>

              {/* Kiosk Settings */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>⚙️</span>
                  Kiosk Configuration
                </h3>
                <p className={styles.sectionDescription}>
                  Configure default behavior for all kiosk devices
                </p>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Idle Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.maxIdleMinutes}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        maxIdleMinutes: parseInt(e.target.value) || 30
                      }))}
                      className={styles.input}
                      min="1"
                      max="120"
                      disabled={saving}
                    />
                    <p className={styles.fieldHint}>
                      Time before kiosk returns to main screen
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Scan Cooldown (seconds)</label>
                    <input
                      type="number"
                      value={settings.scanCooldownSec}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        scanCooldownSec: parseInt(e.target.value) || 2
                      }))}
                      className={styles.input}
                      min="1"
                      max="10"
                      disabled={saving}
                    />
                    <p className={styles.fieldHint}>
                      Minimum time between consecutive scans
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Default Camera</label>
                    <select
                      value={settings.cameraFacingMode}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        cameraFacingMode: e.target.value as 'user' | 'environment'
                      }))}
                      className={styles.select}
                      disabled={saving}
                    >
                      <option value="environment">Back Camera</option>
                      <option value="user">Front Camera</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <input
                        type="checkbox"
                        checked={settings.autoLogoutEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          autoLogoutEnabled: e.target.checked
                        }))}
                        disabled={saving}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Auto Logout
                    </label>
                    <p className={styles.fieldHint}>
                      Automatically logout admin after idle time
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          soundEnabled: e.target.checked
                        }))}
                        disabled={saving}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Sound Effects
                    </label>
                    <p className={styles.fieldHint}>
                      Play beep sounds for scan feedback
                    </p>
                  </div>
                </div>
              </section>

              {/* Registered Kiosks */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📱</span>
                  Registered Kiosks
                </h3>
                <p className={styles.sectionDescription}>
                  Devices that have connected to the system
                </p>

                {registeredKiosks.length > 0 ? (
                  <div className={styles.kiosksList}>
                    {registeredKiosks.map((kiosk) => (
                      <div key={kiosk.id} className={styles.kioskItem}>
                        <div className={styles.kioskHeader}>
                          <div className={styles.kioskId}>{kiosk.id}</div>
                          <div className={styles.kioskStatus}>
                            <div className={`${styles.statusDot} ${styles[getKioskStatus(kiosk.lastSeen)]}`} />
                            {getKioskStatus(kiosk.lastSeen)}
                          </div>
                        </div>
                        
                        <div className={styles.kioskDetails}>
                          <div className={styles.kioskDetail}>
                            <span className={styles.detailLabel}>Registered</span>
                            <span className={styles.detailValue}>
                              {new Date(kiosk.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={styles.kioskDetail}>
                            <span className={styles.detailLabel}>Last Seen</span>
                            <span className={styles.detailValue}>
                              {formatTimeAgo(kiosk.lastSeen)}
                            </span>
                          </div>
                          {kiosk.version && (
                            <div className={styles.kioskDetail}>
                              <span className={styles.detailLabel}>Version</span>
                              <span className={styles.detailValue}>{kiosk.version}</span>
                            </div>
                          )}
                          {kiosk.location && (
                            <div className={styles.kioskDetail}>
                              <span className={styles.detailLabel}>Location</span>
                              <span className={styles.detailValue}>{kiosk.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noKiosks}>
                    <span className={styles.noKiosksIcon}>📱</span>
                    <p>No kiosks registered yet</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Kiosks will appear here after they connect to the system
                    </p>
                  </div>
                )}
              </section>
            </>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className={styles.saveButton}
            >
              {saving ? (
                <>
                  <div className={styles.saveSpinner} />
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}