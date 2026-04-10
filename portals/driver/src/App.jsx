// App.jsx — Root: Firebase Auth check → Login → PatientForm → Confirmation
// Screens: login | form | confirmed
// Uses dynamic imports to survive FILL_ME Firebase config gracefully
// Owner: Sayali Bhagwat — portals/driver/

import { useState, useEffect } from 'react';
import PatientForm  from './components/PatientForm.jsx';
import Confirmation from './components/Confirmation.jsx';
import Login        from './components/Login.jsx';
import { Toaster } from 'react-hot-toast';

export default function DriverApp() {
  // undefined = still checking auth, null = not logged in, object = logged in
  const [user, setUser]               = useState(undefined);
  const [screen, setScreen]           = useState('form');
  const [alertId, setAlertId]         = useState(null);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    // Dynamically import Firebase to prevent bundle crash if misconfigured
    Promise.all([
      import('../../shared/firebase.js'),
      import('firebase/auth'),
    ]).then(([firebaseModule, authModule]) => {
      if (cancelled) return;
      try {
        unsubscribe = authModule.onAuthStateChanged(
          firebaseModule.auth,
          u => {
            if (!cancelled) {
              setUser(u ?? null);
            }
          },
          err => {
            if (!cancelled) {
              console.error('[Auth]', err.message);
              setUser(null);
            }
          }
        );
      } catch (err) {
        console.warn('[Auth] onAuthStateChanged failed:', err.message);
        if (!cancelled) setUser(null);
      }
    }).catch(err => {
      console.warn('[Firebase] Module load failed:', err.message);
      if (!cancelled) setUser(null);
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  function handleAlertSent(id, data) {
    setAlertId(id);
    setPatientData(data);
    setScreen('confirmed');
  }

  function handleNewAlert() {
    setAlertId(null);
    setPatientData(null);
    setScreen('form');
  }

  // Auth loading
  if (user === undefined) {
    return (
      <div className="min-h-dvh bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" style={{ width: 40, height: 40, borderWidth: 4, borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-brand)' }} />
          <p className="text-[var(--color-text-muted)] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <Login onLogin={u => setUser(u)} />
      </>
    );
  }

  // Logged in
  return (
    <div className="bg-[var(--color-bg-primary)] min-h-dvh">
      <Toaster position="top-center" />
      {screen === 'form' && (
        <PatientForm user={user} onAlertSent={handleAlertSent} />
      )}
      {screen === 'confirmed' && (
        <Confirmation alertId={alertId} patientData={patientData} onNewAlert={handleNewAlert} />
      )}
    </div>
  );
}
