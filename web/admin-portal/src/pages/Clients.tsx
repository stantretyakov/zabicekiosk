import { useEffect, useState } from 'react';
import { listClients, createClient, updateClient, archiveClient } from '../lib/api';
import type { Client } from '../types';
import ClientForm from '../components/ClientForm';
import Confirm from '../components/Confirm';

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
        <button onClick={openCreate}>Add client</button>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No clients yet</p>
      ) : (
        <table>
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
                <td>{c.phone}</td>
                <td>{c.telegram && '@' + c.telegram}</td>
                <td>{c.instagram}</td>
                <td>{String(c.active)}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</td>
                <td>
                  <button onClick={() => openEdit(c)}>Edit</button>
                  {c.active && (
                    <button onClick={() => setConfirm({ id: c.id })}>Archive</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button onClick={gotoPrev} disabled={prevTokens.length === 0}>
          Prev
        </button>
        <button onClick={gotoNext} disabled={!nextPageToken}>
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
