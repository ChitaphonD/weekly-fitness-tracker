import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase web config is public by design; access is controlled by Firebase security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBfqLq6zqCZLyj8VchA1qfLVgqoorz0gSs',
  authDomain: 'weekly-fitness-tracker-54402.firebaseapp.com',
  projectId: 'weekly-fitness-tracker-54402',
  storageBucket: 'weekly-fitness-tracker-54402.firebasestorage.app',
  messagingSenderId: '928182862701',
  appId: '1:928182862701:web:d81c91bfcddb45dfcf5064',
  measurementId: 'G-51094QH31S'
};

export const app = initializeApp(firebaseConfig);

// Analytics needs cookies/IndexedDB; skip it where the browser doesn't allow them.
isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});
