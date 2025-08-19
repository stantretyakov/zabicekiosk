import { useEffect, useState } from 'react';
import { fetchCard, CardResponse } from '../lib/api';

export default function Card() {
  const [data, setData] = useState<CardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setError('Missing token');
      return;
    }
    fetchCard(token)
      .then(setData)
      .catch(() => setError('Failed to load card'));
  }, []);

  if (error) {
    return <p>{error}</p>;
  }
  if (!data) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>{data.name}</h1>
      <p>
        {data.used}/{data.planSize} used — {data.remaining} remaining
      </p>
      <p>Expires: {new Date(data.expiresAt).toLocaleDateString()}</p>
      {data.contacts && (
        <ul>
          {Object.entries(data.contacts).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
      )}
      {data.rulesUrl && (
        <p>
          <a href={data.rulesUrl}>Rules</a>
        </p>
      )}
      {data.recommendationsUrl && (
        <p>
          <a href={data.recommendationsUrl}>Recommendations</a>
        </p>
      )}
      {data.news && data.news.length > 0 && (
        <ul>
          {data.news.map((n) => (
            <li key={n.url}>
              <a href={n.url}>{n.title}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
