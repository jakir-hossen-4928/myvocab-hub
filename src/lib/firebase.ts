import { Capacitor } from "@capacitor/core";
import { initializeApp } from "firebase/app";
import { getAuth, indexedDBLocalPersistence, initializeAuth, GoogleAuthProvider } from "firebase/auth";

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth =
    Capacitor.isNativePlatform()
        ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
        : getAuth(app);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: true
  });
} catch (e) {
  // If already initialized (e.g. via HMR), use existing instance
  console.log("Firestore already initialized, using existing instance");
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();
