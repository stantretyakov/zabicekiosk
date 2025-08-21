import { initializeApp } from 'firebase/app';
import {
  getAuth, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged as fbOnAuthStateChanged, User
} from 'firebase/auth';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    // iOS часто блокирует popup — сразу уходим в redirect
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (e:any) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
}

export async function handleRedirectResult() {
  try { await getRedirectResult(auth); } catch { /* ignore */ }
}

export function logout() { return signOut(auth); }

export function onAuthStateChanged(cb: (u: User|null)=>void) {
  return fbOnAuthStateChanged(auth, cb, (err) => {
    console.error('[auth] onAuthStateChanged error', err);
    cb(null); // чтобы не зависнуть в loading
  });
}

export async function getIdToken(): Promise<string|null> {
  const u = auth.currentUser;
  return u ? await u.getIdToken() : null;
}
