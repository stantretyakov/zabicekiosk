import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { loginWithGoogle, handleRedirectResult } from '../lib/auth';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDevMode] = useState(import.meta.env.DEV);

  useEffect(() => {
    // In dev mode, skip Firebase auth
    if (isDevMode) return;

    // Handle redirect result and subscribe to auth state changes
    handleRedirectResult().catch(() => {});
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      if (user) navigate('/', { replace: true });
    });
    return () => unsub();
  }, [navigate, isDevMode]);

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError(null);
    
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e.message || 'Failed to sign in');
      setBusy(false);
    }
  };

  const handleDevLogin = () => {
    setBusy(true);
    // Simulate loading for better UX
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 800);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏊‍♀️</div>
          </div>
          <h1 className={styles.title}>Swimming Admin</h1>
          <p className={styles.subtitle}>
            Sign in to manage clients, passes, and bookings
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.loginSection}>
          {isDevMode ? (
            <button
              onClick={handleDevLogin}
              disabled={busy}
              className={styles.loginButton}
            >
              {busy ? (
                <>
                  <div className={styles.spinner} />
                  Signing in...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>🚀</span>
                  Continue in Dev Mode
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={busy}
              className={styles.loginButton}
            >
              {busy ? (
                <>
                  <div className={styles.spinner} />
                  Signing in...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </span>
                  Sign in with Google
                </>
              )}
            </button>
          )}
        </div>

        {isDevMode && (
          <div className={styles.devNotice}>
            <div className={styles.devIcon}>🚧</div>
            <div className={styles.devText}>
              <strong>Development Mode</strong>
              <span>Firebase authentication is disabled</span>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Secure access to your swimming facility management system
          </p>
        </div>
      </div>

      <div className={styles.background}>
        <div className={styles.wave1}></div>
        <div className={styles.wave2}></div>
        <div className={styles.wave3}></div>
      </div>
    </div>
  );
}