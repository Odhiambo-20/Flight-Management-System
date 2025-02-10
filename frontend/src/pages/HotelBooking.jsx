import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchResults } from './data';

const HotelBooking = () => {
  const { roomId } = useParams();
  const selectedRoom = searchResults.find((room) => room.id === roomId);

  // Add a check for undefined selectedRoom
  if (!selectedRoom) {
    return (
      <div className="container mx-auto my-8">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p>The requested room is not available.</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBooking = () => {
    // Validate form data
    if (!formData.name || !formData.email || !formData.checkInDate || !formData.checkOutDate) {
      setBookingError('Please fill in all the required fields.');
      return;
    }

    // Additional date validation
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    
    if (checkOut <= checkIn) {
      setBookingError('Check-out date must be after check-in date.');
      return;
    }

    // Process the booking
    console.log('Booking details:', formData);
    setBookingError('');
    setBookingSuccess(true);
  };

  return (
    <div className="container mx-auto my-8">
      <h1 className="text-3xl font-bold mb-4">Book Hotel</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold">{selectedRoom.type}</h2>
        <p className="mt-2 text-gray-600">Room Number: {selectedRoom.roomNumber}</p>
        <p className="text-lg font-bold mt-2">${selectedRoom.price} per night</p>
        {selectedRoom.description && (
          <p className="mt-2 text-gray-600">{selectedRoom.description}</p>
        )}

        <form className="mt-6 space-y-4">
          {/* Form fields */}
          {bookingError && (
            <div className="text-red-500 font-medium">{bookingError}</div>
          )}
          {bookingSuccess && (
            <div className="text-green-500 font-medium">
              Booking successful! You will receive a confirmation email shortly.
            </div>
          )}
          <button
            type="button"
            onClick={handleBooking}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Book Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default HotelBooking;