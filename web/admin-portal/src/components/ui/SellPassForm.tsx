import React, { useState, useEffect, useRef } from 'react';
import { listClients, createPass } from '../../lib/api';
import type { Client } from '../../types';
import styles from './SellPassForm.module.css';

export type SellPassFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export default function SellPassForm({ open, onClose, onSuccess }: SellPassFormProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPassType, setSelectedPassType] = useState<string>('10');
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
      setSelectedClient(null);
      setSearchTerm('');
      setClients([]);
      setShowDropdown(false);
      setSelectedPassType('10');
      setUseCustomPass(false);
      setError(null);
      
      // Focus search input
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchClients();
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

  const searchClients = async () => {
    try {
      setLoadingClients(true);
      const data = await listClients({
        search: searchTerm,
        active: 'true',
        pageSize: 10,
      });
      setClients(data.items);
      setShowDropdown(true);
    } catch (err) {
      console.error('Failed to search clients:', err);
      setClients([]);
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
    
    const defaultPass = DEFAULT_PASS_TYPES.find(p => p.id === selectedPassType);
    return defaultPass || DEFAULT_PASS_TYPES[1]; // fallback to 10 sessions
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
      
      await createPass({
        clientId: selectedClient.id,
        planSize: passConfig.sessions,
        purchasedAt: new Date().toISOString(),
        priceRSD: passConfig.priceRSD,
      });
      
      onSuccess();
      onClose();
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
          <h2 className={styles.title}>Sell Swimming Pass</h2>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div className={styles.field}>
            <label className={styles.label}>Select Client</label>
            
            {selectedClient ? (
              <div className={styles.selectedClient}>
                <div className={styles.selectedClientHeader}>
                  <div className={styles.selectedClientName}>
                    {selectedClient.parentName}
                  </div>
                  <button
                    type="button"
                    onClick={clearClient}
                    className={styles.changeButton}
                  >
                    Change
                  </button>
                </div>
                <div className={styles.selectedClientChild}>
                  <span>👶</span>
                  {selectedClient.childName}
                </div>
              </div>
            ) : (
              <div className={styles.clientSearch} ref={dropdownRef}>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by parent or child name..."
                  className={styles.searchInput}
                  disabled={submitting}
                />
                
                {showDropdown && (
                  <div className={styles.clientDropdown}>
                    {loadingClients ? (
                      <div className={styles.loadingOption}>
                        <div className={styles.loadingSpinner} />
                        Searching...
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
                        No clients found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pass Type Selection */}
          <div className={styles.field}>
            <label className={styles.label}>Pass Type</label>
            
            <div className={styles.passTypeGrid}>
              {DEFAULT_PASS_TYPES.map((passType) => (
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
                    {passType.name}
                  </div>
                  <div className={styles.passTypePrice}>
                    {formatPrice(passType.priceRSD)}
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
              <h3 className={styles.customPassTitle}>Custom Pass Configuration</h3>
              
              <div className={styles.customPassGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Sessions</label>
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
                
                <div className={styles.field}>
                  <label className={styles.label}>Price (RSD)</label>
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
                
                <div className={styles.field}>
                  <label className={styles.label}>Validity (Days)</label>
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
            <div className={styles.priceLabel}>Total Price</div>
            <div className={styles.priceValue}>
              {formatPrice(selectedPassConfig.priceRSD)}
            </div>
            <div className={styles.pricePerSession}>
              {formatPrice(calculatePricePerSession(selectedPassConfig.priceRSD, selectedPassConfig.sessions))} per session
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedClient}
              className={styles.submitButton}
            >
              {submitting && <div className={styles.spinner} />}
              {submitting ? 'Creating...' : 'Sell Pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}