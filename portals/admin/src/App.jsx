// ADMIN PORTAL — Dhanshree's file
// Shows: bed status cards, active alerts table, staff response log

import BedStatusCards from "./components/BedStatusCards";
import ActiveAlerts from "./components/ActiveAlerts";
import StaffLog from "./components/StaffLog";

export default function AdminApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">
        Aarogya Sanchalak — Admin Dashboard
      </h1>
      {/* TODO: add Firebase auth check */}
      <BedStatusCards />
      <ActiveAlerts />
      <StaffLog />
    </div>
  );
}
