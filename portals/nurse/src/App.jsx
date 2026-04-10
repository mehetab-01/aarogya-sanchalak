// NURSE PORTAL â€” Aditya's file
// Shows task checklist when alert fires

import { useState, useEffect } from "react";
import { db } from "../../shared/firebase";
import { ref, onValue, update } from "firebase/database";
import { HOSPITAL_ID } from "../../shared/types";

const NURSE_TASKS = [
  "Prepare stretcher",
  "Set up IV drip",
  "Alert OT team",
  "Prepare blood type kit",
];

export default function NurseApp() {
  const [alert, setAlert] = useState(null);
  const [done, setDone] = useState({});

  useEffect(() => {
    // TODO: listen to active alerts
  }, []);

  const toggleTask = (task) => {
    setDone(prev => ({ ...prev, [task]: !prev[task] }));
    // TODO: write task completion to Firebase
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
      <h1 className="text-xl font-bold text-blue-800 mb-4">Nurse Portal</h1>
      {/* TODO: patient summary */}
      <div className="space-y-3">
        {NURSE_TASKS.map(task => (
          <label key={task} className="flex items-center gap-3 bg-white border rounded-xl p-4 cursor-pointer">
            <input type="checkbox" checked={!!done[task]} onChange={() => toggleTask(task)} className="w-5 h-5" />
            <span className={done[task] ? "line-through text-gray-400" : ""}>{task}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
