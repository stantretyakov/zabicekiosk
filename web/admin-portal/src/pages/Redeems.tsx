import React, { useEffect, useState } from 'react';
import { listRedeems } from '../lib/api';
import { Redeem } from '../types';
import DataTable from '../components/DataTable';

export default function Redeems() {
  const [redeems, setRedeems] = useState<Redeem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRedeems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await listRedeems(params.toString());
      setRedeems(response.redeems || []);
      setTotalPages(Math.ceil((response.total || 0) / 20));
      setError(null);
    } catch (err) {
      setError('Failed to fetch redeems');
      console.error('Error fetching redeems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedeems();
  }, [page, typeFilter, searchTerm]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pass': return '🎫';
      case 'single': return '💰';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pass': return 'var(--accent)';
      case 'single': return 'var(--warning)';
      default: return 'var(--muted)';
    }
  };

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (redeem: Redeem) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: getTypeColor(redeem.type)
        }}>
          <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(redeem.type)}</span>
          <span style={{ 
            textTransform: 'capitalize',
            fontWeight: '600'
          }}>
            {redeem.type}
          </span>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (redeem: Redeem) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {redeem.clientName}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{redeem.clientType === 'parent' ? '👨‍👩‍👧‍👦' : '👶'}</span>
            {redeem.clientType}
          </div>
        </div>
      )
    },
    {
      key: 'value',
      label: 'Value',
      render: (redeem: Redeem) => (
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius)',
          background: redeem.type === 'pass' 
            ? 'linear-gradient(135deg, rgba(43, 224, 144, 0.1), rgba(43, 224, 144, 0.05))'
            : 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
          border: `1px solid ${redeem.type === 'pass' ? 'var(--accent)' : 'var(--warning)'}`,
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {redeem.type === 'pass' ? `${redeem.visits} visits` : `${redeem.amount} RSD`}
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'When',
      render: (redeem: Redeem) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {formatTimeAgo(redeem.timestamp)}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--muted)'
          }}>
            {new Date(redeem.timestamp).toLocaleString()}
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="pass">Passes</option>
          <option value="single">Single Payments</option>
        </select>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <DataTable
        data={redeems}
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
            fontSize: '0.875rem'
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