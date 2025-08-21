import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { loginWithGoogle, handleRedirectResult } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    // Завершаем redirect‑flow (iOS) и подписываемся на Auth
    handleRedirectResult().catch(() => {});
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      if (u) navigate('/', { replace: true });  // редиректим только когда user реально появился
    });
    return () => unsub();
  }, [navigate]);

  const handleClick = async () => {
    setBusy(true); setError(null);
    try {
      await loginWithGoogle();   // popup или redirect; дальше нас перенесёт onAuthStateChanged
    } catch (e:any) {
      setError(e.message || String(e));
      setBusy(false);
    }
  };

  return (
    <section style={{ padding: 16 }}>
      <h1>Login</h1>
      {error && <p style={{ color:'#c00' }}>{error}</p>}
      <button onClick={handleClick} disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in with Google'}
      </button>
    </section>
  );
}
