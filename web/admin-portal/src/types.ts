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
  basePlanSize?: number;
  purchasedAt: string;
  remaining: number;
  type: 'subscription' | 'single';
  lastVisit?: string;
  validityDays?: number;
  expiresAt?: string;
  renewedAt?: string;
  renewalCount?: number;
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
  note?: string;
};

export type Stats = {
  activePasses: number;
  redeems7d: number;
  dropInRevenue: number;
  expiring14d: number;
  redeemsByDay: { date: string; count: number }[];
  recentRedeems: Redeem[];
  totalClients: number;
  activeClients: number;
  clientRetention: number;
  mrr: number;
  grr: number;
  visitStats: { thisMonth: number; lastMonth: number; growth: number };
  revenueBreakdown: { passes: number; dropIns: number; total: number };
  passTypeDistribution: { type: string; count: number; percentage: number }[];
  upcomingExpirations: { next7Days: number; next14Days: number; next30Days: number };
};
