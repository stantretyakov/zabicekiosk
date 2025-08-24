import React, { useState, useEffect } from 'react';
import { listRedeems } from '../lib/api';
import { DataTable } from '../components/DataTable';
import type { Redeem } from '../types';

export function Redeems() {
  const [redeems, setRedeems] = useState<Redeem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadRedeems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listRedeems({ page, limit: 20 });
      setRedeems(response.redeems);
      setTotalPages(Math.ceil(response.total / 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load redeems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRedeems();
  }, [page]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTypeIcon = (type: string) => {
    return type === 'pass' ? '🎫' : '💰';
  };

  const getTypeColor = (type: string) => {
    return type === 'pass' ? 'var(--accent)' : 'var(--accent-2)';
  };

  const filteredRedeems = redeems.filter(redeem => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'pass') return redeem.type === 'pass';
    if (typeFilter === 'single') return redeem.type === 'single';
    return true;
  });

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (redeem: Redeem) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: getTypeColor(redeem.type),
          fontWeight: '600'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(redeem.type)}</span>
          {redeem.type === 'pass' ? 'Pass' : 'Single'}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (redeem: Redeem) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {redeem.client?.name || 'Unknown'}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{redeem.client?.phone || 'No phone'}</span>
            {redeem.client?.isChild && (
              <span style={{
                background: 'rgba(43, 224, 144, 0.1)',
                color: 'var(--accent)',
                padding: '0.125rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                Child
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'value',
      label: 'Value',
      render: (redeem: Redeem) => (
        <div style={{ 
          fontWeight: '600',
          color: redeem.type === 'pass' ? 'var(--accent)' : 'var(--accent-2)'
        }}>
          {redeem.type === 'pass' ? `${redeem.visits} visits` : `${redeem.rsd} RSD`}
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Time',
      render: (redeem: Redeem) => (
        <div>
          <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
            {formatTimeAgo(redeem.timestamp)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            {new Date(redeem.timestamp).toLocaleString()}
          </div>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Redeems
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
          Track all redemption activities
        </p>
      </div>

      <div className="toolbar">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            background: 'var(--panel)',
            color: 'var(--text)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            fontFamily: 'var(--font)',
            fontSize: '0.875rem',
            transition: 'all 0.3s ease',
            minWidth: '150px'
          }}
        >
          <option value="all">All Types</option>
          <option value="pass">Passes Only</option>
          <option value="single">Single Visits</option>
        </select>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <DataTable
        data={filteredRedeems}
        columns={columns}
        loading={loading}
        emptyMessage="No redeems found"
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{ 
            color: 'var(--muted)',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}