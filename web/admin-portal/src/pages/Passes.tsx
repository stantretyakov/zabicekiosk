import { useEffect, useRef, useState } from 'react';
import { listPasses, getPassToken } from '../lib/api';
import QRCodeStyling from 'qr-code-styling';
import frog from '../assets/frog.svg';
import type { PassWithClient } from '../types';

export default function Passes() {
  const [items, setItems] = useState<PassWithClient[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<{ token: string; url: string } | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!qr || !qrRef.current) return;
    const qrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      type: 'svg',
      data: qr.url,
      image: frog,
      dotsOptions: { type: 'rounded' },
      cornersSquareOptions: { type: 'extra-rounded' },
      imageOptions: { margin: 4 },
    });
    qrRef.current.innerHTML = '';
    qrCode.append(qrRef.current);
  }, [qr]);

  const openQr = async (id: string) => {
    try {
      const res = await getPassToken(id);
      const base =
        (import.meta.env.VITE_CARD_URL_BASE as string | undefined) ||
        window.location.origin + '/card';
      const url = `${base}?token=${encodeURIComponent(res.token)}`;
      setQr({ token: res.token, url });
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

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
              <th></th>
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
                <td>
                  <button onClick={() => openQr(p.id)}>Get QR Code</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {qr && (
        <div className="modal">
          <div className="modal-body">
            <h3>Pass QR</h3>
            <div ref={qrRef}></div>
            <p>
              <code>{qr.token}</code>
            </p>
            <button onClick={() => setQr(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}

