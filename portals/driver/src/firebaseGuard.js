// firebase-wrapper.js 
// Safe wrapper around shared Firebase — handles FILL_ME placeholder gracefully
// This DRIVER-ONLY file prevents the app crashing when Firebase isn't configured
// Owner: Sayali — portals/driver/ ONLY — DO NOT share with other portals

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Read the config from shared/firebase.js's already-initialized app
// Firebase SDK: if an app is already initialized, reuse it
let auth = null;
let db = null;
let firebaseReady = false;

try {
  // Attempt to reuse the already-initialized Firebase app from shared/firebase.js
  // shared/firebase.js has already called initializeApp(), so we can getApps()[0]
  const apps = getApps();
  if (apps.length > 0) {
    const app = apps[0];
    auth = getAuth(app);
    // Try getting database separately — this is what may throw on FILL_ME
    try {
      const { getDatabase } = await import('firebase/database');
      db = getDatabase(app);
      firebaseReady = true;
    } catch (dbErr) {
      console.warn('[Driver] Firebase DB not ready (check databaseURL):', dbErr.message);
      firebaseReady = false;
    }
  }
} catch (err) {
  console.warn('[Driver] Firebase init failed:', err.message);
}

export { auth, db, firebaseReady };
