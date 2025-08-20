import { useState } from 'react';
import { fetchJSON } from '../lib/api';

export default function Passes() {
  const [clientId, setClientId] = useState('');
  const [planSize, setPlanSize] = useState(4);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchJSON<{ rawToken: string }>('/v1/admin/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          planSize,
          purchasedAt: new Date().toISOString(),
        }),
      });
      setResult(`Token: ${res.rawToken}`);
    } catch (e) {
      setResult((e as Error).message);
    }
  };

  return (
    <section>
      <h1>Passes</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          placeholder="Client ID"
        />
        <select value={planSize} onChange={e => setPlanSize(Number(e.target.value))}>
          <option value={4}>4</option>
          <option value={8}>8</option>
        </select>
        <button type="submit">Create</button>
      </form>
      {result && <p>{result}</p>}
    </section>
  );
}
