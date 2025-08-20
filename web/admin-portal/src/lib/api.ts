// web/admin-portal/src/lib/api.ts
import { getIdToken } from './auth';

const API_BASE_URL =
  (import.meta.env.VITE_CORE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  '/api'; // безопасный дефолт

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
