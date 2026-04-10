// WARDBOY PORTAL â€” Aditya's file
// Shows bed assignment task with Done button

import { useState, useEffect } from "react";
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";

export default function WardBoyApp() {
  const [alert, setAlert] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // TODO: listen to active alerts
  }, []);

  const handleDone = () => {
    setDone(true);
    // TODO: write wardAck = true to Firebase
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
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="bg-white border rounded-xl p-6 w-full max-w-sm text-center">
        <p className="text-lg font-semibold mb-2">Incoming Emergency Patient</p>
        <p className="text-gray-500 mb-6">Please prepare <b>Bed 12-B</b> immediately</p>
        <button
          onClick={handleDone}
          disabled={done}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg ${done ? "bg-green-400" : "bg-blue-600"}`}
        >
          {done ? "âœ… Done" : "Mark as Ready"}
        </button>
      </div>
    </div>
  );
}
