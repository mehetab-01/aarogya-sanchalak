// TODO Dhanshree: pull live from Firebase DB_PATHS.BEDS using onValue()
import { db } from "../../shared/firebase";

export default function BedStatusCards() {
  // TODO: useState + useEffect with onValue listener
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white border rounded-xl p-4">
        <p className="text-sm text-gray-500">ICU</p>
        <p className="text-3xl font-bold text-red-600">-- / --</p>
      </div>
      <div className="bg-white border rounded-xl p-4">
        <p className="text-sm text-gray-500">General</p>
        <p className="text-3xl font-bold text-blue-600">-- / --</p>
      </div>
      <div className="bg-white border rounded-xl p-4">
        <p className="text-sm text-gray-500">Emergency</p>
        <p className="text-3xl font-bold text-amber-600">-- / --</p>
      </div>
    </div>
  );
}
