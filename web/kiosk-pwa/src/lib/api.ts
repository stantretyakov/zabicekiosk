export interface RedeemPassResponse {
  status: 'ok';
  type: 'pass';
  message: string;
  remaining: number;
  planSize: number;
  expiresAt: string;
}

export interface RedeemSingleResponse {
  status: 'ok';
  type: 'single';
  message: string;
}

export interface RedeemErrorResponse {
  status: 'error';
  code: string;
  message: string;
}

export type RedeemResponse =
  | RedeemPassResponse
  | RedeemSingleResponse
  | RedeemErrorResponse;

const API_BASE_URL = (() => {
  const env = import.meta.env.VITE_CORE_API_URL as string | undefined;
  if (!env) return '/api/v1';
  const base = env.replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
})();

function getKioskId(): string {
  let id = localStorage.getItem('kioskId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('kioskId', id);
  }
  return id;
}

export async function registerKiosk(): Promise<void> {
  const kioskConfig = localStorage.getItem('kioskConfig');
  const config = kioskConfig ? JSON.parse(kioskConfig) : {};
  
  await fetch(`${API_BASE_URL}/kiosks/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      kioskId: getKioskId(),
      location: config.location,
      description: config.description,
      version: '1.0.0'
    }),
  });
}

export async function redeem(data: {
  token?: string;
  clientId?: string;
}): Promise<RedeemResponse> {
  const res = await fetch(`${API_BASE_URL}/redeem`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({ ...data, kioskId: getKioskId(), ts: new Date().toISOString() }),
  });
  return res.json();
}
