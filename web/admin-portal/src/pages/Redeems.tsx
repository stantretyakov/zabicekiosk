import { useEffect, useState } from 'react';
import { listRedeems } from '../lib/api';
import type { Redeem } from '../types';

export default function Redeems() {
  const [items, setItems] = useState<Redeem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listRedeems()
      .then(setItems)
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
              <td>
                {r.client ? (
                  <>
                    {r.client.parentName} / {r.client.childName}
                    <br />
                    <small>{r.clientId}</small>
                  </>
                ) : (
                  r.clientId || '-'
                )}
              </td>
              <td>{r.delta ?? r.priceRSD ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
