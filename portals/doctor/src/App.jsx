// DOCTOR PORTAL â€” Aditya's file
// Shows incoming patient card with Acknowledge button

import { useState, useEffect } from "react";
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";

export default function DoctorApp() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // TODO: listen to Firebase alerts, find first INCOMING alert
    const alertsRef = ref(db, `/hospitals/${HOSPITAL_ID}/alerts`);
    onValue(alertsRef, (snap) => {
      // TODO: parse and setAlert
    });
  }, []);

  const handleAck = (alertId) => {
    // TODO: update doctorAck = true in Firebase
  };

  if (!alert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">í¿¢</div>
          <p className="text-gray-500">No active emergencies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-xl font-bold text-blue-800 mb-4">Doctor Portal</h1>
      {/* TODO: patient card */}
      {/* TODO: Acknowledge button calling handleAck */}
    </div>
  );
}
