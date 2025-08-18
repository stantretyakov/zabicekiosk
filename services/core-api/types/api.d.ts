export type RedeemRequest = { token: string; kioskId: string; ts: string };
export type RedeemOk = { status: 'ok'; message: string };
export type ErrorPayload = { status: 'error'; code: string; message: string };
