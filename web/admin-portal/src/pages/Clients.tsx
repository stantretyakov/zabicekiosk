import React, { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../lib/api';
import { Client } from '../types';
import DataTable from '../components/DataTable';
import ClientForm from '../components/ClientForm';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'parent' | 'child'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createClient(clientData);
      await loadClients();
      setShowForm(false);
    } catch (err) {
      setError('Failed to create client');
      console.error(err);
    }
  };

  const handleUpdateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      await updateClient(id, clientData);
      await loadClients();
      setEditingClient(null);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update client');
      console.error(err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await deleteClient(id);
      await loadClients();
    } catch (err) {
      setError('Failed to delete client');
      console.error(err);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {client.type === 'parent' ? '👨‍👩‍👧‍👦' : '🧒'}
          </span>
          <div>
            <div className="font-medium">{client.name}</div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (client: Client) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          client.type === 'parent' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {client.type === 'parent' ? 'Parent' : 'Child'}
        </span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (client: Client) => client.phone || '-'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (client: Client) => new Date(client.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (client: Client) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingClient(client);
              setShowForm(true);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClient(client.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={() => {
            setEditingClient(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Client
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'parent' | 'child')}
        >
          <option value="all">All Types</option>
          <option value="parent">Parents</option>
          <option value="child">Children</option>
        </select>
      </div>

      <DataTable
        data={paginatedClients}
        columns={columns}
        emptyMessage="No clients found"
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

      {showForm && (
        <div className="modal">
          <div className="modal-body">
            <ClientForm
              client={editingClient}
              onSubmit={editingClient 
                ? (data) => handleUpdateClient(editingClient.id, data)
                : handleCreateClient
              }
              onCancel={() => {
                setShowForm(false);
                setEditingClient(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}