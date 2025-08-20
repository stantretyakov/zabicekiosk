import { useEffect, useState } from 'react';
import { fetchJSON } from '../lib/api';

interface Client {
  id: string;
  name: string;
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
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
