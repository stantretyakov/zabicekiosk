// web/admin-portal/src/lib/api.ts
import { getIdToken } from './auth';
import type { Client, Paginated, PassWithClient, Redeem, Stats } from '../types';
import { 
  mockClients, 
  mockPasses, 
  mockRedeems, 
  filterClients, 
  paginateArray, 
  generateMockToken 
} from './mockData';

const API_BASE_URL = (() => {
  const env = import.meta.env.VITE_CORE_API_URL as string | undefined;
  if (!env) return '/api/v1';
  const base = env.replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
})();

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  const token = await getIdToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
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
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    const filtered = filterClients(mockClients, {
      search: q.search,
      active: q.active,
      orderBy: q.orderBy,
      order: q.order,
    });
    
    const paginated = paginateArray(filtered, q.pageSize || 20, q.pageToken);
    return paginated;
  }
  
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
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    const newClient: Client = {
      id: `client-${Date.now()}`,
      parentName: body.parentName || '',
      childName: body.childName || '',
      phone: body.phone,
      telegram: body.telegram,
      instagram: body.instagram,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockClients.unshift(newClient);
    return newClient;
  }
  
  return fetchJSON(`/admin/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateClient(id: string, body: Partial<Client>): Promise<Client> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
    
    const clientIndex = mockClients.findIndex(c => c.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }
    
    const updatedClient = {
      ...mockClients[clientIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    mockClients[clientIndex] = updatedClient;
    return updatedClient;
  }
  
  return fetchJSON(`/admin/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function archiveClient(id: string): Promise<void> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const clientIndex = mockClients.findIndex(c => c.id === id);
    if (clientIndex !== -1) {
      mockClients[clientIndex] = {
        ...mockClients[clientIndex],
        active: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return;
  }
  
  await fetchJSON(`/admin/clients/${id}`, { method: 'DELETE' });
}

export async function importClients(data: any[]): Promise<{ count: number }> {
  if (import.meta.env.DEV) {
    const items = Array.isArray(data) ? data : [];
    items.forEach((c, i) => {
      mockClients.unshift({
        id: `client-${Date.now()}-${i}`,
        parentName: c.parentName || '',
        childName: c.childName || '',
        phone: c.phone ?? null,
        telegram: c.telegram ?? null,
        instagram: c.instagram ?? null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    return { count: items.length };
  }

  const sanitized = data.map(c => ({
    parentName: c.parentName,
    childName: c.childName,
    phone: c.phone ?? null,
    telegram: c.telegram ?? null,
    instagram: c.instagram ?? null,
  }));
  return fetchJSON(`/admin/clients/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitized),
  });
}

export async function importClientsFile(file: File): Promise<{ count: number }> {
  if (import.meta.env.DEV) {
    const text = await file.text();
    const json = JSON.parse(text);
    return importClients(json);
  }
  const form = new FormData();
  form.append('file', file);
  return fetchJSON(`/admin/clients/import`, {
    method: 'POST',
    body: form,
  });
}

export async function createPass(body: {
  clientId: string;
  planSize: number;
  purchasedAt: string;
}): Promise<void> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const client = mockClients.find(c => c.id === body.clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const newPass: PassWithClient = {
      id: `pass-${Date.now()}`,
      clientId: body.clientId,
      planSize: body.planSize,
      purchasedAt: body.purchasedAt,
      remaining: body.planSize,
      type: body.planSize === 1 ? 'single' : 'subscription',
      client,
    };
    
    mockPasses.unshift(newPass);
    return;
  }
  
  await fetchJSON(`/admin/passes`, {
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
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    let filtered = [...mockPasses];
    
    if (q?.clientId) {
      filtered = filtered.filter(pass => pass.clientId === q.clientId);
    }
    
    // Sort by purchase date (newest first)
    filtered.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    
    const paginated = paginateArray(filtered, q?.pageSize || 20, q?.pageToken);
    return paginated;
  }
  
  const params = new URLSearchParams();
  if (q?.pageSize) params.set('pageSize', String(q.pageSize));
  if (q?.pageToken) params.set('pageToken', q.pageToken);
  if (q?.clientId) params.set('clientId', q.clientId);
  const qs = params.toString();
  return fetchJSON(`/admin/passes${qs ? `?${qs}` : ''}`);
}

export async function getClientToken(id: string): Promise<{ token: string }> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const client = mockClients.find(c => c.id === id);
    if (!client) {
      throw new Error('Client not found');
    }
    
    return { token: generateMockToken(id) };
  }
  
  return fetchJSON(`/admin/clients/${id}/token`);
}

export async function deletePass(id: string): Promise<void> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const passIndex = mockPasses.findIndex(p => p.id === id);
    if (passIndex !== -1) {
      mockPasses.splice(passIndex, 1);
    }
    return;
  }
  
  await fetchJSON(`/admin/passes/${id}`, { method: 'DELETE' });
}

export async function listRedeems(): Promise<Redeem[]> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Sort by timestamp (newest first)
    const sorted = [...mockRedeems].sort((a, b) => 
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
    
    return sorted;
  }
  
  const res = await fetchJSON<{ items: Redeem[] }>(`/admin/redeems`);
  return res.items;
}

export async function getStats(): Promise<Stats> {
  // Use mock data in development mode
  if (import.meta.env.DEV) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalClients = mockClients.length;
    const activeClients = mockClients.filter(c => c.active).length;
    const clientRetention = totalClients ? (activeClients / totalClients) * 100 : 0;

    const activePassDocs = mockPasses.filter(p => p.remaining > 0);
    const activePasses = activePassDocs.length;

    const passTypeCounts: Record<string, number> = {};
    const upcomingExpirations = { next7Days: 0, next14Days: 0, next30Days: 0 };
    for (const p of activePassDocs) {
      const label = p.planSize === 1 ? 'Single' : `${p.planSize}-Session`;
      passTypeCounts[label] = (passTypeCounts[label] || 0) + 1;
      const expiryDate = new Date(p.purchasedAt);
      expiryDate.setDate(expiryDate.getDate() + 30);
      const days = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 7) upcomingExpirations.next7Days++;
      if (days <= 14) upcomingExpirations.next14Days++;
      if (days <= 30) upcomingExpirations.next30Days++;
    }
    const passTypeDistribution = Object.entries(passTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: activePasses ? Math.round((count / activePasses) * 1000) / 10 : 0,
    }));

    const redeems7d = mockRedeems.filter(r =>
      new Date(r.ts).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    let dropInRevenue = 0;
    let visitsThisMonth = 0;
    let visitsLastMonth = 0;
    const redeemsByDayMap: Record<string, number> = {};
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    for (const r of mockRedeems) {
      const ts = new Date(r.ts);
      if (ts >= sevenDaysAgo) {
        const key = r.ts.slice(0, 10);
        redeemsByDayMap[key] = (redeemsByDayMap[key] || 0) + 1;
      }
      if (r.kind === 'dropin' && r.priceRSD && ts >= startOfMonth) {
        dropInRevenue += r.priceRSD;
      }
      if (ts >= startOfMonth) {
        visitsThisMonth++;
      } else if (ts >= startOfLastMonth && ts <= endOfLastMonth) {
        visitsLastMonth++;
      }
    }
    const redeemsByDay = Object.keys(redeemsByDayMap)
      .sort()
      .map(date => ({ date, count: redeemsByDayMap[date] }));

    const visitStats = {
      thisMonth: visitsThisMonth,
      lastMonth: visitsLastMonth,
      growth: visitsLastMonth
        ? ((visitsThisMonth - visitsLastMonth) / visitsLastMonth) * 100
        : 0,
    };

    const revenueBreakdown = {
      passes: 0,
      dropIns: dropInRevenue,
      total: dropInRevenue,
    };

    const mockStats: Stats = {
      activePasses,
      redeems7d,
      dropInRevenue,
      expiring14d: upcomingExpirations.next14Days,
      redeemsByDay,
      recentRedeems: mockRedeems.slice(0, 5),
      totalClients,
      activeClients,
      clientRetention: Number(clientRetention.toFixed(1)),
      mrr: revenueBreakdown.total,
      grr: revenueBreakdown.total,
      visitStats,
      revenueBreakdown,
      passTypeDistribution,
      upcomingExpirations,
    };

    return mockStats;
  }
  
  return fetchJSON(`/admin/stats`);
}
