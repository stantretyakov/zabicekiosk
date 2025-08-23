export type RedeemRequest = {
  token?: string;
  clientId?: string;
  kioskId: string;
  ts: string;
};

export type RedeemPass = {
  status: 'ok';
  type: 'pass';
  message: string;
  remaining: number;
  planSize: number;
  expiresAt: string;
};

export type RedeemSingle = {
  status: 'ok';
  type: 'single';
  message: string;
};

export type ErrorPayload = { status: 'error'; code: string; message: string };

export type RedeemResponse = RedeemPass | RedeemSingle | ErrorPayload;

export type CardResponse = {
  name: string;
  planSize: number;
  used: number;
  remaining: number;
  expiresAt: string;
};
