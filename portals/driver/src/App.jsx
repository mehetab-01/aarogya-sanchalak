// DRIVER PORTAL — Sayali's file
// Mobile-first, max-width 420px, 48px touch targets
// Screens: Login → PatientForm → Confirmation

import { useState } from "react";
import PatientForm from "./components/PatientForm";
import Confirmation from "./components/Confirmation";

export default function DriverApp() {
  const [screen, setScreen] = useState("form"); // form | confirmed
  const [alertId, setAlertId] = useState(null);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-blue-800 mb-4 text-center">
          Aarogya Sanchalak
        </h1>
        {screen === "form" && (
          <PatientForm onAlertSent={(id) => { setAlertId(id); setScreen("confirmed"); }} />
        )}
        {screen === "confirmed" && <Confirmation alertId={alertId} />}
      </div>
    </div>
  );
}
