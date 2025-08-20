import { useEffect, useState } from 'react';

interface Card {
  name: string;
  planSize: number;
  used: number;
  remaining: number;
  expiresAt: string;
}

export default function App() {
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    if (!token) {
      setError('Missing token');
      return;
    }
    fetch(`/v1/card?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed'))))
      .then((data: Card) => setCard(data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p>{error}</p>;
  if (!card) return <p>Loading...</p>;

  return (
    <div>
      <h1>{card.name}</h1>
      <p>Plan: {card.planSize}</p>
      <p>Remaining: {card.remaining}</p>
      <p>Expires: {new Date(card.expiresAt).toLocaleDateString()}</p>
    </div>
  );
}
