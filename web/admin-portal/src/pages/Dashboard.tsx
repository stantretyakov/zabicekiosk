import { useEffect, useState } from 'react';
import { getStats } from '../lib/api';
import type { Stats } from '../types';
import KpiCard from '../components/KpiCard';
import LineChart from '../components/LineChart';
import DataTable from '../components/DataTable';

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
      {!stats ? (
        <p>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              marginBottom: '1rem',
            }}
          >
            <KpiCard title="Active passes" value={stats.activePasses} />
            <KpiCard title="Redeems (7d)" value={stats.redeems7d} />
            <KpiCard title="Drop-in revenue" value={`RSD ${stats.dropInRevenue}`} />
            <KpiCard title="Expiring (14d)" value={stats.expiring14d} />
          </div>
          <LineChart data={stats.redeemsByDay} />
          <h2 style={{ marginTop: '1rem' }}>Recent redeems</h2>
          <DataTable>
            <thead>
              <tr>
                <th>Time</th>
                <th>Kind</th>
                <th>Client</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRedeems.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.ts).toLocaleString()}</td>
                  <td>{r.kind}</td>
                  <td>{r.clientId || ''}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </>
      )}
    </section>
  );
}

