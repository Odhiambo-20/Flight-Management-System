import React, { useState, useEffect } from 'react';
import { Plane, Calendar, Users, CreditCard, Eye, Edit, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';

const MyBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [searchDetails, setSearchDetails] = useState({
    tripType: '',
    fromLocation: '',
    toLocation: '',
    departureDate: '',
    returnDate: '',
    passengerCount: '',
    adultsCount: '',
    childrenCount: '',
    infantsCount: '',
    cabinClass: ''
  });
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1,
    phoneNumber: '',
    email: '',
    flightNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Generate a unique flight number
  const generateFlightNumber = () => {
    // Airline code (e.g., PA for PanAir)
    const airlineCode = 'PA';
    
    // Generate a random 3-digit number
    const randomNumber = Math.floor(100 + Math.random() * 900);
    
    return `${airlineCode}${randomNumber}`;
  };

  // Parse search parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    const parsedSearchDetails = {
      tripType: searchParams.get('tripType') || '',
      fromLocation: searchParams.get('fromLocation') || '',
      toLocation: searchParams.get('toLocation') || '',
      departureDate: searchParams.get('departureDate') || '',
      returnDate: searchParams.get('returnDate') || '',
      passengerCount: searchParams.get('passengerCount') || '',
      adultsCount: searchParams.get('adultsCount') || '',
      childrenCount: searchParams.get('childrenCount') || '',
      infantsCount: searchParams.get('infantsCount') || '',
      cabinClass: searchParams.get('cabinClass') || ''
    };

    // Populate form with search details if available
    if (parsedSearchDetails.fromLocation) {
      setFormData(prev => ({
        ...prev,
        from: parsedSearchDetails.fromLocation,
        to: parsedSearchDetails.toLocation,
        date: parsedSearchDetails.departureDate,
        passengers: parseInt(parsedSearchDetails.passengerCount) || 1,
        flightNumber: generateFlightNumber() // Automatically generate flight number
      }));
    }

    setSearchDetails(parsedSearchDetails);
  }, [location.search]);

  useEffect(() => {
    if (location.state?.newBooking) {
      setBookings(prevBookings => {
        const exists = prevBookings.some(booking => 
          booking.id === location.state.newBooking.id
        );
        
        if (!exists) {
          return [...prevBookings, location.state.newBooking];
        }
        return prevBookings;
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const sendSMSUsingAfricasTalking = async (phoneNumber, message) => {
    try {
      // Retrieve the authentication token from local storage
      const token = localStorage.getItem('authToken');

       // Check if token exists
       if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
  
      // Make API call with the token in the Authorization header
      const response = await axios.post('http://localhost:5000/api/notifications/sms/send', {
        recipients: phoneNumber,  // Note: changed from phoneNumber to recipients
        message: message
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,  // Add the Bearer token
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status !== 200) {
        throw new Error('Failed to send SMS');
      }
  
      return response.data;
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a unique booking ID
      const bookingId = `BK${Date.now()}`;
      
      // Calculate price (this is a simple example - adjust based on your pricing logic)
      const basePrice = 500;
      const price = basePrice * formData.passengers;

      const newBooking = {
        id: bookingId,
        ...formData,
        price: `$${price}`,
        status: 'Confirmed',
        availableSeats: 50 - formData.passengers,
      };

      // Add the new booking
      setBookings(prev => [...prev, newBooking]);

      // Format phone number for Africa's Talking (may need country code)
      let formattedPhoneNumber = formData.phoneNumber;
      if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = `+${formattedPhoneNumber}`;
      }

      // Send SMS notification using Africa's Talking
      const smsMessage = `Booking Confirmed! Your flight ${formData.flightNumber} from ${formData.from} to ${formData.to} has been booked successfully. Booking ID: ${bookingId}`;
      
      await sendSMSUsingAfricasTalking(formattedPhoneNumber, smsMessage);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Booking successful! A confirmation SMS has been sent to your phone.',
      });

      // Reset form
      setFormData({
        from: '',
        to: '',
        date: '',
        passengers: 1,
        phoneNumber: '',
        email: '',
        flightNumber: generateFlightNumber(), // Generate a new flight number
      });

    } catch (error) {
      setNotification({
        type: 'error',
        message: `Booking failed: ${error.message || 'Please try again later.'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.filter(booking => booking.id !== bookingId));
    }
  };

  const handleModifyBooking = (bookingId) => {
    alert('Booking modification feature coming soon!');
  };

  const handleViewDetails = (booking) => {
    alert(`Flight Details:
    Flight Number: ${booking.flightNumber}
    From: ${booking.from}
    To: ${booking.to}
    Departure: ${booking.departureTime || 'N/A'}
    Arrival: ${booking.arrivalTime || 'N/A'}
    Passengers: ${booking.passengers}
    Price: ${booking.price}
    Available Seats: ${booking.availableSeats}`);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Flight Booking System</h1>

      {/* Search Details Display */}
      {searchDetails.fromLocation && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Search Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Trip Type</p>
              <p className="font-medium">{searchDetails.tripType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-medium">{searchDetails.fromLocation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">To</p>
              <p className="font-medium">{searchDetails.toLocation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Departure Date</p>
              <p className="font-medium">{searchDetails.departureDate}</p>
            </div>
            {searchDetails.tripType === 'Round Trip' && (
              <div>
                <p className="text-sm text-gray-600">Return Date</p>
                <p className="font-medium">{searchDetails.returnDate}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Passengers</p>
              <p className="font-medium">
                Total: {searchDetails.passengerCount} 
                (Adults: {searchDetails.adultsCount}, 
                Children: {searchDetails.childrenCount}, 
                Infants: {searchDetails.infantsCount})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cabin Class</p>
              <p className="font-medium">{searchDetails.cabinClass}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Alert */}
      {notification.message && (
        <Alert className={`mb-6 ${notification.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          <AlertDescription>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Book a New Flight</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <input
                  type="text"
                  name="from"
                  required
                  value={formData.from}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter departure location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="text"
                  name="to"
                  required
                  value={formData.to}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter destination"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. +1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flight Number
                </label>
                <input
                  type="text"
                  name="flightNumber"
                  required
                  value={formData.flightNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Auto-generated flight number"
                  readOnly
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        {/* Bookings List Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">My Bookings</h2>
          
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <Plane className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-lg">Flight {booking.flightNumber}</h3>
                    <p className="text-sm text-gray-600">Booking ID: {booking.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(booking)}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                  <button 
                    onClick={() => handleModifyBooking(booking.id)}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modify
                  </button>
                  <button 
                    onClick={() => handleCancelBooking(booking.id)}
                    className="px-4 py-2 text-sm border rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">From - To</p>
                  <p className="font-medium">{booking.from} → {booking.to}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Passengers</p>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {booking.passengers} {booking.passengers === 1 ? 'passenger' : 'passengers'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  
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
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <p className="text-gray-500">No bookings found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MyBookings;
                 