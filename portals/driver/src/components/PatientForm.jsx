// TODO Sayali: implement the form
// Condition: 3 big buttons CRITICAL/SERIOUS/STABLE
// ALERT HOSPITAL button → write to Firebase + POST /api/alert/trigger
// Add "Load Demo Data" button for pitch: Rahul Sharma, 34, BP 90/60, Pulse 112, ETA 8 min

export default function PatientForm({ onAlertSent }) {
  // TODO: useState for all fields
  // TODO: handleSubmit — write to Firebase alerts node, then POST to backend
  return (
    <div className="space-y-4">
      <input className="w-full border rounded-xl p-3 text-base" placeholder="Patient Name" />
      {/* TODO: condition buttons */}
      {/* TODO: ETA input */}
      {/* TODO: notes */}
      <button className="w-full bg-red-600 text-white text-lg font-bold py-4 rounded-xl">
        ALERT HOSPITAL
      </button>
      <button className="w-full border border-gray-300 text-gray-500 py-3 rounded-xl text-sm">
        Load Demo Data
      </button>
    </div>
  );
}
