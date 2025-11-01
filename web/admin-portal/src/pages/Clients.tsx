import React, { useState, useEffect } from 'react';
import { listClients, createClient, updateClient, archiveClient } from '../lib/api';
import { Client } from '../types';
import { useTranslation } from '../lib/i18n';
import DataTable from '../components/ui/DataTable';
import ClientForm from '../components/ui/ClientForm';
import ClientImport from '../components/ui/ClientImport';

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadClients();
  }, [searchTerm, activeFilter]);

  const loadClients = async (token?: string) => {
    try {
      setLoading(true);
      const trimmedSearch = searchTerm.trim();
      const data = await listClients({
        search: trimmedSearch || undefined,
        active: activeFilter,
        pageToken: token,
        pageSize: 20
      });
      setClients(data.items);
      setHasNextPage(!!data.nextPageToken);
      setPageToken(data.nextPageToken);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      await createClient(clientData);
      await loadClients();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
      console.error(err);
    }
  };

  const handleUpdateClient = async (clientData: Partial<Client>) => {
    if (!editingClient) return;
    
    try {
      await updateClient(editingClient.id, clientData);
      await loadClients();
      setEditingClient(null);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
      console.error(err);
    }
  };

  const handleArchiveClient = async (id: string) => {
    if (!confirm('Are you sure you want to archive this client?')) return;
    
    try {
      await archiveClient(id);
      await loadClients();
    } catch (err: any) {
      setError(err.message || 'Failed to archive client');
      console.error(err);
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

  const columns = [
    {
      key: 'name',
      title: t('client'),
      render: (client: Client) => (
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setEditingClient(client);
            setShowForm(true);
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {client.parentName}
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🐸</span>
            {client.childName}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      title: t('contact'),
      render: (client: Client) => (
        <div style={{ fontSize: '0.875rem' }}>
          {client.phone && (
            <div style={{ marginBottom: '0.25rem' }}>
              📞 {client.phone}
            </div>
          )}
          {client.telegram && (
            <div style={{ marginBottom: '0.25rem' }}>
              📱 @{client.telegram}
            </div>
          )}
          {client.instagram && (
            <div>
              📷 {client.instagram}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: t('status'),
      render: (client: Client) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          background: client.active 
            ? 'linear-gradient(135deg, var(--ok), rgba(43, 224, 144, 0.8))'
            : 'linear-gradient(135deg, var(--muted), rgba(154, 165, 177, 0.8))',
          color: 'var(--text)'
        }}>
          {client.active ? t('active') : t('inactive')}
        </span>
      )
    },
    {
      key: 'created',
      title: t('created'),
      render: (client: Client) => (
        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          {formatDate(client.createdAt)}
        </div>
      )
    },
    {
      key: 'actions',
      title: t('actions'),
      render: (client: Client) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setEditingClient(client);
              setShowForm(true);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, var(--accent-2), var(--accent))',
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
            {t('edit')}
          </button>
          <button
            onClick={() => handleArchiveClient(client.id)}
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
            {t('archive')}
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
          {t('clientsTitle')}
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowImport(true)}
            className="primary"
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
            {t('importClients')}
          </button>
          <button
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
            className="primary"
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
            {t('addClientButton')}
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div
          style={{
            flex: 1,
            minWidth: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <input
            type="text"
            placeholder={t('searchByName')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              lineHeight: 1.4,
            }}
          >
            {t('searchHelpClients')}
          </div>
        </div>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
        >
          <option value="all">{t('allClients')}</option>
          <option value="true">{t('activeOnly')}</option>
          <option value="false">{t('inactiveOnly')}</option>
        </select>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={clients}
        loading={loading}
        emptyText={t('noClientsFound')}
        onNextPage={hasNextPage ? () => loadClients(pageToken) : undefined}
        hasNext={hasNextPage}
      />

      {showForm && (
        <ClientForm
          initial={editingClient || undefined}
          mode={editingClient ? 'edit' : 'create'}
          onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
        />
      )}
      {showImport && (
        <ClientImport
          open={showImport}
          onClose={() => setShowImport(false)}
          onImported={() => loadClients()}
        />
      )}
    </div>
  );
}