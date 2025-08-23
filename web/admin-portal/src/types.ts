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
  token?: string;
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
  client?: Client;
};

export type Stats = {
  activePasses: number;
  redeems7d: number;
  dropInRevenue: number;
  expiring14d: number;
  redeemsByDay: { date: string; count: number }[];
  recentRedeems: Redeem[];
};
