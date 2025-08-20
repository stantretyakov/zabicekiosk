import { useEffect, useState } from 'react';
import { loginWithGoogle, handleRedirectResult } from '../lib/auth';
import { useEffect, useState } from 'react';
import { loginWithGoogle } from '../lib/auth';
import { fetchJSON } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      await fetchJSON('/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    handleRedirectResult();
    handleLogin();
  }, []);

  return (
    <section>
      <h1>Login</h1>
      {error && <p>{error}</p>}
      <button onClick={handleLogin}>Sign in with Google</button>
    </section>
  );
}
