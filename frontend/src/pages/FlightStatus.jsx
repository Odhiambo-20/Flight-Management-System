// pages/manage/FlightStatus.jsx
import React, { useState } from 'react';
import { Plane, Clock, ArrowRight } from 'lucide-react';

const FlightStatus = () => {
  const [searchType, setSearchType] = useState('flight');
  const [flightInfo, setFlightInfo] = useState({
    flightNumber: 'PA101',
    status: 'On Time',
    scheduledDeparture: '10:30',
    actualDeparture: '10:35',
    scheduledArrival: '14:30',
    estimatedArrival: '14:35',
    from: 'New York (JFK)',
    to: 'London (LHR)',
    gate: 'B12',
    terminal: '4'
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl text-navy-900 mb-4">Flight Status</h1>
      <p className="text-gray-600 mb-8">
        Track your flight status in real-time
      </p>

      {/* Search Options */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={searchType === 'flight'}
                onChange={() => setSearchType('flight')}
                className="text-red-600"
              />
              <span>Flight Number</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={searchType === 'route'}
                onChange={() => setSearchType('route')}
                className="text-red-600"
              />
              <span>Route</span>
            </label>
          </div>

          {searchType === 'flight' ? (
            <div>
              <input
                type="text"
                placeholder="Enter flight number (e.g., PA101)"
                className="w-full md:w-64 p-2 border rounded"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="From"
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="To"
                className="p-2 border rounded"
              />
            </div>
          )}
        </div>

        <button className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Check Status
        </button>
      </div>

      {/* Flight Status Display */}
      {flightInfo && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Plane className="w-6 h-6 text-red-600" />
              <div>
                <h2 className="text-xl font-semibold">Flight {flightInfo.flightNumber}</h2>
                <p className="text-gray-600">{flightInfo.from} → {flightInfo.to}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm ${
              flightInfo.status === 'On Time' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {flightInfo.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Departure</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {flightInfo.scheduledDeparture}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Actual Time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {flightInfo.actualDeparture}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Terminal / Gate</p>
                  <p className="font-medium">Terminal {flightInfo.terminal} / Gate {flightInfo.gate}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Arrival</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {flightInfo.scheduledArrival}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {flightInfo.estimatedArrival}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default FlightStatus;