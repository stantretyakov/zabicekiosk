import React, { useState, useEffect } from 'react';
import { listPasses, deletePass } from '../lib/api';
import { PassWithClient } from '../types';
import DataTable from '../components/ui/DataTable';
import SellPassForm from '../components/ui/SellPassForm';

export default function Passes() {
  const [passes, setPasses] = useState<PassWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);

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

  const filteredPasses = passes.filter(pass => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pass.client.parentName.toLowerCase().includes(searchLower) ||
      pass.client.childName.toLowerCase().includes(searchLower)
    );
  });

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
      key: 'client',
      title: 'Client',
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
            <span>👶</span>
            {pass.client.childName}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
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
          {pass.type}
        </span>
      )
    },
    {
      key: 'progress',
      title: 'Progress',
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
      title: 'Purchased',
      render: (pass: PassWithClient) => (
        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          {formatDate(pass.purchasedAt)}
        </div>
      )
    },
    {
      key: 'lastVisit',
      title: 'Last Visit',
      render: (pass: PassWithClient) => (
        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          {formatDate(pass.lastVisit)}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (pass: PassWithClient) => (
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
          Revoke
        </button>
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
          Passes
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
          Sell Pass
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredPasses}
        loading={loading}
        emptyText="No passes found"
        onNextPage={hasNextPage ? () => loadPasses(pageToken) : undefined}
        hasNext={hasNextPage}
      />

      <SellPassForm
        open={showSellForm}
        onClose={() => setShowSellForm(false)}
        onSuccess={handleSellSuccess}
      />
    </div>
  );
}