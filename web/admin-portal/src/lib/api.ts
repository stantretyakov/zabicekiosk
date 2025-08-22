// web/admin-portal/src/lib/api.ts
import { getIdToken } from './auth';
import type { Client, Paginated, PassWithClient, Redeem, Stats } from '../types';

const API_BASE_URL =
  (import.meta.env.VITE_CORE_API_URL as string | undefined) ??
  '/api/v1'; // безопасный дефолт

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  const token = await getIdToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers, credentials: 'include' });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const body = ct.includes('application/json') ? await res.json().catch(()=>null) : await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${typeof body === 'string' ? body.slice(0,200) : (body?.message || '')}`);
  }
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${ct || 'unknown'}; first 120 chars: ${text.slice(0,120)}`);
  }
  return res.json() as Promise<T>;
}

export async function listClients(q: {
  search?: string;
  pageSize?: number;
  pageToken?: string;
  active?: 'all' | 'true' | 'false';
  orderBy?: 'createdAt' | 'parentName';
  order?: 'asc' | 'desc';
}): Promise<Paginated<Client>> {
  const params = new URLSearchParams();
  if (q.search) params.set('search', q.search);
  if (q.pageSize) params.set('pageSize', String(q.pageSize));
  if (q.pageToken) params.set('pageToken', q.pageToken);
  if (q.active) params.set('active', q.active);
  if (q.orderBy) params.set('orderBy', q.orderBy);
  if (q.order) params.set('order', q.order);
  return fetchJSON(`/admin/clients?${params.toString()}`);
}

export async function createClient(body: Partial<Client>): Promise<Client> {
  return fetchJSON(`/admin/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateClient(id: string, body: Partial<Client>): Promise<Client> {
  return fetchJSON(`/admin/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function archiveClient(id: string): Promise<void> {
  await fetchJSON(`/admin/clients/${id}`, { method: 'DELETE' });
}

export async function createPass(body: {
  clientId: string;
  planSize: number;
  purchasedAt: string;
}): Promise<{ rawToken: string }> {
  return fetchJSON(`/admin/passes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function listPasses(q?: {
  pageSize?: number;
  pageToken?: string;
  clientId?: string;
}): Promise<Paginated<PassWithClient>> {
  const params = new URLSearchParams();
  if (q?.pageSize) params.set('pageSize', String(q.pageSize));
  if (q?.pageToken) params.set('pageToken', q.pageToken);
  if (q?.clientId) params.set('clientId', q.clientId);
  const qs = params.toString();
  return fetchJSON(`/admin/passes${qs ? `?${qs}` : ''}`);
}

export async function getPassToken(id: string): Promise<{ token: string }> {
  return fetchJSON(`/admin/passes/${id}/token`);
}

export async function listRedeems(): Promise<Redeem[]> {
  const res = await fetchJSON<{ items: Redeem[] }>(`/admin/redeems`);
  return res.items;
}

export async function getStats(): Promise<Stats> {
  return fetchJSON(`/admin/stats`);
}
