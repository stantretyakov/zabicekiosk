export type RedeemRequest = {
  token: string;
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

export type RedeemDropin = {
  status: 'ok';
  type: 'dropin';
  message: string;
  priceRSD: number;
};

export type ErrorPayload = { status: 'error'; code: string; message: string };

export type RedeemResponse = RedeemPass | RedeemDropin | ErrorPayload;

export type CardResponse = {
  name: string;
  planSize: number;
  used: number;
  remaining: number;
  expiresAt: string;
};
