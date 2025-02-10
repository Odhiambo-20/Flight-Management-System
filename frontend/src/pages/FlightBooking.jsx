
import { Calendar } from 'lucide-react';

const FlightBooking = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl text-navy-900 mb-4">Flight Booking</h1>
      <p className="text-gray-600 mb-8">
        Search and book flights to hundreds of destinations worldwide.
      </p>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Departure airport"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Arrival airport"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <button className="w-full p-2 border rounded flex items-center justify-between">
              <span>Select date</span>
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded w-full md:w-auto">
            Search Flights
          </button>
        </div>
      </div>
    </main>
  );
};

export default FlightBooking;