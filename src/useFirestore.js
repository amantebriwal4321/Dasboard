import { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from './firebase';
import {
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

/**
 * useFirestore — A drop-in replacement for the old localStorage pattern.
 *
 * Instead of:  const [data, setData] = useState(() => load('key', []));
 *              useEffect(() => save('key', data), [data]);
 *
 * We now use:  const [data, setData] = useFirestore('key', []);
 *
 * This:
 *  1. Reads from Firestore in real-time (syncs across all devices instantly)
 *  2. Falls back to localStorage when the user is not logged in
 *  3. Writes changes to Firestore (debounced so it doesn't overload the network)
 *  4. Works offline thanks to Firestore's IndexedDB persistence
 */
export function useFirestore(key, defaultValue) {
  // Local helpers for localStorage fallback
  const loadLocal = () => {
    try { return JSON.parse(localStorage.getItem(key)) ?? defaultValue; }
    catch { return defaultValue; }
  };
  const saveLocal = (v) => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  };

  const [data, setDataRaw] = useState(loadLocal);
  const [user, setUser] = useState(auth.currentUser);
  const debounceRef = useRef(null);
  const skipNextRemote = useRef(false);

  // Track auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  // Real-time Firestore listener (only when logged in)
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid, 'data', key);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const remote = snap.data().value;
        if (!skipNextRemote.current) {
          setDataRaw(remote);
          saveLocal(remote); // keep localStorage in sync as a cache
        }
        skipNextRemote.current = false;
      }
    }, (error) => {
      console.warn(`Firestore listener error for "${key}":`, error);
    });

    return unsub;
  }, [user, key]);

  // When user first logs in, migrate their localStorage data to Firestore
  useEffect(() => {
    if (!user) return;
    const local = loadLocal();
    if (local && JSON.stringify(local) !== JSON.stringify(defaultValue)) {
      const docRef = doc(db, 'users', user.uid, 'data', key);
      setDoc(docRef, { value: local }, { merge: true }).catch(() => {});
    }
  }, [user]);

  // Custom setter that writes to both Firestore and localStorage
  const setData = useCallback((updater) => {
    setDataRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      // Save to localStorage immediately (instant, no latency)
      saveLocal(next);

      // Debounced write to Firestore (avoids hammering the server)
      if (user) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        skipNextRemote.current = true;
        debounceRef.current = setTimeout(() => {
          const docRef = doc(db, 'users', user.uid, 'data', key);
          setDoc(docRef, { value: next }, { merge: true }).catch((err) => {
            console.warn(`Firestore write error for "${key}":`, err);
          });
        }, 400);
      }

      return next;
    });
  }, [user, key]);

  return [data, setData];
}
