// pages/manage/MyBookings.jsx
import React, { useState } from 'react';
import { Plane, Calendar, Users, CreditCard, Eye, Edit, X } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([
    {
      id: 'BK001',
      flightNumber: 'PA101',
      from: 'New York (JFK)',
      to: 'London (LHR)',
      date: '2025-02-15',
      passengers: 2,
      status: 'Confirmed',
      price: '$850.00'
    },
    {
      id: 'BK002',
      flightNumber: 'PA202',
      from: 'London (LHR)',
      to: 'Paris (CDG)',
      date: '2025-03-20',
      passengers: 1,
      status: 'Pending',
      price: '$220.00'
    }
  ]);

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.filter(booking => booking.id !== bookingId));
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl text-navy-900 mb-4">My Bookings</h1>
      <p className="text-gray-600 mb-8">
        View and manage your flight bookings
      </p>

      {/* Booking Cards */}
      <div className="space-y-6">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <Plane className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold">Flight {booking.flightNumber}</h3>
                  <p className="text-sm text-gray-600">Booking ID: {booking.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                  <Eye className="w-4 h-4 inline mr-2" />
                  Details
                </button>
                <button className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                  <Edit className="w-4 h-4 inline mr-2" />
                  Modify
                </button>
                <button 
                  onClick={() => handleCancelBooking(booking.id)}
                  className="px-4 py-2 text-sm border rounded text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">From - To</p>
                <p className="font-medium">{booking.from} → {booking.to}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(booking.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Passengers</p>
                <p className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {booking.passengers} {booking.passengers === 1 ? 'passenger' : 'passengers'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {booking.price}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <span className={`px-3 py-1 rounded-full text-sm ${
                booking.status === 'Confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No bookings found</p>
            <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Book a Flight
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default MyBookings;