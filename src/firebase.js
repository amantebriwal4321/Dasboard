import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ─── Firebase Configuration ───────────────────────────────────────────────────
// REPLACE these values with your own Firebase project config.
// Go to https://console.firebase.google.com → Create project → Web app → Copy config
const firebaseConfig = {
  apiKey: "AIzaSyB4VKNWdQ6jVf6IPzaRsfNQGThuQdWHXEk",
  authDomain: "personal-os-dashboard-76618.firebaseapp.com",
  projectId: "personal-os-dashboard-76618",
  storageBucket: "personal-os-dashboard-76618.firebasestorage.app",
  messagingSenderId: "608720166783",
  appId: "1:608720166783:web:f38c199aced249dca8044a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence so the app works even without internet
// and syncs back when connectivity returns
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support persistence
    console.warn('Firestore persistence not available in this browser');
  }
});
