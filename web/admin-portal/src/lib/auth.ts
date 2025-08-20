// web/admin-portal/src/lib/auth.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged as fbOnAuthStateChanged, User, browserLocalPersistence, setPersistence
} from 'firebase/auth';

const apiKey      = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain  = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const projectId   = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

if (!apiKey || !authDomain) {
  console.error('[auth] Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_AUTH_DOMAIN');
  // Не бросаем исключение здесь, чтобы не убить рендер целиком — App покажет экран логина.
}

const app  = initializeApp({ apiKey: apiKey!, authDomain: authDomain!, projectId });
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    // На iOS часто блочит popup — сразу редирект-логин
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (e: any) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
}

export async function handleRedirectResult() {
  try { await getRedirectResult(auth); } catch (e) { console.warn('Redirect result error', e); }
}

export function logout() { return signOut(auth); }

export function onAuthStateChanged(cb: (user: User|null) => void) {
  return fbOnAuthStateChanged(auth, cb, (err) => {
    console.error('[auth] onAuthStateChanged error', err);
    cb(null); // не зависаем в loading
  });
}

export async function getIdToken(): Promise<string|null> {
  const u = auth.currentUser;
  return u ? await u.getIdToken() : null;
}
