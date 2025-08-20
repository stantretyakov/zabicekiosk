import { loginWithGoogle } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <section>
      <h1>Login</h1>
      <button onClick={handleLogin}>Sign in with Google</button>
    </section>
  );
}
