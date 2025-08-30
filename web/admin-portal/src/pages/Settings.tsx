import React, { useState, useEffect } from 'react';
import styles from './Settings.module.css';
import { fetchSettings, updateSettings } from '../lib/api';
import KioskRegistration from '../components/ui/KioskRegistration';

interface PriceSettings {
  dropInRSD: number;
  currency: string;
}

interface PassSettings {
  id: string;
  name: string;
  sessions: number;
  priceRSD: number;
  validityDays: number;
  active: boolean;
}

interface GeneralSettings {
  cooldownSec: number;
  maxDailyRedeems: number;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessTelegram: string;
  businessInstagram: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKioskDialog, setShowKioskDialog] = useState(false);

  // Settings state
  const [priceSettings, setPriceSettings] = useState<PriceSettings>({
    dropInRSD: 1500,
    currency: 'RSD'
  });

  const [passSettings, setPassSettings] = useState<PassSettings[]>([
    { id: '1', name: '5-Session Pass', sessions: 5, priceRSD: 6000, validityDays: 30, active: true },
    { id: '2', name: '10-Session Pass', sessions: 10, priceRSD: 11000, validityDays: 45, active: true },
    { id: '3', name: '20-Session Pass', sessions: 20, priceRSD: 20000, validityDays: 60, active: true },
  ]);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    cooldownSec: 5,
    maxDailyRedeems: 2,
    businessName: 'Swimming Academy',
    businessAddress: 'Belgrade, Serbia',
    businessPhone: '+381 60 123 4567',
    businessEmail: 'info@swimming-academy.rs',
    businessTelegram: '@Tretiakovaanny',
    businessInstagram: '@swimmingacademy'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await fetchSettings();
      setPriceSettings({
        dropInRSD: settings.prices?.dropInRSD ?? 0,
        currency: settings.prices?.currency ?? 'RSD',
      });
      setPassSettings(settings.passes || []);
      setGeneralSettings({
        cooldownSec: settings.cooldownSec ?? 5,
        maxDailyRedeems: settings.maxDailyRedeems ?? 2,
        businessName: settings.businessName ?? '',
        businessAddress: settings.businessAddress ?? '',
        businessPhone: settings.businessPhone ?? '',
        businessEmail: settings.businessEmail ?? '',
        businessTelegram: settings.businessTelegram ?? '',
        businessInstagram: settings.businessInstagram ?? '',
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        prices: priceSettings,
        passes: passSettings,
        ...generalSettings,
      };
      const saved = await updateSettings(payload);
      setPriceSettings({
        dropInRSD: saved.prices?.dropInRSD ?? priceSettings.dropInRSD,
        currency: saved.prices?.currency ?? priceSettings.currency,
      });
      setPassSettings(saved.passes || passSettings);
      setGeneralSettings({
        cooldownSec: saved.cooldownSec ?? generalSettings.cooldownSec,
        maxDailyRedeems: saved.maxDailyRedeems ?? generalSettings.maxDailyRedeems,
        businessName: saved.businessName ?? generalSettings.businessName,
        businessAddress: saved.businessAddress ?? generalSettings.businessAddress,
        businessPhone: saved.businessPhone ?? generalSettings.businessPhone,
        businessEmail: saved.businessEmail ?? generalSettings.businessEmail,
        businessTelegram: saved.businessTelegram ?? generalSettings.businessTelegram,
        businessInstagram: saved.businessInstagram ?? generalSettings.businessInstagram,
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addNewPass = () => {
    const newPass: PassSettings = {
      id: Date.now().toString(),
      name: 'New Pass',
      sessions: 1,
      priceRSD: 1500,
      validityDays: 30,
      active: true
    };
    setPassSettings([...passSettings, newPass]);
  };

  const updatePass = (id: string, updates: Partial<PassSettings>) => {
    setPassSettings(passes => 
      passes.map(pass => pass.id === id ? { ...pass, ...updates } : pass)
    );
  };

  const deletePass = (id: string) => {
    if (confirm('Are you sure you want to delete this pass?')) {
      setPassSettings(passes => passes.filter(pass => pass.id !== id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Configure passes, prices, and business settings</p>
      </div>

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

      <div className={styles.content}>
        {/* Price Settings */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💰</span>
              Price Settings
            </h2>
            <p className={styles.sectionDescription}>
              Configure drop-in session pricing and currency
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Drop-in Session Price</label>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    value={priceSettings.dropInRSD}
                    onChange={(e) => setPriceSettings(prev => ({
                      ...prev,
                      dropInRSD: parseInt(e.target.value) || 0
                    }))}
                    className={styles.input}
                    min="0"
                    step="100"
                  />
                  <span className={styles.inputSuffix}>RSD</span>
                </div>
                <p className={styles.fieldHint}>
                  Price for single session without a pass
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Currency</label>
                <select
                  value={priceSettings.currency}
                  onChange={(e) => setPriceSettings(prev => ({
                    ...prev,
                    currency: e.target.value
                  }))}
                  className={styles.select}
                >
                  <option value="RSD">Serbian Dinar (RSD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Pass Settings */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🎫</span>
              Pass Configurations
            </h2>
            <p className={styles.sectionDescription}>
              Manage available pass types, pricing, and validity periods
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.passesHeader}>
              <h3 className={styles.passesTitle}>Available Passes</h3>
              <button
                onClick={addNewPass}
                className={styles.addButton}
                type="button"
              >
                <span className={styles.addIcon}>+</span>
                Add New Pass
              </button>
            </div>

            <div className={styles.passesList}>
              {passSettings.map((pass) => (
                <div key={pass.id} className={styles.passItem}>
                  <div className={styles.passForm}>
                    <div className={styles.passFormGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Pass Name</label>
                        <input
                          type="text"
                          value={pass.name}
                          onChange={(e) => updatePass(pass.id, { name: e.target.value })}
                          className={styles.input}
                          placeholder="e.g., 10-Session Pass"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Sessions</label>
                        <input
                          type="number"
                          value={pass.sessions}
                          onChange={(e) => updatePass(pass.id, { sessions: parseInt(e.target.value) || 1 })}
                          className={styles.input}
                          min="1"
                          max="100"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Price (RSD)</label>
                        <input
                          type="number"
                          value={pass.priceRSD}
                          onChange={(e) => updatePass(pass.id, { priceRSD: parseInt(e.target.value) || 0 })}
                          className={styles.input}
                          min="0"
                          step="100"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Validity (Days)</label>
                        <input
                          type="number"
                          value={pass.validityDays}
                          onChange={(e) => updatePass(pass.id, { validityDays: parseInt(e.target.value) || 30 })}
                          className={styles.input}
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>

                    <div className={styles.passStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Price per session:</span>
                        <span className={styles.statValue}>
                          {formatPrice(pass.priceRSD / pass.sessions)}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Total price:</span>
                        <span className={styles.statValue}>
                          {formatPrice(pass.priceRSD)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.passActions}>
                      <label className={styles.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={pass.active}
                          onChange={(e) => updatePass(pass.id, { active: e.target.checked })}
                          className={styles.toggleInput}
                        />
                        <span className={styles.toggleSlider}></span>
                        <span className={styles.toggleText}>Active</span>
                      </label>

                      <button
                        onClick={() => deletePass(pass.id)}
                        className={styles.deleteButton}
                        type="button"
                      >
                        <span className={styles.deleteIcon}>🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* General Settings */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚙️</span>
              General Settings
            </h2>
            <p className={styles.sectionDescription}>
              Configure business information and system behavior
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Business Name</label>
                <input
                  type="text"
                  value={generalSettings.businessName}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    businessName: e.target.value
                  }))}
                  className={styles.input}
                  placeholder="Your Business Name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Business Address</label>
                <input
                  type="text"
                  value={generalSettings.businessAddress}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    businessAddress: e.target.value
                  }))}
                  className={styles.input}
                  placeholder="Business Address"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Business Phone</label>
                <input
                  type="tel"
                  value={generalSettings.businessPhone}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    businessPhone: e.target.value
                  }))}
                  className={styles.input}
                  placeholder="+381 60 123 4567"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Business Email</label>
                <input
                  type="email"
                  value={generalSettings.businessEmail}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    businessEmail: e.target.value
                  }))}
                  className={styles.input}
                  placeholder="info@business.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Telegram</label>
                <input
                  type="text"
                  value={generalSettings.businessTelegram}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    businessTelegram: e.target.value
                  }))}
                  className={styles.input}
                  placeholder="@username"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Instagram</label>
                <input
                  type="text"
                  value={generalSettings.businessInstagram}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    businessInstagram: e.target.value
                  }))}
                  className={styles.input}
                  placeholder="@username"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Cooldown Period (seconds)</label>
                <input
                  type="number"
                  value={generalSettings.cooldownSec}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    cooldownSec: parseInt(e.target.value) || 5
                  }))}
                  className={styles.input}
                  min="1"
                  max="3600"
                />
                <p className={styles.fieldHint}>
                  Minimum time between consecutive scans
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Max Daily Redeems</label>
                <input
                  type="number"
                  value={generalSettings.maxDailyRedeems}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    maxDailyRedeems: parseInt(e.target.value) || 1
                  }))}
                  className={styles.input}
                  min="1"
                  max="10"
                />
                <p className={styles.fieldHint}>
                  Maximum sessions per client per day
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Kiosk Management */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📱</span>
              Kiosk Management
            </h2>
            <p className={styles.sectionDescription}>
              Manage kiosk devices and access settings
            </p>
          </div>

          <div className={styles.card}>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowKioskDialog(true)}
                className={styles.addButton}
                type="button"
              >
                <span className={styles.addIcon}>📱</span>
                Manage Kiosks
              </button>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted)', 
                margin: '1rem 0 0 0',
                fontStyle: 'italic'
              }}>
                Configure kiosk settings, generate admin PINs, and view registered devices
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className={styles.footer}>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={styles.saveButton}
          type="button"
        >
          {saving ? (
            <>
              <div className={styles.saveSpinner} />
              Saving...
            </>
          ) : (
            <>
              <span className={styles.saveIcon}>💾</span>
              Save All Settings
            </>
          )}
        </button>
      </div>

      <KioskRegistration
        open={showKioskDialog}
        onClose={() => setShowKioskDialog(false)}
        onSaved={() => {
          setSuccess('Kiosk settings updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        }}
      />
    </div>
  );
}