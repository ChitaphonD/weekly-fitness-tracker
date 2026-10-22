// Cloud sync: the tracker keeps writing localStorage as before, and this module
// mirrors those keys into Firestore at users/{uid}.
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { clearPhotos } from './photos';

const KEYS = ['wft-week-v1', 'wft-data-v1', 'wft-custom-v1', 'wft-theme-v1'];
const OWNER = 'wft-owner-v1';

const snapshot = () => JSON.stringify(Object.fromEntries(KEYS.map(k => [k, localStorage.getItem(k)])));

/**
 * Run before the tracker mounts: put this user's cloud data into localStorage.
 * A first sign-in keeps whatever is already on the device (it gets uploaded);
 * data left by a different account is cleared.
 */
export async function hydrate(uid: string) {
  const owner = localStorage.getItem(OWNER);
  let saved: Record<string, string | null> | null = null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) saved = JSON.parse(snap.data().local ?? '{}');
  } catch (e) {
    // Offline with nothing cached: this device's copy is still usable if it is ours.
    if (owner !== uid) throw e;
    return;
  }
  if (owner && owner !== uid) {
    KEYS.forEach(k => localStorage.removeItem(k));
    await clearPhotos().catch(() => {});
  }
  if (saved) KEYS.forEach(k => saved![k] == null ? localStorage.removeItem(k) : localStorage.setItem(k, saved![k]!));
  localStorage.setItem(OWNER, uid);
  last = saved ? snapshot() : '';
}

let last = '', timer: number | undefined, pendingUid: string | null = null;

async function flush() {
  clearTimeout(timer);
  const uid = pendingUid; pendingUid = null;
  if (!uid) return;
  const local = snapshot();
  if (local === last) return;
  await setDoc(doc(db, 'users', uid), { local, updatedAt: serverTimestamp() });
  last = local;
}

/** Upload the local data shortly after it changes. */
export function queueSave(uid: string) {
  pendingUid = uid;
  clearTimeout(timer);
  timer = window.setTimeout(() => { flush().catch(err => console.warn('Cloud save failed', err)); }, 1200);
}

export const flushSave = () => flush().catch(err => console.warn('Cloud save failed', err));

// Don't lose the last edit when the tab is hidden or closed.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
