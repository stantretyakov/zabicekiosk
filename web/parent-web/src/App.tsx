import { useEffect, useState } from 'react';
import './App.css';

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

  if (error) return <p className="status">{error}</p>;
  if (!card) return <p className="status">Loading...</p>;

  return (
    <div className="card-container">
      <h1 className="card-name">{card.name}</h1>
      <div className="card-details">
        <p>
          <span className="label">Plan:</span> {card.planSize}
        </p>
        <p>
          <span className="label">Remaining:</span> {card.remaining}
        </p>
        <p>
          <span className="label">Expires:</span> {new Date(card.expiresAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
