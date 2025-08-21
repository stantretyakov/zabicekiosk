import { useEffect, useState } from 'react';
import { getStats } from '../lib/api';
import type { Stats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(e => setError(e.message));
  }, []);

  return (
    <section>
      <h1>Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {stats ? (
        <ul>
          <li>Sales: {stats.sales}</li>
          <li>Visits: {stats.visits}</li>
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </section>
  );
}

