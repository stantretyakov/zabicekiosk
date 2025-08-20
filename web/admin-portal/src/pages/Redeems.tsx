import { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/api';

interface Redeem {
  id: string;
  ts: string;
  kind: string;
  clientId?: string;
  delta?: number;
  priceRSD?: number;
}

export default function Redeems() {
  const [items, setItems] = useState<Redeem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJSON<{ items: Redeem[] }>('/v1/admin/redeems')
      .then(res => setItems(res.items))
      .catch(e => setError(e.message));
  }, []);

  return (
    <section>
      <h1>Redeems</h1>
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Kind</th>
            <th>Client</th>
            <th>Delta/Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.ts).toLocaleString()}</td>
              <td>{r.kind}</td>
              <td>{r.clientId || '-'}</td>
              <td>{r.delta ?? r.priceRSD ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
