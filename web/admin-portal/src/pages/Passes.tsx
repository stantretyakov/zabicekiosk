import { useEffect, useState } from 'react';
import { listPasses } from '../lib/api';
import type { PassWithClient } from '../types';

export default function Passes() {
  const [items, setItems] = useState<PassWithClient[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listPasses()
      .then(res => {
        const unique = new Map<string, PassWithClient>();
        for (const p of res.items) {
          if (p.remaining > 0 && !unique.has(p.clientId)) {
            unique.set(p.clientId, p);
          }
        }
        setItems(Array.from(unique.values()));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // QR codes are shown on client cards only

  return (
    <section>
      <h1>Passes</h1>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No passes yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Type</th>
              <th>Remaining</th>
              <th>Last visit</th>
              
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  {p.client.parentName} / {p.client.childName}
                </td>
                <td>{p.type}</td>
                <td>
                  {p.remaining}/{p.planSize}
                </td>
                <td>{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : '-'}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
    </section>
  );
}

