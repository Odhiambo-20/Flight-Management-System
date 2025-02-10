import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, Plane, ChevronDown, Lock, MapPin, Clock, Luggage } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const NestedDropdown = ({ items, isActive, onMouseEnter, onMouseLeave }) => {
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  return (
    <div 
      className={`absolute top-full left-0 w-64 bg-white shadow-lg rounded-lg p-4 ${isActive ? 'block' : 'hidden'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, index) => (
        <div 
          key={index} 
          className="relative"
          onMouseEnter={() => setActiveSubMenu(index)}
          onMouseLeave={() => setActiveSubMenu(null)}
        >
          <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
            <div className="flex items-center">
              {item.icon && <item.icon className="mr-2 h-5 w-5 text-gray-600" />}
              <span>{item.label}</span>
            </div>
            {item.dropdownItems && <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
          
          {item.dropdownItems && activeSubMenu === index && (
            <div className="absolute top-0 left-full ml-2 w-64 bg-white shadow-lg rounded-lg p-4">
              {item.dropdownItems.map((subItem, subIndex) => (
                <div key={subIndex} className="flex items-center p-2 hover:bg-gray-100 rounded">
                  {subItem.icon && <subItem.icon className="mr-2 h-5 w-5 text-gray-600" />}
                  <div>
                    <div className="font-semibold">{subItem.label}</div>
                    <div className="text-xs text-gray-500">{subItem.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Flight = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
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

  const navigationItems = [
    {
      label: 'Book',
      hasDropdown: true,
      dropdownItems: [
        { 
          icon: Plane, 
          label: 'Flight Booking', 
          description: 'Search and book flights',
          dropdownItems: [
            { icon: Plane, label: 'Domestic Flights', description: 'Book within the country' },
            { icon: Plane, label: 'International Flights', description: 'Book international travel' }
          ]
        },
        { 
          icon: MapPin, 
          label: 'Destinations', 
          description: 'Explore our routes',
          dropdownItems: [
            { icon: MapPin, label: 'Popular Destinations', description: 'Top travel spots' },
            { icon: MapPin, label: 'New Destinations', description: 'Recently added routes' }
          ]
        },
        { 
          icon: Clock, 
          label: 'Flight Schedules', 
          description: 'View all flight times',
          dropdownItems: [
            { icon: Clock, label: 'Upcoming Flights', description: 'Upcoming flight schedules' },
            { icon: Clock, label: 'Past Flights', description: 'Historical flight information' }
          ]
        }
      ]
    },
    {
      label: 'Manage',
      hasDropdown: true,
      dropdownItems: [
        { 
          icon: Plane, 
          label: 'My Bookings', 
          description: 'View and modify reservations',
          dropdownItems: [
            { icon: Plane, label: 'Current Bookings', description: 'Active reservations' },
            { icon: Plane, label: 'Past Bookings', description: 'Previous travel history' }
          ]
        },
        { 
          icon: Clock, 
          label: 'Flight Status', 
          description: 'Check flight status',
          dropdownItems: [
            { icon: Clock, label: 'Departures', description: 'Outgoing flight statuses' },
            { icon: Clock, label: 'Arrivals', description: 'Incoming flight statuses' }
          ]
        },
        { 
          icon: Luggage, 
          label: 'Baggage', 
          description: 'Track and manage baggage',
          dropdownItems: [
            { icon: Luggage, label: 'Baggage Tracking', description: 'Track your luggage' },
            { icon: Luggage, label: 'Baggage Policies', description: 'Luggage rules and limits' }
          ]
        }
      ]
    },
    {
      label: 'Check-in',
      hasDropdown: true,
      dropdownItems: [
        { 
          icon: User, 
          label: 'Online Check-in', 
          description: 'Check in for your flight',
          dropdownItems: [
            { icon: User, label: 'Web Check-in', description: 'Online web check-in' },
            { icon: User, label: 'Mobile Check-in', description: 'Mobile app check-in' }
          ]
        },
        { 
          icon: Luggage, 
          label: 'Baggage Drop', 
          description: 'Find baggage drop locations',
          dropdownItems: [
            { icon: Luggage, label: 'Airport Counters', description: 'Baggage drop points' },
            { icon: Luggage, label: 'Self-Service', description: 'Automated baggage drop' }
          ]
        },
        { 
          icon: MapPin, 
          label: 'Airport Information', 
          description: 'Terminal maps and info',
          dropdownItems: [
            { icon: MapPin, label: 'Terminal Maps', description: 'Airport terminal layouts' },
            { icon: MapPin, label: 'Services', description: 'Airport amenities' }
          ]
        }
      ]
    },
    {
      label: 'Security',
      hasDropdown: true,
      dropdownItems: [
        { 
          icon: Lock, 
          label: 'Security Process', 
          description: 'Security guidelines',
          dropdownItems: [
            { icon: Lock, label: 'Screening Procedures', description: 'Security checkpoint info' },
            { icon: Lock, label: 'Documentation', description: 'Required travel documents' }
          ]
        },
        { 
          icon: Luggage, 
          label: 'Restricted Items', 
          description: 'What you can carry',
          dropdownItems: [
            { icon: Luggage, label: 'Prohibited Items', description: 'Items not allowed' },
            { icon: Luggage, label: 'Carry-on Rules', description: 'Luggage restrictions' }
          ]
        },
        { 
          icon: Clock, 
          label: 'Processing Times', 
          description: 'Expected wait times',
          dropdownItems: [
            { icon: Clock, label: 'Security Wait', description: 'Expected security line times' },
            { icon: Clock, label: 'Boarding Process', description: 'Boarding timeline' }
          ]
        }
      ]
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchFlights = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/flightS/search', {
        params: {
          departure: searchCriteria.departure,
          arrival: searchCriteria.arrival,
          departureDate: searchCriteria.departureDate,
          returnDate: searchCriteria.returnDate,
          passengers: searchCriteria.passengers,
          class: searchCriteria.class
        }
      });

      setFlights(response.data.data);
    } catch (err) {
      setError('Failed to fetch flights. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation with Nested Dropdowns */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative">
          {navigationItems.map((item, index) => (
            <div 
              key={index} 
              className="relative group"
              onMouseEnter={() => setActiveDropdown(index)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="flex items-center cursor-pointer">
                <span className="mr-2 text-gray-700 hover:text-gray-900">{item.label}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
              <NestedDropdown 
                items={item.dropdownItems} 
                isActive={activeDropdown === index}
                onMouseEnter={() => setActiveDropdown(index)}
                onMouseLeave={() => setActiveDropdown(null)}
              />
            </div>
          ))}
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
              className="bg-gray-800 hover:bg-gray-800 text-white px-8 py-2 rounded w-full md:w-auto disabled:bg-gray-400"
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
            {flights.map((flight, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Flight {flight.id}</h3>
                    <p className="text-gray-600">{flight.hotel?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${flight.price}</p>

                    <Link to="/MyBookings" className="bg-gray-600 text-white px-4 py-2 rounded mt-2">
                      Book Now
                    </Link>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p>© Phoenix Airways - all rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Flight;