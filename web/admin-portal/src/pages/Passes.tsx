import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import DataTable from '../components/DataTable';

interface Pass {
  id: string;
  clientId: string;
  clientName: string;
  clientType: 'parent' | 'child';
  passType: string;
  totalVisits: number;
  remainingVisits: number;
  expiryDate: string;
  createdAt: string;
  status: 'active' | 'expired' | 'low';
}

export default function Passes() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await api.get(`/admin/passes?${params}`);
      setPasses(response.data.passes || []);
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err) {
      setError('Failed to fetch passes');
      console.error('Error fetching passes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, [currentPage, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4ade80';
      case 'low': return '#fbbf24';
      case 'expired': return '#f87171';
      default: return '#6b7280';
    }
  };

  const getProgressPercentage = (remaining: number, total: number) => {
    return total > 0 ? (remaining / total) * 100 : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'clientName',
      label: 'Client',
      render: (pass: Pass) => (
        <div>
          <div className="font-medium">{pass.clientName}</div>
          <div className="text-sm text-gray-500 capitalize">
            {pass.clientType === 'parent' ? '👨‍👩‍👧‍👦' : '👶'} {pass.clientType}
          </div>
        </div>
      )
    },
    {
      key: 'passType',
      label: 'Pass Type',
      render: (pass: Pass) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {pass.passType}
        </span>
      )
    },
    {
      key: 'visits',
      label: 'Visits',
      render: (pass: Pass) => (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{pass.remainingVisits} / {pass.totalVisits}</span>
            <span>{getProgressPercentage(pass.remainingVisits, pass.totalVisits).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage(pass.remainingVisits, pass.totalVisits)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (pass: Pass) => (
        <span 
          className="px-2 py-1 rounded-full text-white text-sm font-medium capitalize"
          style={{ backgroundColor: getStatusColor(pass.status) }}
        >
          {pass.status}
        </span>
      )
    },
    {
      key: 'expiryDate',
      label: 'Expires',
      render: (pass: Pass) => (
        <div className="text-sm">
          {formatDate(pass.expiryDate)}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (pass: Pass) => (
        <div className="text-sm text-gray-500">
          {formatDate(pass.createdAt)}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Passes</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="low">Low Visits</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <DataTable
        data={passes}
        columns={columns}
        emptyMessage="No passes found"
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}