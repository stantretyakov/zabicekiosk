import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../components/DataTable';
import { api } from '../lib/api';
import type { Pass, Client } from '../types';

export default function Passes() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [passesData, clientsData] = await Promise.all([
        api.getPasses(),
        api.getClients()
      ]);
      setPasses(passesData);
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Unknown Client';
    
    if (client.type === 'parent') {
      return `${client.name} (Parent)`;
    } else {
      const parent = clients.find(c => c.id === client.parentId);
      return `${client.name} (Child of ${parent?.name || 'Unknown'})`;
    }
  };

  const getPassStatus = (pass: Pass) => {
    if (pass.expiresAt && new Date(pass.expiresAt) < new Date()) {
      return 'expired';
    }
    if (pass.remainingVisits <= 2) {
      return 'low';
    }
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4ade80';
      case 'low': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'monthly': return '#3b82f6';
      case 'weekly': return '#8b5cf6';
      case 'daily': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const filteredPasses = useMemo(() => {
    return passes.filter(pass => {
      const clientName = getClientName(pass.clientId).toLowerCase();
      const matchesSearch = clientName.includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      const status = getPassStatus(pass);
      return matchesSearch && status === statusFilter;
    });
  }, [passes, clients, searchTerm, statusFilter]);

  const paginatedPasses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPasses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPasses, currentPage]);

  const totalPages = Math.ceil(filteredPasses.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'client',
      label: 'Client',
      render: (pass: Pass) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">
            {getClientName(pass.clientId)}
          </span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (pass: Pass) => (
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: getTypeColor(pass.type) }}
        >
          {pass.type.charAt(0).toUpperCase() + pass.type.slice(1)}
        </span>
      )
    },
    {
      key: 'visits',
      label: 'Visits',
      render: (pass: Pass) => {
        const percentage = (pass.remainingVisits / pass.totalVisits) * 100;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-white">
              {pass.remainingVisits} / {pass.totalVisits}
            </span>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: percentage > 20 ? '#4ade80' : '#ef4444'
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (pass: Pass) => {
        const status = getPassStatus(pass);
        return (
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getStatusColor(status) }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (pass: Pass) => (
        <span className="text-sm text-gray-300">
          {formatDate(pass.createdAt)}
        </span>
      )
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (pass: Pass) => (
        <span className="text-sm text-gray-300">
          {pass.expiresAt ? formatDate(pass.expiresAt) : 'Never'}
        </span>
      )
    }
  ];

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Passes</h1>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="low">Low Visits</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <DataTable
        data={paginatedPasses}
        columns={columns}
        loading={loading}
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
          <span className="text-white">
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
    </section>
  );
}