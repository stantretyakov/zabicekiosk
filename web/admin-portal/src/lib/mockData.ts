import { Client, PassWithClient, Redeem } from '../types';

// Mock clients data for development
export const mockClients: Client[] = [
  {
    id: 'client-1',
    parentName: 'Ana Petrović',
    childName: 'Marko Petrović',
    phone: '+381 60 123 4567',
    telegram: 'ana_petrovic',
    instagram: 'ana.petrovic.swim',
    active: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-2',
    parentName: 'Milica Jovanović',
    childName: 'Stefan Jovanović',
    phone: '+381 64 987 6543',
    telegram: 'milica_j',
    active: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-3',
    parentName: 'Nikola Stojanović',
    childName: 'Luka Stojanović',
    phone: '+381 63 555 1234',
    instagram: 'nikola.stojanovic',
    active: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-4',
    parentName: 'Jelena Nikolić',
    childName: 'Mina Nikolić',
    phone: '+381 65 777 8888',
    telegram: 'jelena_nikolic',
    instagram: 'jelena.mina.swim',
    active: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-5',
    parentName: 'Marija Đorđević',
    childName: 'Teodora Đorđević',
    phone: '+381 66 333 2222',
    active: false,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-6',
    parentName: 'Stefan Mitrović',
    childName: 'Aleksa Mitrović',
    phone: '+381 69 444 5555',
    telegram: 'stefan_mitrovic',
    active: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-7',
    parentName: 'Jovana Popović',
    childName: 'Anja Popović',
    phone: '+381 62 666 7777',
    instagram: 'jovana.popovic.mom',
    active: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-8',
    parentName: 'Aleksandar Ilić',
    childName: 'Vuk Ilić',
    phone: '+381 61 888 9999',
    telegram: 'aleksandar_ilic',
    instagram: 'aleksandar.ilic.dad',
    active: true,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-9',
    parentName: 'Tamara Stanković',
    childName: 'Milica Stanković',
    phone: '+381 67 111 2222',
    active: false,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-10',
    parentName: 'Miloš Radovanović',
    childName: 'Petar Radovanović',
    phone: '+381 68 333 4444',
    telegram: 'milos_radovanovic',
    active: true,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-11',
    parentName: 'Dragana Vasić',
    childName: 'Sofija Vasić',
    phone: '+381 64 555 6666',
    instagram: 'dragana.vasic.swim',
    active: true,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-12',
    parentName: 'Nenad Marković',
    childName: 'Filip Marković',
    phone: '+381 63 777 8888',
    telegram: 'nenad_markovic',
    instagram: 'nenad.markovic.fitness',
    active: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-13',
    parentName: 'Snežana Đurić',
    childName: 'Nemanja Đurić',
    phone: '+381 65 999 0000',
    active: false,
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-14',
    parentName: 'Vladimir Kostić',
    childName: 'Ana Kostić',
    phone: '+381 66 111 3333',
    telegram: 'vladimir_kostic',
    active: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'client-15',
    parentName: 'Ivana Simić',
    childName: 'Marija Simić',
    phone: '+381 67 222 4444',
    instagram: 'ivana.simic.mom',
    active: true,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock passes data
export const mockPasses: PassWithClient[] = [
  {
    id: 'pass-1',
    clientId: 'client-1',
    planSize: 10,
    purchasedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 7,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[0],
  },
  {
    id: 'pass-2',
    clientId: 'client-2',
    planSize: 5,
    purchasedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 1,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[1],
  },
  {
    id: 'pass-3',
    clientId: 'client-3',
    planSize: 1,
    purchasedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 1,
    type: 'single',
    client: mockClients[2],
  },
  {
    id: 'pass-4',
    clientId: 'client-4',
    planSize: 20,
    purchasedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 5,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[3],
  },
  {
    id: 'pass-5',
    clientId: 'client-6',
    planSize: 8,
    purchasedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 6,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[5],
  },
  {
    id: 'pass-6',
    clientId: 'client-7',
    planSize: 15,
    purchasedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 12,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[6],
  },
  {
    id: 'pass-7',
    clientId: 'client-8',
    planSize: 10,
    purchasedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 3,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[7],
  },
  {
    id: 'pass-8',
    clientId: 'client-10',
    planSize: 5,
    purchasedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 4,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[9],
  },
  {
    id: 'pass-9',
    clientId: 'client-11',
    planSize: 12,
    purchasedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 9,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[10],
  },
  {
    id: 'pass-10',
    clientId: 'client-12',
    planSize: 6,
    purchasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 5,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[11],
  },
  {
    id: 'pass-11',
    clientId: 'client-14',
    planSize: 1,
    purchasedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 1,
    type: 'single',
    client: mockClients[13],
  },
  {
    id: 'pass-12',
    clientId: 'client-15',
    planSize: 10,
    purchasedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    remaining: 8,
    type: 'subscription',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    client: mockClients[14],
  },
];

// Mock redeems data
export const mockRedeems: Redeem[] = [
  {
    id: 'redeem-1',
    ts: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-1',
    delta: -1,
    client: mockClients[0],
  },
  {
    id: 'redeem-2',
    ts: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    kind: 'dropin',
    clientId: 'client-3',
    priceRSD: 1500,
    client: mockClients[2],
  },
  {
    id: 'redeem-3',
    ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-2',
    delta: -1,
    client: mockClients[1],
  },
  {
    id: 'redeem-4',
    ts: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-4',
    delta: -1,
    client: mockClients[3],
  },
  {
    id: 'redeem-5',
    ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'dropin',
    clientId: 'client-6',
    priceRSD: 1500,
    client: mockClients[5],
  },
  {
    id: 'redeem-6',
    ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-7',
    delta: -1,
    client: mockClients[6],
  },
  {
    id: 'redeem-7',
    ts: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-8',
    delta: -1,
    client: mockClients[7],
  },
  {
    id: 'redeem-8',
    ts: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'dropin',
    priceRSD: 1500,
  },
  {
    id: 'redeem-9',
    ts: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-10',
    delta: -1,
    client: mockClients[9],
  },
  {
    id: 'redeem-10',
    ts: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'pass',
    clientId: 'client-11',
    delta: -1,
    client: mockClients[10],
  },
];

// Helper functions for filtering and pagination
export function filterClients(
  clients: Client[],
  filters: {
    search?: string;
    active?: 'all' | 'true' | 'false';
    orderBy?: 'createdAt' | 'parentName';
    order?: 'asc' | 'desc';
  }
): Client[] {
  let filtered = [...clients];

  // Apply search filter
  if (filters.search) {
    const normalize = (value?: string | null) =>
      (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const collapse = (value: string) => value.replace(/\s+/g, ' ').trim();
    const stripSeparators = (value: string) => value.replace(/[^a-z0-9\u0400-\u04FF]+/g, '');
    const digitsOnly = (value?: string | null) => (value ?? '').replace(/\D+/g, '');

    const searchNormalized = collapse(normalize(filters.search));
    const searchStripped = stripSeparators(searchNormalized);
    const searchDigits = digitsOnly(filters.search);

    filtered = filtered.filter(client => {
      const candidateValues = [
        client.parentName,
        client.childName,
        client.telegram ? `@${client.telegram}` : client.telegram,
        client.instagram,
        client.phone,
        client.id,
      ];

      const matchesText = searchNormalized
        ? candidateValues.some(value => {
            const normalized = collapse(normalize(value));
            if (!normalized) return false;
            const stripped = stripSeparators(normalized);
            return (
              normalized.includes(searchNormalized) ||
              (!!searchStripped && stripped.includes(searchStripped))
            );
          })
        : false;

      const matchesDigits = searchDigits
        ? candidateValues.some(value => digitsOnly(value).includes(searchDigits))
        : false;

      return matchesText || matchesDigits;
    });
  }

  // Apply active filter
  if (filters.active !== 'all') {
    const isActive = filters.active === 'true';
    filtered = filtered.filter(client => client.active === isActive);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue: string | Date;
    let bValue: string | Date;

    if (filters.orderBy === 'parentName') {
      aValue = a.parentName;
      bValue = b.parentName;
    } else {
      aValue = new Date(a.createdAt || 0);
      bValue = new Date(b.createdAt || 0);
    }

    if (filters.order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return filtered;
}

export function paginateArray<T>(
  items: T[],
  pageSize: number,
  pageToken?: string
): { items: T[]; nextPageToken?: string } {
  let startIndex = 0;
  
  if (pageToken) {
    const tokenIndex = items.findIndex((item: any) => item.id === pageToken);
    if (tokenIndex !== -1) {
      startIndex = tokenIndex + 1;
    }
  }

  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  let nextPageToken: string | undefined;
  if (endIndex < items.length) {
    nextPageToken = (paginatedItems[paginatedItems.length - 1] as any).id;
  }

  return {
    items: paginatedItems,
    nextPageToken
  };
}

export function generateMockToken(clientId: string): string {
  // Generate a consistent token based on client ID for development
  const hash = clientId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash).toString(16).padStart(8, '0') + 
         Date.now().toString(16).slice(-8);
}