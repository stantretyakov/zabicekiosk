export interface RedeemResponse {
  status: string;
  message: string;
}

export async function redeem(token: string): Promise<RedeemResponse> {
  const res = await fetch('/v1/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, kioskId: 'kiosk-1', ts: new Date().toISOString() }),
  });
  return res.json();
}
