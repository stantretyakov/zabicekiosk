export type Client = {
  id: string;
  parentName: string;
  childName: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  items: T[];
  nextPageToken?: string;
};

export type Pass = {
  id: string;
  clientId: string;
  planSize: number;
  purchasedAt: string;
  remaining: number;
  type: 'subscription' | 'single';
  lastVisit?: string;
};

export type PassWithClient = Pass & {
  client: Client;
};

export type Redeem = {
  id: string;
  ts: string;
  kind: string;
  clientId?: string;
  delta?: number;
  priceRSD?: number;
};

export type Stats = {
  sales: number;
  visits: number;
};
