import { PassData } from '../components/PassCard';

// Mock data for development
export const mockPassData: PassData[] = [
  {
    name: 'Анна Петрович',
    childName: 'Марко Петрович',
    planSize: 10,
    used: 3,
    remaining: 7,
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    passType: 'subscription',
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    name: 'Милица Йованович',
    childName: 'Стефан Йованович',
    planSize: 5,
    used: 4,
    remaining: 1,
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now (expiring soon)
    token: 'xyz789abc123def456ghi789jkl012mno345pqr678stu901',
    passType: 'subscription',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    name: 'Никола Стоянович',
    childName: 'Лука Стоянович',
    planSize: 1,
    used: 0,
    remaining: 1,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    token: 'single123visit456token789abc012def345ghi678jkl901',
    passType: 'single',
  },
  {
    name: 'Елена Николич',
    childName: 'Мина Николич',
    planSize: 20,
    used: 15,
    remaining: 5,
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    token: 'premium789pass123token456abc789def012ghi345jkl678',
    passType: 'subscription',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    name: 'Мария Джорджевич',
    childName: 'Теодора Джорджевич',
    planSize: 8,
    used: 8,
    remaining: 0,
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (expired)
    token: 'expired123token456abc789def012ghi345jkl678mno901',
    passType: 'subscription',
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
];

export function getMockDataByToken(token: string): PassData | null {
  return mockPassData.find(pass => pass.token === token) || null;
}

export function getRandomMockData(): PassData {
  const randomIndex = Math.floor(Math.random() * mockPassData.length);
  return mockPassData[randomIndex];
}