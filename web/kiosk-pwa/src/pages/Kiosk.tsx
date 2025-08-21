import React, { useEffect, useState } from 'react';
import CameraScanner from '../components/CameraScanner';
import Toast from '../components/Toast';
import { redeem } from '../lib/api';
import beep from '../lib/beep';
import styles from './Kiosk.module.css';

interface HistoryItem {
  ts: number;
  text: string;
}

export default function Kiosk() {
  const [toast, setToast] = useState<{ kind: string; message: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const pushHistory = (text: string) => {
    setHistory(h => [{ ts: Date.now(), text }, ...h].slice(0, 5));
  };

  const extractToken = (raw: string): string => {
    try {
      const url = new URL(raw);
      return url.searchParams.get('token') || raw;
    } catch {
      const m = raw.match(/token=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : raw;
    }
  };

  const handleToken = async (raw: string) => {
    const token = extractToken(raw);
    try {
      const res = await redeem(token);
      if (res.status === 'ok') {
        if (res.type === 'pass') {
          const msg = `Учтено. Осталось ${res.remaining} 🐸`;
          setToast({ kind: 'pass', message: msg });
          pushHistory(msg);
        } else {
          const msg = `Посещение учтено. К оплате ${res.priceRSD} RSD`;
          setToast({ kind: 'dropin', message: msg });
          pushHistory(msg);
        }
        beep(true);
      } else {
        let kind: string = 'error';
        if (res.code === 'COOLDOWN' || res.code === 'DUPLICATE') kind = 'cooldown';
        if (res.code === 'OUT_OF_HOURS') kind = 'out';
        setToast({ kind, message: res.message });
        pushHistory(res.message);
        beep(false);
      }
    } catch (err) {
      console.error(err);
      const msg = 'Ошибка соединения';
      setToast({ kind: 'error', message: msg });
      pushHistory(msg);
      beep(false);
    } finally {
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className={styles.root}>
      {!online && <div className={styles.offline}>Нет соединения</div>}
      <CameraScanner onToken={handleToken} />
      {toast && <Toast kind={toast.kind as any} message={toast.message} />}
      {history.length > 0 && (
        <ul className={styles.history}>
          {history.map(h => (
            <li key={h.ts}>{new Date(h.ts).toLocaleTimeString()} - {h.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
