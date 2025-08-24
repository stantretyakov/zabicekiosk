import React, { useEffect, useState } from 'react';
import { listRedeems } from '../lib/api';
import { Redeem } from '../types';
import DataTable from '../components/ui/DataTable';

export default function Redeems() {
  const [redeems, setRedeems] = useState<Redeem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');

  useEffect(() => {
    loadRedeems();
  }, []);

  const loadRedeems = async () => {
    try {
      setLoading(true);
      const data = await listRedeems();
      setRedeems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load redeems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRedeems = redeems.filter(redeem => {
    const matchesSearch = !searchTerm || 
      (redeem.client?.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       redeem.client?.childName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesKind = kindFilter === 'all' || redeem.kind === kindFilter;
    
    return matchesSearch && matchesKind;
  });

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'pass': return '🎫';
      case 'dropin': return '💰';
      default: return '📋';
    }
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'pass': return 'var(--accent)';
      case 'dropin': return 'var(--warn)';
      default: return 'var(--muted)';
    }
  };

  const columns = [
    {
      key: 'kind',
      title: 'Type',
      render: (redeem: Redeem) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: getKindColor(redeem.kind)
        }}>
          <span style={{ fontSize: '1.2rem' }}>{getKindIcon(redeem.kind)}</span>
          <span style={{ 
            textTransform: 'capitalize',
            fontWeight: '600'
          }}>
            {redeem.kind}
          </span>
        </div>
      )
    },
    {
      key: 'client',
      title: 'Client',
      render: (redeem: Redeem) => (
        <div>
          {redeem.client ? (
            <>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {redeem.client.parentName}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>👶</span>
                {redeem.client.childName}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Unknown client
            </span>
          )}
        </div>
      )
    },
    {
      key: 'value',
      title: 'Value',
      render: (redeem: Redeem) => (
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius)',
          background: redeem.kind === 'pass' 
            ? 'linear-gradient(135deg, rgba(43, 224, 144, 0.1), rgba(43, 224, 144, 0.05))'
            : 'linear-gradient(135deg, rgba(255, 209, 102, 0.1), rgba(255, 209, 102, 0.05))',
          border: `1px solid ${redeem.kind === 'pass' ? 'var(--accent)' : 'var(--warn)'}`,
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {redeem.kind === 'pass' 
            ? `${Math.abs(redeem.delta || 0)} visit${Math.abs(redeem.delta || 0) !== 1 ? 's' : ''}`
            : `${redeem.priceRSD || 0} RSD`
          }
        </div>
      )
    },
    {
      key: 'timestamp',
      title: 'When',
      render: (redeem: Redeem) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {formatTimeAgo(redeem.ts)}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--muted)'
          }}>
            {redeem.ts ? new Date(redeem.ts).toLocaleString() : '-'}
          </div>
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
          Redeems
        </h1>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="pass">Pass Redeems</option>
          <option value="dropin">Drop-in Payments</option>
        </select>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filteredRedeems}
        loading={loading}
        emptyText="No redeems found"
      />
    </div>
  );
}