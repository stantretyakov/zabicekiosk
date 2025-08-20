import { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/api';

interface Client {
  id: string;
  parentName: string;
  childName: string;
}

export default function Clients() {
  const [items, setItems] = useState<Client[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJSON<{ items: Client[] }>('/v1/admin/clients')
      .then((res) => setItems(res.items))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h1>Clients</h1>
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Parent</th>
            <th>Child</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.parentName}</td>
              <td>{c.childName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
