import React, { useState } from 'react';
import { Plane } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Flight = () => {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState({
    departure: '',
    arrival: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    class: 'Economy'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookFlight = (flight) => {
    const newBooking = {
      id: `BK${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      flightNumber: flight.flightNumber,
      from: flight.from,
      to: flight.to,
      date: flight.departureTime.split(' ')[0],
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      passengers: searchCriteria.passengers,
      status: 'Confirmed',
      price: `$${flight.price}`,
      availableSeats: flight.availableSeats,
      class: searchCriteria.class
    };

    navigate('/MyBookings', { state: { newBooking } });
  };

  const searchFlights = async (e) => {
    e.preventDefault();
    
    // Check if required fields are provided
    if (!searchCriteria.departure || !searchCriteria.arrival) {
      setError('Please specify both departure and arrival airports');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFlights([]);

    try {
      // Get flights from API
      const response = await axios.get('http://localhost:5000/api/flights/search', {
        params: searchCriteria
      });

      if (response.data && response.data.data) {
        // Filter flights to only include those matching the exact departure and arrival airports
        const filteredFlights = response.data.data.filter(flight => 
          flight.from.toLowerCase() === searchCriteria.departure.toLowerCase() && 
          flight.to.toLowerCase() === searchCriteria.arrival.toLowerCase()
        );
        
        if (filteredFlights.length === 0) {
          setError(`No flights found from ${searchCriteria.departure} to ${searchCriteria.arrival}`);
        } else {
          setFlights(filteredFlights);
        }
      } else {
        setError('Failed to fetch flights. Invalid response format.');
      }
    } catch (err) {
      setError(`Failed to fetch flights: ${err.message || 'Unknown error'}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navigation without Dropdowns */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative">
          <Link to="/" className="font-semibold text-xl text-gray-800">Phoenix Airways</Link>
          
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Start Booking Your Flight Now</h1>
        <p className="text-gray-600 mb-8">
          Find countless flights options & deals to various destinations around the world
        </p>

        {/* Search Form */}
        <form onSubmit={searchFlights} className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="text"
                name="departure"
                value={searchCriteria.departure}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Departure airport"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="text"
                name="arrival"
                value={searchCriteria.arrival}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Arrival airport"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date
              </label>
              <input
                type="date"
                name="departureDate"
                value={searchCriteria.departureDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Date
              </label>
              <input
                type="date"
                name="returnDate"
                value={searchCriteria.returnDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passengers
              </label>
              <input
                type="number"
                name="passengers"
                value={searchCriteria.passengers}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                name="class"
                value={searchCriteria.class}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded w-full md:w-auto disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-8">
            {error}
          </div>
        )}

        {/* Flight Results */}
        {flights.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Available Flights</h2>
            {flights.map((flight) => (
              <div key={flight.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-4 md:mb-0">
                    <h3 className="font-semibold text-lg flex items-center">
                      <Plane className="w-5 h-5 mr-2 text-red-600" />
                      Flight {flight.flightNumber}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">From:</span> {flight.from}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">To:</span> {flight.to}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Departure:</span> {flight.departureTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Arrival:</span> {flight.arrivalTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Available Seats:</span> {flight.availableSeats}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <p className="text-2xl font-bold text-gray-900">${flight.price}</p>
                    <button
                      onClick={() => handleBookFlight(flight)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {!loading && flights.length === 0 && searchCriteria.departure && searchCriteria.arrival && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg">No flights found for your search criteria.</p>
            <p className="text-gray-500 mt-2">Try different dates or destinations.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-gray-400">Phoenix Airways - Your trusted partner for comfortable and safe air travel.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/flights" className="text-gray-400 hover:text-white">Flights</Link></li>
                <li><Link to="/bookings" className="text-gray-400 hover:text-white">My Bookings</Link></li>
                <li><Link to="/check-in" className="text-gray-400 hover:text-white">Check-in</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link to="/baggage" className="text-gray-400 hover:text-white">Baggage Info</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>1-800-PHOENIX</li>
                <li>support@phoenix-airways.com</li>
                <li>123 Aviation Boulevard</li>
                <li>Phoenix, AZ 85001</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2025 Phoenix Airways - All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Flight;