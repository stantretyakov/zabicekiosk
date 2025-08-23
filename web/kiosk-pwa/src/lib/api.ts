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

const API_BASE_URL =
  (import.meta.env.VITE_CORE_API_URL as string | undefined) ??
  '/api/v1';

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
    body: JSON.stringify({ ...data, kioskId: 'kiosk-1', ts: new Date().toISOString() }),
  });
  return res.json();
}
