const API_BASE_URL = import.meta.env.VITE_CORE_API_URL || '';

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : API_BASE_URL + path;
  const res = await fetch(url, { ...init, mode: 'cors' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
