import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, ChevronDown, Minus, Plus, ArrowRightLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '/src/assets/Air_Phoenix_logo.jpg';

const Header = () => {
  const navigate = useNavigate();

  // State management for dropdowns
  const [tripType, setTripType] = useState('Round Trip');
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  
  // State for passengers
  const [passengers, setPassengers] = useState({
    adult: 1,
    child: 0,
    infant: 0
  });
  
  // State for cabin class
  const [cabinClass, setCabinClass] = useState('Economy');

  // State for dates
  const [departureDate, setDepartureDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);

  // State for locations
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  // Location swap handler
  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const updatePassenger = (type, operation) => {
    setPassengers(prev => {
      const newValue = operation === 'add' ? prev[type] + 1 : Math.max(0, prev[type] - 1);
      
      const totalPassengers = Object.values({
        ...prev,
        [type]: newValue
      }).reduce((a, b) => a + b, 0);

      return totalPassengers <= 9 ? { ...prev, [type]: newValue } : prev;
    });
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSearch = () => {
    // Validate required fields
    if (!fromLocation || !toLocation || !departureDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Format dates to specific string format
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    };

    // Prepare search parameters
    const searchParams = new URLSearchParams({
      tripType,
      fromLocation,
      toLocation,
      departureDate: formatDate(departureDate),
      returnDate: tripType === 'Round Trip' ? formatDate(returnDate) : '',
      passengerCount: (passengers.adult + passengers.child + passengers.infant).toString(),
      adultsCount: passengers.adult.toString(),
      childrenCount: passengers.child.toString(),
      infantsCount: passengers.infant.toString(),
      cabinClass
    });

    // Navigate to booking page with search parameters
    navigate(`/mybookings?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Navigation Section */}
      <nav className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/home">
                <img src={logo} alt="Logo" className="w-36" />
              </Link>
              <div className="hidden md:flex space-x-6">
                {['Home', 'Flight', 'Hotel', 'Promo'].map(item => (
                  <span 
                    key={item} 
                    onClick={() => handleNavigation(`/${item.toLowerCase()}`)} 
                    className="hover:text-gray-200 cursor-pointer"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {['Ask', 'Sign in', 'Admin'].map(item => (
                <span 
                  key={item} 
                  onClick={() => handleNavigation(`/${item.toLowerCase().replace(' ', '')}`)} 
                  className="hover:text-gray-200 cursor-pointer"
                >
                  {item}
                </span>
              ))}
              <span 
                onClick={() => handleNavigation('/signup')} 
                className="bg-white text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                Sign up
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Section */}
      <div className="bg-gray-900 text-white px-4 pb-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">Start Booking Your Flight Now</h1>
          <p className="mb-6">Find countless flights options & deals to various destinations around the world</p>

          {/* Search Form Container */}
          <div className="bg-white rounded-lg p-6">
            {/* Dropdowns */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                {/* Trip Type Dropdown */}
                <div className="relative">
                  <button 
                    className="flex items-center text-gray-700 hover:text-gray-900"
                    onClick={() => setShowTripDropdown(!showTripDropdown)}
                  >
                    {tripType}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </button>
                  {showTripDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                      {['One Way', 'Round Trip'].map(type => (
                        <button 
                          key={type}
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => {
                            setTripType(type);
                            setShowTripDropdown(false);
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Passenger Dropdown */}
                <div className="relative">
                  <button 
                    className="flex items-center text-gray-700 hover:text-gray-900"
                    onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                  >
                    {passengers.adult + passengers.child + passengers.infant} Passenger
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </button>
                  {showPassengerDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-72">
                      <div className="p-4 space-y-4">
                        {['adult', 'child', 'infant'].map(type => (
                          <div key={type} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium capitalize">{type}</div>
                              <div className="text-sm text-gray-500">
                                {type === 'adult' ? 'Age 12+' : type === 'child' ? 'Age 2-11' : '<2 years'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button 
                                className="p-1 rounded-md border"
                                onClick={() => updatePassenger(type, 'subtract')}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span>{passengers[type]}</span>
                              <button 
                                className="p-1 rounded-md border"
                                onClick={() => updatePassenger(type, 'add')}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button 
                          className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
                          onClick={() => setShowPassengerDropdown(false)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cabin Class Dropdown */}
                <div className="relative">
                  <button 
                    className="flex items-center text-gray-700 hover:text-gray-900"
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                  >
                    {cabinClass}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </button>
                  {showClassDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                      {['Economy', 'Premium Economy', 'Business', 'First Class'].map(className => (
                        <button 
                          key={className}
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          onClick={() => {
                            setCabinClass(className);
                            setShowClassDropdown(false);
                          }}
                        >
                          {className}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Flight Search Row */}
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* From Location */}
              <div className="col-span-3 relative">
                <input
                  type="text"
                  placeholder="From"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full p-3 border rounded-md bg-gray-100 text-black"
                />
              </div>

              {/* Swap Locations */}
              <div className="col-span-1 flex justify-center">
                <button 
                  onClick={swapLocations}
                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                >
                  <ArrowRightLeft className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* To Location */}
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="To"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full p-3 border rounded-md bg-gray-100 text-black"
                />
              </div>

              {/* Departure Date */}
              <div className="col-span-2">
                <DatePicker
                  selected={departureDate}
                  onChange={(date) => setDepartureDate(date)}
                  placeholderText="Departure"
                  minDate={new Date()}
                  className="w-full p-3 border rounded-md bg-gray-100 text-black"
                  dateFormat="dd/MM/yyyy"
                />
              </div>

              {/* Return Date (Conditional) */}
              {tripType === 'Round Trip' && (
                <div className="col-span-2">
                  <DatePicker
                    selected={returnDate}
                    onChange={(date) => setReturnDate(date)}
                    placeholderText="Return"
                    minDate={departureDate || new Date()}
                    className="w-full p-3 border rounded-md bg-gray-100 text-black"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              )}

              {/* Search Button */}
              <div className="col-span-1">
                <button 
                  onClick={handleSearch}
                  className="w-full bg-gray-600 text-white p-3 rounded-md hover:bg-gray-700 flex items-center justify-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;