import { getIdToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_CORE_API_URL || '';

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : API_BASE_URL + path;
  const headers = new Headers(init?.headers);
  const token = await getIdToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers, mode: 'cors' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
