import { initializeApp } from 'firebase/app';
import {
  getAuth, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged as fbOnAuthStateChanged, User, Auth
} from 'firebase/auth';

// Initialize Firebase only if API key is provided
let auth: Auth | null = null;

if (import.meta.env.VITE_FIREBASE_API_KEY) {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'zabicekiosk.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  });
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
}

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase not initialized - running in development mode');
  }
  
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
  if (!auth) return;
  try { await getRedirectResult(auth); } catch { /* ignore */ }
}

export function logout() { 
  if (!auth) {
    throw new Error('Firebase not initialized - running in development mode');
  }
  return signOut(auth); 
}

export function onAuthStateChanged(cb: (u: User|null)=>void) {
  if (!auth) {
    // In dev mode without Firebase, immediately call callback with null
    cb(null);
    return () => {}; // Return empty unsubscribe function
  }
  
  return fbOnAuthStateChanged(auth, cb, (err) => {
    console.error('[auth] onAuthStateChanged error', err);
    cb(null); // чтобы не зависнуть в loading
  });
}

export async function getIdToken(): Promise<string|null> {
  if (!auth) return null;
  const u = auth.currentUser;
  return u ? await u.getIdToken() : null;
}
