import React, { useState, useEffect } from 'react';
import { Calendar, Users, CreditCard, Check, Tag, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// API configuration
const API_URL = 'http://localhost:5000/api/';    

const HotelBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hotelData, setHotelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState(null);
  
  // Booking form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    adults: '1',
    children: '0',
    specialRequests: '',
    paymentMethod: 'credit_card'
  });

  useEffect(() => {
    // Check if hotel data was passed directly in location state
    if (location.state?.hotel) {
      setHotelData(location.state.hotel);
      setIsLoading(false);
    } else {
      // Get hotel ID from state or query params
      const searchParams = new URLSearchParams(location.search);
      const roomId = location.state?.roomId || searchParams.get('id');
      
      if (roomId) {
        fetchHotelDetails(roomId);
      } else {
        // If no ID is provided, use placeholder data
        setHotelData({
          id: 'r3s4t5u6-v7w8',
          name: 'Luxury Suite',
          image: '/assets/luxury-room5.jpg',
          videoUrl: '/assets/luxury-room-tour.mp4', // Added video URL
          price: 299,
          description: 'Experience ultimate luxury in our spacious suite featuring premium amenities, stunning views, and personalized service.',
          amenities: ['Free WiFi', 'Room Service', 'King Size Bed', 'Jacuzzi', 'Ocean View']
        });
        setIsLoading(false);
      }
    }
  }, [location]);

  const fetchHotelDetails = async (roomId) => {
    try {
      // Ensure roomId is a positive integer
      const parsedRoomId = parseInt(roomId, 10);
      
      if (isNaN(parsedRoomId) || parsedRoomId <= 0) {
        throw new Error('Invalid room ID: must be a positive integer');
      }
  
      // Remove the trailing slash from API_URL and ensure clean URL construction
      const response = await axios.get(`${API_URL.replace(/\/+$/, '')}/hotels/search`, {
        params: { roomId: parsedRoomId }  // Pass roomId as a query parameter
      });
  
      if (response.data.success && response.data.data.length > 0) {
        setHotelData(response.data.data[0]);
      } else {
        setError('No hotel details found for the given room');
      }
    } catch (err) {
      console.error('Error fetching hotel details:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching hotel details');
    } finally {
      setIsLoading(false);
    }
  };

  // Improved validation function with more robust error handling
  const validateRoomAvailability = async (roomId, checkIn, checkOut) => {
    try {
      // Format dates consistently for the API
      const formattedCheckIn = new Date(checkIn).toISOString().split('T')[0];
      const formattedCheckOut = new Date(checkOut).toISOString().split('T')[0];
      
      const response = await axios.get(`${API_URL.replace(/\/+$/, '')}/hotels/rooms/${roomId}/availability`, {
        params: {
          checkIn: formattedCheckIn,
          checkOut: formattedCheckOut
        }
      });
      
      // Directly check the SQL results we saw: if date_specific_availability is "Available"
      return response.data.available || response.data.date_specific_availability === 'Available';
    } catch (err) {
      console.error('Error checking room availability:', err);
      // More specific error handling
      if (err.response?.status === 404) {
        throw new Error('Room not found');
      } else if (err.response?.status === 400) {
        throw new Error(err.response.data.message || 'Invalid date selection');
      } else {
        throw new Error('Failed to validate room availability. Please try again later.');
      }
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear date-related errors when dates change
    if (name === 'checkIn' || name === 'checkOut') {
      setDateError(null);
    }
  };

  const calculateTotalPrice = () => {
    if (!hotelData || !formData.checkIn || !formData.checkOut) return 0;
    
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    
    return hotelData.price * nights;
  };

  // Function to validate dates before submission
  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    
    if (checkIn < today) {
      setDateError("Check-in date cannot be in the past");
      return false;
    }
    
    if (checkOut <= checkIn) {
      setDateError("Check-out date must be after check-in date");
      return false;
    }
    
    // Limit booking to 30 days
    const daysDifference = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (daysDifference > 30) {
      setDateError("Maximum booking duration is 30 days");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setDateError(null);
    
    // Validate dates before proceeding
    if (!validateDates()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check if the room is available for the selected dates
      const isAvailable = await validateRoomAvailability(
        hotelData.id,
        formData.checkIn,
        formData.checkOut
      );

      if (!isAvailable) {
        setDateError('This room is not available for the selected dates');
        setIsLoading(false);
        return;
      }

      // UPDATED HERE: Convert userId to a number (or default to 1 if not available)
      const userIdFromStorage = localStorage.getItem('userId');
      const userId = userIdFromStorage ? parseInt(userIdFromStorage, 10) : 1;

      const bookingData = {
        roomId: hotelData.id,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        userId: userId, // Now using an integer instead of string
        totalPrice: calculateTotalPrice(),
        customerDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        guestCount: {
          adults: parseInt(formData.adults),
          children: parseInt(formData.children)
        },
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod
      };
      
      const response = await axios.post(`${API_URL.replace(/\/+$/, '')}/hotels/book`, bookingData);
      
      if (response.data.success) {
        navigate('/booking-confirmation', { 
          state: { 
            bookingId: response.data.data.id,
            roomId: hotelData.id,
            hotelName: hotelData.name,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            totalPrice: calculateTotalPrice()
          } 
        });
      } else {
        setError('Failed to complete booking');
      }
    } catch (err) {
      console.error('Booking error:', err);
      if (err.message.includes('available')) {
        setDateError(err.message);
      } else {
        setError(err.response?.data?.message || err.message || 'An error occurred while processing your booking');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex text-sm text-gray-600">
            <li className="mr-2">
              <button onClick={() => navigate('/')} className="hover:underline">Home</button>
            </li>
            <li className="mr-2">/</li>
            <li className="mr-2">
              <button onClick={() => navigate('/hotels')} className="hover:underline">Hotels</button>
            </li>
            <li className="mr-2">/</li>
            <li className="font-medium text-gray-900">{hotelData.name}</li>
          </ol>
        </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hotel Details */}
            <div className="lg:col-span-2">
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              {/* Video or Image Rendering */}
              {hotelData.videoUrl ? (
                <video 
                  src={hotelData.videoUrl} 
                  alt={hotelData.name} 
                  className="w-full h-80 object-cover"
                  controls
                  poster={hotelData.image}
                />
              ) : (
                <img 
                  src={hotelData.image} 
                  alt={hotelData.name} 
                  className="w-full h-80 object-cover"
                />
              )}
              
              <div className="p-6">
                <h1 className="text-3xl font-bold mb-2">{hotelData.name}</h1>
                
                <div className="flex items-center mb-4">
                  <Tag className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-2xl font-bold text-gray-900">${hotelData.price}</span>
                  <span className="text-gray-600 ml-1">per night</span>
                </div>
                
                <p className="text-gray-700 mb-6">{hotelData.description}</p>
                
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {hotelData?.amenities?.map((amenity, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>{amenity}</span>
                      </li>
                    )) || (
                      <>
                        <p className='col-span-2 text-gray-600 mb-4'>
                          Perfect for romantic getaways, our honeymoon suite offers intimate spaces and luxury amenities.
                        </p>
                        {['Free WiFi', 'Room Service', 'Queen Size Bed', 'Bathtub', 'Garden View', 'Breakfast Included'].map((amenity, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                            <span>{amenity}</span>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Book Your Stay</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                    <div className="flex items-center border rounded p-2">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="date"
                        name="checkIn"
                        value={formData.checkIn}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                    <div className="flex items-center border rounded p-2">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="date"
                        name="checkOut"
                        value={formData.checkOut}
                        onChange={handleInputChange}
                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Date error message */}
                {dateError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{dateError}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                    <div className="flex items-center border rounded p-2">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <select
                        name="adults"
                        value={formData.adults}
                        onChange={handleInputChange}
                        className="w-full bg-transparent"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                    <div className="flex items-center border rounded p-2">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <select
                        name="children"
                        value={formData.children}
                        onChange={handleInputChange}
                        className="w-full bg-transparent"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 h-24 resize-none"
                    placeholder="Any special requests or preferences?"
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <div className="flex items-center border rounded p-2">
                    <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full bg-transparent"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                
                {/* Price Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Price per night</span>
                    <span className="font-medium">${hotelData.price}</span>
                  </div>
                  
                  {formData.checkIn && formData.checkOut && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Number of nights
                      </span>
                      <span className="font-medium">
                        {Math.max(1, Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24)))}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t mt-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">${calculateTotalPrice()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
                  } transition-colors`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Complete Booking'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBooking;