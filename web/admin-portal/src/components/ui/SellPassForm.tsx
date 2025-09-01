import React, { useState, useEffect, useRef } from 'react';
import { listClients, createPass, fetchSettings } from '../../lib/api';
import type { Client } from '../../types';
import { useTranslation } from '../../lib/i18n';
import styles from './SellPassForm.module.css';

export type SellPassFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClient?: Client;
};

interface PassType {
  id: string;
  name: string;
  sessions: number;
  priceRSD: number;
  validityDays: number;
}

const DEFAULT_PASS_TYPES: PassType[] = [
  { id: '1', name: '1 Session', sessions: 1, priceRSD: 1500, validityDays: 7 },
  { id: '5', name: '5 Sessions', sessions: 5, priceRSD: 6000, validityDays: 30 },
  { id: '10', name: '10 Sessions', sessions: 10, priceRSD: 11000, validityDays: 45 },
  { id: '20', name: '20 Sessions', sessions: 20, priceRSD: 20000, validityDays: 60 },
];

export default function SellPassForm({ open, onClose, onSuccess, preselectedClient }: SellPassFormProps) {
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [passTypes, setPassTypes] = useState<PassType[]>(DEFAULT_PASS_TYPES);
  const [selectedPassType, setSelectedPassType] = useState<string>(DEFAULT_PASS_TYPES[2].id);
  const [customPass, setCustomPass] = useState({
    sessions: 10,
    priceRSD: 11000,
    validityDays: 45,
  });
  const [useCustomPass, setUseCustomPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Reset form when opening
      if (preselectedClient) {
        setSelectedClient(preselectedClient);
      } else {
        setSelectedClient(null);
      }
      setSearchTerm('');
      setClients([]);
      setShowDropdown(false);
      setUseCustomPass(false);
      setError(null);

      // Load pass options
      loadPassTypes();

      // Focus search input
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [open, preselectedClient]);

  const loadPassTypes = async () => {
    try {
      const settings = await fetchSettings();
      const options = (settings.passes || []).filter((p: any) => p.active !== false);
      if (options.length > 0) {
        setPassTypes(options);
        setSelectedPassType(options[0].id);
      } else {
        setPassTypes(DEFAULT_PASS_TYPES);
        setSelectedPassType(DEFAULT_PASS_TYPES[0].id);
      }
    } catch (err) {
      console.error('Failed to load pass types:', err);
      setPassTypes(DEFAULT_PASS_TYPES);
      setSelectedPassType(DEFAULT_PASS_TYPES[0].id);
    }
  };

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length >= 2) {
      searchClients(term);
    } else {
      setClients([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const searchClients = async (term: string) => {
    try {
      setLoadingClients(true);
      const data = await listClients({
        active: 'true',
        pageSize: 100,
        orderBy: 'parentName',
      });
      const searchLower = normalize(term);
      const filtered = data.items.filter(c =>
        normalize(c.parentName).includes(searchLower) ||
        normalize(c.childName).includes(searchLower),
      );
      setClients(filtered);
      setShowDropdown(true);
    } catch (err) {
      console.error('Failed to search clients:', err);
      setClients([]);
      setShowDropdown(true);
    } finally {
      setLoadingClients(false);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm('');
    setShowDropdown(false);
    setClients([]);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setSearchTerm('');
    setTimeout(() => {
      searchRef.current?.focus();
    }, 100);
  };

  const getSelectedPassConfig = (): PassType => {
    if (useCustomPass) {
      return {
        id: 'custom',
        name: `${customPass.sessions} Sessions`,
        sessions: customPass.sessions,
        priceRSD: customPass.priceRSD,
        validityDays: customPass.validityDays,
      };
    }
    
    const defaultPass = passTypes.find(p => p.id === selectedPassType);
    return defaultPass || passTypes[0] || DEFAULT_PASS_TYPES[0];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculatePricePerSession = (total: number, sessions: number) => {
    return sessions > 0 ? total / sessions : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    const passConfig = getSelectedPassConfig();
    
    try {
      setSubmitting(true);
      setError(null);

      const res = await createPass({
        clientId: selectedClient.id,
        planSize: passConfig.sessions,
        purchasedAt: new Date().toISOString(),
        priceRSD: passConfig.priceRSD,
        validityDays: passConfig.validityDays,
      });

      if (res.status === 'exists') {
        setError('Client already has an active pass');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create pass');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  const selectedPassConfig = getSelectedPassConfig();

  return (
    <div className={styles.backdrop} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>{t('sellSwimmingPass')}</h2>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div className={styles.field}>
            <label className={styles.label}>{t('selectClient')}</label>
            
            {selectedClient ? (
              <div className={styles.selectedClient}>
                <div className={styles.selectedClientHeader}>
                  <div className={styles.selectedClientName}>
                    {selectedClient.parentName}
                  </div>
                  {!preselectedClient && (
                    <button
                      type="button"
                      onClick={clearClient}
                      className={styles.changeButton}
                    >
                      {t('change')}
                    </button>
                  )}
                </div>
                <div className={styles.selectedClientChild}>
                  <span>👶</span>
                  {selectedClient.childName}
                </div>
                {preselectedClient && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--muted)', 
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    {t('clientPreselected')}
                  </div>
                )}
              </div>
            ) : !preselectedClient ? (
              <div className={styles.clientSearch} ref={dropdownRef}>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchByParentOrChild')}
                  className={styles.searchInput}
                  disabled={submitting}
                />
                
                {showDropdown && (
                  <div className={styles.clientDropdown}>
                    {loadingClients ? (
                      <div className={styles.loadingOption}>
                        <div className={styles.loadingSpinner} />
                        {t('loading')}
                      </div>
                    ) : clients.length > 0 ? (
                      clients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => selectClient(client)}
                          className={styles.clientOption}
                        >
                          <div className={styles.clientName}>
                            {client.parentName}
                          </div>
                          <div className={styles.clientChild}>
                            <span>👶</span>
                            {client.childName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noResults}>
                        Клиенты не найдены
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '1rem',
                background: 'var(--panel-2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius)',
                color: 'var(--muted)',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Загрузка информации о клиенте...
              </div>
            )}
          </div>

          {/* Pass Type Selection */}
          <div className={styles.field}>
            <label className={styles.label}>{t('passType')}</label>
            
            <div className={styles.passTypeGrid}>
              {passTypes.map((passType) => (
                <div
                  key={passType.id}
                  onClick={() => {
                    setSelectedPassType(passType.id);
                    setUseCustomPass(false);
                  }}
                  className={`${styles.passTypeOption} ${
                    !useCustomPass && selectedPassType === passType.id ? styles.selected : ''
                  }`}
                >
                  <div className={styles.passTypeSessions}>
                    {passType.sessions}
                  </div>
                  <div className={styles.passTypeLabel}>
                    Настройка
                  </div>
                  <div className={styles.passTypePrice}>
                    {t('configure')}
                  </div>
                </div>
              ))}
              
              <div
                onClick={() => setUseCustomPass(true)}
                className={`${styles.passTypeOption} ${useCustomPass ? styles.selected : ''}`}
              >
                <div className={styles.passTypeSessions}>
                  ⚙️
                </div>
                <div className={styles.passTypeLabel}>
                  Custom
                </div>
                <div className={styles.passTypePrice}>
                  Configure
                </div>
              </div>
            </div>
          </div>

          {/* Custom Pass Configuration */}
          {useCustomPass && (
            <div className={styles.customPassSection}>
              <h3 className={styles.customPassTitle}>{t('customPassConfiguration')}</h3>
              
              <div className={styles.customPassGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('sessions')}</label>
                  <input
                    type="number"
                    value={customPass.sessions}
                    onChange={(e) => setCustomPass(prev => ({
                      ...prev,
                      sessions: parseInt(e.target.value) || 1
                    }))}
                    className={styles.input}
                    min="1"
                    max="100"
                    disabled={submitting}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('priceRsd')}</label>
                  <input
                    type="number"
                    value={customPass.priceRSD}
                    onChange={(e) => setCustomPass(prev => ({
                      ...prev,
                      priceRSD: parseInt(e.target.value) || 0
                    }))}
                    className={styles.input}
                    min="0"
                    step="100"
                    disabled={submitting}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('validityDays')}</label>
                  <input
                    type="number"
                    value={customPass.validityDays}
                    onChange={(e) => setCustomPass(prev => ({
                      ...prev,
                      validityDays: parseInt(e.target.value) || 30
                    }))}
                    className={styles.input}
                    min="1"
                    max="365"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className={styles.priceCalculation}>
            <div className={styles.priceLabel}>{t('totalPriceLabel')}</div>
            <div className={styles.priceValue}>
              {formatPrice(selectedPassConfig.priceRSD)}
            </div>
            <div className={styles.pricePerSession}>
              {formatPrice(calculatePricePerSession(selectedPassConfig.priceRSD, selectedPassConfig.sessions))} {t('perSession')}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={styles.cancelButton}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedClient}
              className={styles.submitButton}
            >
              {submitting && <div className={styles.spinner} />}
              {submitting ? t('creating') : t('sellPass')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}