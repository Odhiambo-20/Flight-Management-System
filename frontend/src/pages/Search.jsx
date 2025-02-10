import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const Search = ({ type = 'flight' }) => {
  const [searchParams, setSearchParams] = useState({
    // Common params
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    
    // Flight specific params
    from: '',
    to: '',
    tripType: 'oneWay',
    class: 'economy',
    
    // Hotel specific params
    location: '',
    rooms: 1,
  });

  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Determine which API endpoint to use based on type
      const endpoint = type === 'flight' ? '/flights/search' : '/hotels/search';
      
      // You can switch between GET and POST methods here
      const method = 'POST'; // or 'GET'
      
      let response;
      if (method === 'GET') {
        response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          params: searchParams
        });
      } else {
        response = await axios.post(`${API_BASE_URL}${endpoint}`, searchParams);
      }

      setSearchResults(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSearch} className="space-y-6">
        {type === 'flight' ? (
          // Flight Search Form
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From</label>
                <input
                  type="text"
                  name="from"
                  placeholder="Departure airport"
                  value={searchParams.from}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <input
                  type="text"
                  name="to"
                  placeholder="Arrival airport"
                  value={searchParams.to}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trip Type</label>
                <select
                  name="tripType"
                  value={searchParams.tripType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="oneWay">One Way</option>
                  <option value="roundTrip">Round Trip</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  name="class"
                  value={searchParams.class}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passengers</label>
                <input
                  type="number"
                  name="adults"
                  min="1"
                  value={searchParams.adults}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        ) : (
          // Hotel Search Form
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="City or hotel name"
                  value={searchParams.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rooms</label>
                <input
                  type="number"
                  name="rooms"
                  min="1"
                  value={searchParams.rooms}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in</label>
                <input
                  type="date"
                  name="checkIn"
                  value={searchParams.checkIn}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out</label>
                <input
                  type="date"
                  name="checkOut"
                  value={searchParams.checkOut}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guests</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="adults"
                    placeholder="Adults"
                    min="1"
                    value={searchParams.adults}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    name="children"
                    placeholder="Children"
                    min="0"
                    value={searchParams.children}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center"
          disabled={loading}
        >
          <SearchIcon className="w-4 h-4 mr-2" />
          {loading ? 'Searching...' : `Search ${type === 'flight' ? 'Flights' : 'Hotels'}`}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {searchResults && (
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(searchResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Search;