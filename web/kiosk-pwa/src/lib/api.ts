export interface RedeemResponse {
  status: string;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_CORE_API_URL || '';

export async function redeem(token: string): Promise<RedeemResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/redeem`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, kioskId: 'kiosk-1', ts: new Date().toISOString() }),
  });
  return res.json();
}
