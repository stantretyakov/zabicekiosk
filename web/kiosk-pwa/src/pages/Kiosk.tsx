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
  const [showLog, setShowLog] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ greeting: string; details: string } | null>(null);

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
  
  const handleToken = async (token: string) => {
    try {
      const res = await redeem(token);
      if (res.status === 'ok') {
        let details: string;
        if (res.type === 'pass') {
          details = `Занятие учтено. Осталось ${res.remaining} занятий.`;
        } else {
          details = `Занятие учтено. К оплате ${res.priceRSD} RSD.`;
        }
        setSuccessInfo({ greeting: res.message, details });
        pushHistory(details);
        beep(true);
      } else {
        let kind: string = 'error';
        if (res.code === 'COOLDOWN' || res.code === 'DUPLICATE') kind = 'cooldown';
        if (res.code === 'OUT_OF_HOURS') kind = 'out';
        setToast({ kind, message: res.message });
        pushHistory(res.message);
        setSuccessInfo(null);
        beep(false);
      }
    } catch (err) {
      console.error(err);
      const msg = 'Ошибка соединения';
      setToast({ kind: 'error', message: msg });
      pushHistory(msg);
      setSuccessInfo(null);
      beep(false);
    } finally {
      setTimeout(() => setToast(null), 2000);
      setTimeout(() => setSuccessInfo(null), 5000);
    }
  };

  return (
    <div className={styles.root}>
      {!online && <div className={styles.offline}>Нет соединения</div>}
      <CameraScanner onToken={handleToken} />
      {successInfo && (
        <div className={styles.successOverlay}>
          <div>{successInfo.greeting}</div>
          <div>{successInfo.details}</div>
        </div>
      )}
      {toast && <Toast kind={toast.kind as any} message={toast.message} />}
      {showLog && history.length > 0 && (
        <ul className={styles.history}>
          {history.map(h => (
            <li key={h.ts}>{new Date(h.ts).toLocaleTimeString()} - {h.text}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={styles.logToggle}
        onClick={() => setShowLog(s => !s)}
      >
        {showLog ? 'Hide scanner log' : 'Show scanner log'}
      </button>
    </div>
  );
}
