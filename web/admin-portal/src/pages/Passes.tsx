import React, { useState, useEffect, useRef } from 'react';
import { listPasses, deletePass, renewPass, renewPasses, RenewPassOptions, RenewPassesResponse } from '../lib/api';
import { PassWithClient } from '../types';
import { useTranslation } from '../lib/i18n';
import DataTable from '../components/ui/DataTable';
import SellPassForm from '../components/ui/SellPassForm';
import RenewPassDialog from '../components/ui/RenewPassDialog';

export default function Passes() {
  const { t } = useTranslation();
  const [passes, setPasses] = useState<PassWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedPassIds, setSelectedPassIds] = useState<Set<string>>(new Set());
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewMode, setRenewMode] = useState<'single' | 'bulk'>('single');
  const [targetPass, setTargetPass] = useState<PassWithClient | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async (token?: string) => {
    try {
      setLoading(true);
      const data = await listPasses({
        pageToken: token,
        pageSize: 20
      });
      setPasses(data.items);
      setHasNextPage(!!data.nextPageToken);
      setPageToken(data.nextPageToken);
      setError(null);
      setSelectedPassIds(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to load passes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePass = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this pass?')) return;

    try {
      setStatusMessage(null);
      await deletePass(id);
      await loadPasses();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke pass');
      console.error(err);
    }
  };

  const handleSellSuccess = async () => {
    await loadPasses();
    setError(null);
  };

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const filteredPasses = passes.filter(pass => {
    if (!searchTerm) return true;
    const searchLower = normalize(searchTerm);
    const parent = normalize(pass.client?.parentName || '');
    const child = normalize(pass.client?.childName || '');
    return parent.includes(searchLower) || child.includes(searchLower);
  });

  const selectedCount = selectedPassIds.size;
  const allVisibleSelected = filteredPasses.length > 0 && filteredPasses.every(pass => selectedPassIds.has(pass.id));

  useEffect(() => {
    if (!selectAllRef.current) return;
    const someSelected = filteredPasses.some(pass => selectedPassIds.has(pass.id));
    selectAllRef.current.indeterminate = someSelected && !allVisibleSelected;
  }, [filteredPasses, selectedPassIds, allVisibleSelected]);

  const toggleSelect = (passId: string) => {
    setSelectedPassIds(prev => {
      const next = new Set(prev);
      if (next.has(passId)) {
        next.delete(passId);
      } else {
        next.add(passId);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredPasses.map(pass => pass.id);
    const allSelected = visibleIds.every(id => selectedPassIds.has(id));
    setSelectedPassIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const openRenewDialogForPass = (pass: PassWithClient) => {
    setRenewMode('single');
    setTargetPass(pass);
    setShowRenewDialog(true);
  };

  const openRenewDialogForSelection = () => {
    if (selectedCount === 0) return;
    setRenewMode('bulk');
    setTargetPass(null);
    setShowRenewDialog(true);
  };

  const handleRenewConfirm = async (options: RenewPassOptions) => {
    try {
      setStatusMessage(null);
      setError(null);
      if (renewMode === 'single' && targetPass) {
        await renewPass(targetPass.id, options);
        setStatusMessage(t('renewSuccessSingle', { child: targetPass.client.childName }));
      } else if (renewMode === 'bulk') {
        const passIds = Array.from(selectedPassIds);
        if (passIds.length === 0) {
          throw new Error(t('renewNoSelection'));
        }
        const res: RenewPassesResponse = await renewPasses(passIds, options);
        const success = res.results.filter(r => r.status === 'renewed').length;
        setStatusMessage(t('renewSuccessBulk', { success, total: res.results.length }));
        const failed = res.results.filter(r => r.status === 'error');
        if (failed.length > 0) {
          setError(
            failed
              .map(item => `${item.passId}: ${item.message || t('renewUnknownError')}`)
              .join('; '),
          );
        } else {
          setError(null);
        }
        setSelectedPassIds(new Set());
      }
      await loadPasses();
    } catch (err: any) {
      setStatusMessage(null);
      const message = err?.message || t('renewFailed');
      setError(message);
      throw err;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (remaining: number, total: number) => {
    return total > 0 ? (remaining / total) * 100 : 0;
  };

  const getStatusColor = (remaining: number, total: number) => {
    const percentage = getProgressPercentage(remaining, total);
    if (percentage > 50) return 'var(--ok)';
    if (percentage > 20) return 'var(--warn)';
    return 'var(--error)';
  };

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          ref={selectAllRef}
          checked={allVisibleSelected}
          onChange={toggleSelectAllVisible}
          aria-label={t('selectAllPasses')}
        />
      ),
      width: 48,
      render: (pass: PassWithClient) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={selectedPassIds.has(pass.id)}
            onChange={() => toggleSelect(pass.id)}
            aria-label={t('selectPass')}
          />
        </div>
      ),
    },
    {
      key: 'client',
      title: t('client'),
      render: (pass: PassWithClient) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {pass.client.parentName}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🐸</span>
            {pass.client.childName}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: t('type'),
      render: (pass: PassWithClient) => (
        <span style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius)',
          background: 'linear-gradient(135deg, var(--accent-2), var(--accent))',
          color: 'var(--text)',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {t(pass.type)}
        </span>
      )
    },
    {
      key: 'progress',
      title: t('progress'),
      render: (pass: PassWithClient) => {
        const percentage = getProgressPercentage(pass.remaining, pass.planSize);
        return (
          <div style={{ minWidth: '120px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              <span>{pass.remaining} / {pass.planSize}</span>
              <span style={{ color: getStatusColor(pass.remaining, pass.planSize) }}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${getStatusColor(pass.remaining, pass.planSize)}, rgba(43, 224, 144, 0.8))`,
                  width: `${percentage}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'purchased',
      title: t('purchased'),
      render: (pass: PassWithClient) => (
        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          {formatDate(pass.purchasedAt)}
        </div>
      )
    },
    {
      key: 'lastVisit',
      title: t('lastVisit'),
      render: (pass: PassWithClient) => (
        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          {formatDate(pass.lastVisit)}
        </div>
      )
    },
    {
      key: 'actions',
      title: t('actions'),
      render: (pass: PassWithClient) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => openRenewDialogForPass(pass)}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, var(--accent-2), rgba(43, 224, 144, 0.6))',
              color: 'var(--text)',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {t('renewPassAction')}
          </button>
          <button
            onClick={() => handleDeletePass(pass.id)}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, var(--error), rgba(255, 107, 107, 0.8))',
              color: 'var(--text)',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {t('revoke')}
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          {t('passesTitle')}
        </h1>
        <button
          onClick={() => setShowSellForm(true)}
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--text)',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1.5rem',
            fontFamily: 'var(--font)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {t('sellPass')}
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder={t('searchByClientName')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <button
          onClick={openRenewDialogForSelection}
          disabled={selectedCount === 0}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--text)',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedCount === 0 ? 0.6 : 1,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {t('renewSelectedAction')}
          {selectedCount > 0 ? ` (${selectedCount})` : ''}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(43, 224, 144, 0.12)',
            border: '1px solid rgba(43, 224, 144, 0.35)',
            color: 'var(--text)'
          }}
        >
          {statusMessage}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredPasses}
        loading={loading}
        emptyText={t('noPassesFound')}
        onNextPage={hasNextPage ? () => loadPasses(pageToken) : undefined}
        hasNext={hasNextPage}
      />

      <SellPassForm
        open={showSellForm}
        onClose={() => setShowSellForm(false)}
        onSuccess={handleSellSuccess}
      />
      {showRenewDialog && (
        <RenewPassDialog
          open={showRenewDialog}
          mode={renewMode}
          pass={renewMode === 'single' ? targetPass ?? undefined : undefined}
          selectedCount={renewMode === 'bulk' ? selectedCount : undefined}
          onClose={() => {
            setShowRenewDialog(false);
            setTargetPass(null);
          }}
          onConfirm={async (options: RenewPassOptions) => {
            await handleRenewConfirm(options);
            setShowRenewDialog(false);
            setTargetPass(null);
          }}
        />
      )}
    </div>
  );
}