import React, { useState } from 'react';
import { Calendar, Clock, Plane } from 'lucide-react';

const FlightSchedules = () => {
  const [selectedDay, setSelectedDay] = useState('all');
  
  const schedules = [
    {
      flightNumber: 'PA101',
      departure: 'New York (JFK)',
      arrival: 'London (LHR)',
      departureTime: '21:30',
      arrivalTime: '09:30',
      frequency: ['Mon', 'Wed', 'Fri', 'Sun'],
      duration: '8h 00m'
    },
    {
      flightNumber: 'PA102',
      departure: 'London (LHR)',
      arrival: 'New York (JFK)',
      departureTime: '11:30',
      arrivalTime: '14:30',
      frequency: ['Mon', 'Wed', 'Fri', 'Sun'],
      duration: '7h 00m'
    },
    {
      flightNumber: 'PA201',
      departure: 'Los Angeles (LAX)',
      arrival: 'Tokyo (NRT)',
      departureTime: '13:45',
      arrivalTime: '17:45',
      frequency: ['Tue', 'Thu', 'Sat'],
      duration: '11h 00m'
    },
    {
      flightNumber: 'PA202',
      departure: 'Tokyo (NRT)',
      arrival: 'Los Angeles (LAX)',
      departureTime: '19:30',
      arrivalTime: '13:30',
      frequency: ['Tue', 'Thu', 'Sat'],
      duration: '10h 00m'
    }
  ];

  const handleBookFlight = (flightNumber) => {
    // Handle booking logic here
    console.log(`Booking flight ${flightNumber}`);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl text-navy-900 mb-4">Flight Schedules</h1>
      <p className="text-gray-600 mb-8">
        View our regular flight schedules and plan your journey.
      </p>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by day
          </label>
          <select
            className="w-full md:w-48 p-2 border rounded"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="all">All days</option>
            <option value="Mon">Monday</option>
            <option value="Tue">Tuesday</option>
            <option value="Wed">Wednesday</option>
            <option value="Thu">Thursday</option>
            <option value="Fri">Friday</option>
            <option value="Sat">Saturday</option>
            <option value="Sun">Sunday</option>
          </select>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Flight</th>
                <th className="text-left py-3 px-4">Route</th>
                <th className="text-left py-3 px-4">Departure</th>
                <th className="text-left py-3 px-4">Arrival</th>
                <th className="text-left py-3 px-4">Duration</th>
                <th className="text-left py-3 px-4">Days</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules
                .filter(schedule => 
                  selectedDay === 'all' || schedule.frequency.includes(selectedDay)
                )
                .map((flight, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-red-600" />
                        {flight.flightNumber}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {flight.departure} → {flight.arrival}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {flight.departureTime}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {flight.arrivalTime}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {flight.duration}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {flight.frequency.map((day, dayIndex) => (
                          <span
                            key={dayIndex}
                            className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleBookFlight(flight.flightNumber)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                      >
                        Book Now
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* No Results Message */}
        {schedules.filter(schedule => 
          selectedDay === 'all' || schedule.frequency.includes(selectedDay)
        ).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No flights available for the selected day.
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Flight Status Updates</h3>
          <p className="text-gray-600 text-sm">
            Get real-time updates about your flight status by entering your flight number.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Schedule Changes</h3>
          <p className="text-gray-600 text-sm">
            Schedules may vary during holidays and peak seasons. Please check before your travel date.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm">
            Contact our 24/7 customer service for assistance with flight schedules and bookings.
          </p>
        </div>
      </div>
    </main>
  );
};

export default FlightSchedules;