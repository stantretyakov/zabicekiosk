import { useEffect, useState } from 'react';
import { listClients, createClient, updateClient, archiveClient } from '../lib/api';
import type { Client } from '../types';
import ClientForm from '../components/ClientForm';
import Confirm from '../components/Confirm';
import DataTable from '../components/DataTable';

export default function Clients() {
  const [items, setItems] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all');
  const [pageSize, setPageSize] = useState(20);
  const [orderBy, setOrderBy] = useState<'createdAt' | 'parentName'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; client?: Client } | null>(null);
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = () => {
    setLoading(true);
    setError('');
    listClients({
      search: debouncedSearch || undefined,
      pageSize,
      pageToken,
      active,
      orderBy,
      order,
    })
      .then(res => {
        setItems(res.items);
        setNextPageToken(res.nextPageToken);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [debouncedSearch, active, pageSize, orderBy, order, pageToken]);

  const openCreate = () => setForm({ mode: 'create' });
  const openEdit = (c: Client) => setForm({ mode: 'edit', client: c });
  const closeForm = () => setForm(null);
  const closeConfirm = () => setConfirm(null);

  const handleSave = async (values: Partial<Client>) => {
    if (form?.mode === 'create') await createClient(values);
    else if (form?.mode === 'edit' && form.client) await updateClient(form.client.id, values);
    load();
  };

  const handleArchive = async (id: string) => {
    await archiveClient(id);
    load();
  };

  const gotoNext = () => {
    if (!nextPageToken) return;
    setPrevTokens([...prevTokens, pageToken || '']);
    setPageToken(nextPageToken);
  };
  const gotoPrev = () => {
    const prev = prevTokens[prevTokens.length - 1];
    setPrevTokens(prevTokens.slice(0, -1));
    setPageToken(prev || undefined);
  };

  return (
    <section>
      <h1>Clients</h1>
      <div className="toolbar">
        <input
          placeholder="Search"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPageToken(undefined);
            setPrevTokens([]);
          }}
        />
        <select
          value={active}
          onChange={e => {
            setActive(e.target.value as any);
            setPageToken(undefined);
            setPrevTokens([]);
          }}
        >
          <option value="all">All</option>
          <option value="true">Active</option>
          <option value="false">Archived</option>
        </select>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
            setPageToken(undefined);
            setPrevTokens([]);
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <select value={orderBy} onChange={e => setOrderBy(e.target.value as any)}>
          <option value="createdAt">Created</option>
          <option value="parentName">Parent</option>
        </select>
        <select value={order} onChange={e => setOrder(e.target.value as any)}>
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <button onClick={openCreate} className="primary">Add client</button>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: 'var(--muted)',
          background: 'var(--card)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>👥</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>No clients yet</h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Start by adding your first client</p>
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Parent</th>
              <th>Child</th>
              <th>Phone</th>
              <th>Telegram</th>
              <th>Instagram</th>
              <th>Active</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id}>
                <td>{c.parentName}</td>
                <td>{c.childName}</td>
                <td>
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      {c.phone}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>
                  )}
                </td>
                <td>
                  {c.telegram ? (
                    <a 
                      href={`https://t.me/${c.telegram}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-2)', textDecoration: 'none' }}
                    >
                      @{c.telegram}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>
                  )}
                </td>
                <td>
                  {c.instagram ? (
                    <a 
                      href={c.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      Instagram
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: c.active ? 'var(--ok)' : 'var(--muted)',
                    color: c.active ? 'var(--bg)' : 'var(--text)'
                  }}>
                    {c.active ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => openEdit(c)}
                      style={{
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                        color: 'var(--text)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(43, 224, 144, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Edit
                    </button>
                  {c.active && (
                    <button 
                      onClick={() => setConfirm({ id: c.id })}
                      style={{
                        background: 'var(--error)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Archive
                    </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <div className="pagination">
        <button 
          onClick={gotoPrev} 
          disabled={prevTokens.length === 0}
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--text)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: prevTokens.length === 0 ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            opacity: prevTokens.length === 0 ? 0.4 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          Prev
        </button>
        <button 
          onClick={gotoNext} 
          disabled={!nextPageToken}
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--text)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: !nextPageToken ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            opacity: !nextPageToken ? 0.4 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          Next
        </button>
      </div>
      {form && (
        <ClientForm
          mode={form.mode}
          initial={form.client}
          onSubmit={handleSave}
          onClose={closeForm}
        />
      )}
      {confirm && (
        <Confirm
          message="Archive this client?"
          onOk={() => handleArchive(confirm.id)}
          onClose={closeConfirm}
        />
      )}
    </section>
  );
}
