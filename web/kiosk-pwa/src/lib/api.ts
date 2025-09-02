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
  // Mock response in development mode
  if (import.meta.env.DEV) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Generate different mock responses based on token
    const token = data.token || data.clientId || '';
    const random = Math.random();
    
    if (random < 0.7) {
      // 70% chance of successful pass redemption
      const remaining = Math.floor(Math.random() * 10) + 1;
      const planSize = remaining + Math.floor(Math.random() * 5) + 1;
      return {
        status: 'ok',
        type: 'pass',
        message: 'Абонемент использован успешно!',
        remaining,
        planSize,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    } else if (random < 0.85) {
      // 15% chance of single visit
      return {
        status: 'ok',
        type: 'single',
        message: 'Разовое посещение зарегистрировано'
      };
    } else if (random < 0.95) {
      // 10% chance of cooldown error
      return {
        status: 'error',
        code: 'COOLDOWN',
        message: 'Попробуйте позже'
      };
    } else {
      // 5% chance of other error
      return {
        status: 'error',
        code: 'INVALID_TOKEN',
        message: 'Недействительный QR код'
      };
    }
  }
  
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
