export type CardResponse = {
  name: string;
  planSize: number;
  used: number;
  remaining: number;
  expiresAt: string;
  contacts?: Record<string, string>;
  rulesUrl?: string;
  recommendationsUrl?: string;
  news?: { title: string; url: string }[];
};

export async function fetchCard(token: string): Promise<CardResponse> {
  const res = await fetch(`/v1/card?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error('Failed to load card');
  }
  return res.json();
}
