import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Download, 
  Printer, 
  CalendarPlus, 
  Edit, 
  Home, 
  ClipboardList, 
  PlusSquare, 
  CheckCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Updated configuration - removed API dependency
const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const confirmationRef = useRef(null);

  useEffect(() => {
    // Get booking information from location state or use demo data
    if (location.state?.bookingId) {
      loadBookingFromState(location.state);
    } else {
      // If accessing this page directly without state, check URL params
      const searchParams = new URLSearchParams(location.search);
      const bookingId = searchParams.get('id');
      
      if (bookingId) {
        // Instead of API calls, use localStorage or demo data
        const savedBooking = localStorage.getItem(`booking_${bookingId}`);
        if (savedBooking) {
          try {
            const parsedData = JSON.parse(savedBooking);
            setBookingData(parsedData.bookingData);
            setHotelDetails(parsedData.hotelDetails);
            setIsLoading(false);
          } catch (e) {
            console.error('Error parsing saved booking data:', e);
            setDemoData();
          }
        } else {
          setDemoData();
        }
      } else {
        // If no booking ID, use demo data for preview
        setDemoData();
      }
    }
  }, [location]);

  const loadBookingFromState = (state) => {
    const stateBookingData = {
      id: state.bookingId,
      roomId: state.roomId,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      totalPrice: state.totalPrice,
      paymentMethod: state.paymentMethod || 'credit_card',
      createdAt: state.createdAt || new Date().toISOString(),
      customerDetails: state.customerDetails || {
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@example.com',
        phone: '+1 (555) 123-4567'
      },
      guestCount: state.guestCount || {
        adults: 2,
        children: 0
      },
      specialRequests: state.specialRequests || '',
      status: 'confirmed'
    };
    
    const stateHotelDetails = {
      id: state.roomId,
      name: state.hotelName || 'Hotel Suite',
      image: state.hotelImage || '/images/default-room.jpg',
      address: state.address || '123 Hotel Street, City, State 12345',
      contactPhone: state.contactPhone || '+1 (800) 555-8888',
      contactEmail: state.contactEmail || 'info@hotel.com',
      checkInTime: state.checkInTime || '15:00',
      checkOutTime: state.checkOutTime || '11:00',
      coordinates: state.coordinates || {
        lat: 25.7617,
        lng: -80.1918
      },
      cancellationPolicy: state.cancellationPolicy || 'Free cancellation up to 48 hours before check-in.'
    };
    
    setBookingData(stateBookingData);
    setHotelDetails(stateHotelDetails);
    setIsLoading(false);
    
    // Save to localStorage for future reference
    try {
      localStorage.setItem(`booking_${stateBookingData.id}`, JSON.stringify({
        bookingData: stateBookingData,
        hotelDetails: stateHotelDetails
      }));
    } catch (e) {
      console.warn('Could not save booking to localStorage:', e);
    }
  };

  const setDemoData = () => {
    const demoBooking = {
      id: 'BK-1234567',
      roomId: 'r3s4t5u6-v7w8',
      checkIn: '2025-03-15',
      checkOut: '2025-03-18',
      totalPrice: 897,
      paymentMethod: 'credit_card',
      createdAt: new Date().toISOString(),
      customerDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 123-4567'
      },
      guestCount: {
        adults: 2,
        children: 1
      },
      specialRequests: 'Early check-in if possible, high floor room preferred.',
      status: 'confirmed'
    };
    
    const demoHotel = {
      id: 'r3s4t5u6-v7w8',
      name: 'Luxury Suite',
      image: '/images/luxury-room.jpg',
      address: '123 Ocean Drive, Miami Beach, FL 33139',
      contactPhone: '+1 (800) 555-8888',
      contactEmail: 'reservations@luxuryhotel.com',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      coordinates: {
        lat: 25.7617,
        lng: -80.1918
      },
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Cancellations made within 48 hours of check-in are subject to a one-night charge.'
    };
    
    setBookingData(demoBooking);
    setHotelDetails(demoHotel);
    setIsLoading(false);
  };

  // Function to format dates
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Function to calculate number of nights
  const calculateNights = () => {
    if (!bookingData) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  };

  // Function to download confirmation as PDF
  const downloadPDF = () => {
    if (!confirmationRef.current) return;
    
    html2canvas(confirmationRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Booking-Confirmation-${bookingData.id}.pdf`);
    });
  };

  // Function to email the booking details
  const emailConfirmation = () => {
    // In a real app, this would call an API endpoint to send the email
    alert(`Confirmation email sent to ${bookingData.customerDetails?.email || 'your email address'}`);
  };

  // Function to add booking to calendar
  const addToCalendar = () => {
    if (!bookingData) return;
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    
    // Creating iCalendar format
    const hotelName = hotelDetails?.name || 'Hotel Stay';
    const eventTitle = `Stay at ${hotelName}`;
    
    const startDate = checkIn.toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = checkOut.toISOString().replace(/-|:|\.\d+/g, '');
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${eventTitle}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `LOCATION:${hotelDetails?.address || ''}`,
      `DESCRIPTION:Booking Reference: ${bookingData.id}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hotel_booking.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to print the confirmation
  const printConfirmation = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (error && !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" ref={confirmationRef}>
          {/* Success Banner */}
          <div className="bg-green-100 px-6 py-4 flex items-center border-b border-green-200">
            <CheckCircle className="text-green-600 w-8 h-8 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-green-800">Booking Confirmed!</h2>
              <p className="text-green-700">Your reservation has been successfully processed.</p>
            </div>
          </div>
          
          {/* Main Confirmation Content */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Booking Confirmation</h1>
                <p className="text-gray-600">Confirmation #: <span className="font-semibold">{bookingData.id}</span></p>
                <p className="text-gray-600">Booked on: {new Date(bookingData.createdAt || new Date()).toLocaleDateString()}</p>
              </div>
              
              <div className="hidden print:block">
                <h3 className="text-xl font-semibold">Your Reservation</h3>
                <p className="text-gray-600">Please present this confirmation upon arrival</p>
              </div>
            </div>
            
            {/* Hotel & Room Details */}
            <div className="mb-8 border rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-1">
                  <img 
                    src={hotelDetails?.image || '/images/default-room.jpg'} 
                    alt={hotelDetails?.name || 'Hotel Room'} 
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="md:col-span-2 p-4">
                  <h2 className="text-xl font-bold mb-2">{hotelDetails?.name || 'Hotel Room'}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                        <div>
                          <p className="font-medium">Check-in</p>
                          <p>{formatDate(bookingData.checkIn)}</p>
                          <p className="text-sm text-gray-600">After {hotelDetails?.checkInTime || '3:00 PM'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                        <div>
                          <p className="font-medium">Check-out</p>
                          <p>{formatDate(bookingData.checkOut)}</p>
                          <p className="text-sm text-gray-600">Before {hotelDetails?.checkOutTime || '11:00 AM'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="w-5 h-5 text-gray-600 mr-2" />
                        <div>
                          <p className="font-medium">Duration</p>
                          <p>{calculateNights()} night{calculateNights() !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm">{hotelDetails?.address || 'Hotel Address'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Guest Details & Booking Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Guest Details */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
                
                <p className="mb-2">
                  <span className="font-medium">Guest Name:</span> {bookingData.customerDetails?.firstName} {bookingData.customerDetails?.lastName}
                </p>
                
                <p className="mb-2">
                  <span className="font-medium">Email:</span> {bookingData.customerDetails?.email || 'N/A'}
                </p>
                
                <p className="mb-2">
                  <span className="font-medium">Phone:</span> {bookingData.customerDetails?.phone || 'N/A'}
                </p>
                
                <p className="mb-2">
                  <span className="font-medium">Guests:</span> {bookingData.guestCount?.adults || 1} adult{(bookingData.guestCount?.adults || 1) !== 1 ? 's' : ''}
                  {bookingData.guestCount?.children > 0 ? `, ${bookingData.guestCount.children} child${bookingData.guestCount.children !== 1 ? 'ren' : ''}` : ''}
                </p>
                
                {bookingData.specialRequests && (
                  <div className="mt-4">
                    <span className="font-medium">Special Requests:</span>
                    <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{bookingData.specialRequests}</p>
                  </div>
                )}
              </div>
              
              {/* Booking Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                
                <div className="flex justify-between mb-2">
                  <span>Room Price:</span>
                  <span>${(bookingData.totalPrice / calculateNights()).toFixed(2)} × {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-3">
                  <span>Total Paid:</span>
                  <span>${bookingData.totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="mt-4 text-sm">
                  <p>
                    <span className="font-medium">Payment Method:</span> {bookingData.paymentMethod?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Credit Card'}
                  </p>
                  
                  <p className="mt-2">
                    <span className="font-medium">Booking Status:</span> 
                    <span className="ml-1 inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {bookingData.status?.toUpperCase() || 'CONFIRMED'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Booking Timeline */}
            <div className="mb-8 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Booking Timeline</h3>
              
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                
                {/* Timeline Items */}
                <div className="relative pl-10 pb-4">
                  <div className="absolute left-0 rounded-full bg-green-600 p-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-medium">Booking Confirmed</p>
                  <p className="text-sm text-gray-600">Your reservation has been confirmed</p>
                </div>
                
                <div className="relative pl-10 pb-4">
                  <div className="absolute left-0 rounded-full bg-gray-400 p-1">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-medium">Check-in</p>
                  <p className="text-sm text-gray-600">{formatDate(bookingData.checkIn)} (after {hotelDetails?.checkInTime || '3:00 PM'})</p>
                </div>
                
                <div className="relative pl-10">
                  <div className="absolute left-0 rounded-full bg-gray-400 p-1">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-medium">Check-out</p>
                  <p className="text-sm text-gray-600">{formatDate(bookingData.checkOut)} (before {hotelDetails?.checkOutTime || '11:00 AM'})</p>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="mb-8 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Hotel Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-600 mr-2" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p>{hotelDetails?.contactPhone || 'Not available'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-600 mr-2" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p>{hotelDetails?.contactEmail || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hotel Map Location - SVG Interactive Map */}
            {hotelDetails?.coordinates && (
              <div className="mb-8 border rounded-lg overflow-hidden">
                <h3 className="text-lg font-semibold p-4 pb-2">Hotel Location</h3>
                <div className="h-64 w-full relative">
                  <InteractiveMapComponent 
                    lat={hotelDetails.coordinates.lat} 
                    lng={hotelDetails.coordinates.lng} 
                    hotelName={hotelDetails.name}
                    address={hotelDetails.address}
                  />
                </div>
              </div>
            )}
            
            {/* Additional Information */}
            <div className="mb-8 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Important Information</h3>
              
              <div className="mb-4">
                <p className="font-medium mb-1">Check-in Instructions:</p>
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  <li>Please present a valid ID and the credit card used for booking upon arrival</li>
                  <li>Early check-in is subject to availability</li>
                  <li>A security deposit may be required at check-in</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium mb-1">Cancellation Policy:</p>
                <p className="text-sm text-gray-700">{hotelDetails?.cancellationPolicy || 'Standard cancellation policy applies. Please contact the hotel for details.'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
          <button
            onClick={downloadPDF}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </button>
          
          <button
            onClick={printConfirmation}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print
          </button>
          
          <button
            onClick={emailConfirmation}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Mail className="w-5 h-5 mr-2" />
            Email
          </button>
          
          <button
            onClick={addToCalendar}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <CalendarPlus className="w-5 h-5 mr-2" />
            Calendar
          </button>
        </div>
        
        {/* View/Modify Booking & Other Actions */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <button
            onClick={() => navigate(`/manage-booking/${bookingData.id}`)}
            className="bg-white border border-gray-300 text-gray-700 py-3 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Edit className="w-5 h-5 mr-2" />
            View/Modify Booking
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-white border border-gray-300 text-gray-700 py-3 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </button>
          
          <button
            onClick={() => navigate('/bookings')}
            className="bg-white border border-gray-300 text-gray-700 py-3 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            View All Bookings
          </button>
        </div>
        
        <div className="mt-4 print:hidden">
          <button
            onClick={() => navigate('/hotels')}
            className="w-full bg-gray-900 text-white py-3 rounded shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            <PlusSquare className="w-5 h-5 mr-2" />
            Book Another Room
          </button>
        </div>
        
        {/* Customer Support */}
        <div className="mt-8 text-center text-gray-600 text-sm print:hidden">
          <p>Need help? Contact customer support at <span className="font-medium">support@yourhotel.com</span> or call <span className="font-medium">1-800-123-4567</span></p>
        </div>
      </div>
    </div>
  );
};

// Interactive Map Component using SVG
const InteractiveMapComponent = ({ lat, lng, hotelName, address }) => {
  const [zoom, setZoom] = useState(12);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [infoVisible, setInfoVisible] = useState(false);
  
  // Generate some dummy map features based on hotel coordinates
  const generateMapFeatures = () => {
    // Create random streets
    const streets = [];
    for (let i = 0; i < 12; i++) {
      // Horizontal streets
      streets.push(
        <rect 
          key={`h-street-${i}`} 
          x={-500 + (i * 100) + panOffset.x} 
          y={-500 + panOffset.y} 
          width={80} 
          height={10} 
          fill="#E5E7EB" 
          transform={`scale(${zoom / 10})`}
        />
      );
      
      // Vertical streets
      streets.push(
        <rect 
          key={`v-street-${i}`} 
          x={-500 + panOffset.x} 
          y={-500 + (i * 100) + panOffset.y} 
          width={10} 
          height={80} 
          fill="#E5E7EB" 
          transform={`scale(${zoom / 10})`}
        />
      );
    }
    
    // Create some buildings
    const buildings = [];
    for (let i = 0; i < 40; i++) {
      const size = 10 + Math.random() * 20;
      const x = -400 + Math.random() * 800 + panOffset.x;
      const y = -400 + Math.random() * 800 + panOffset.y;
      buildings.push(
        <rect 
          key={`building-${i}`} 
          x={x} 
          y={y} 
          width={size} 
          height={size} 
          fill={i % 5 === 0 ? "#D1D5DB" : "#9CA3AF"} 
          transform={`scale(${zoom / 10})`}
        />
      );
    }
    
    // Add water feature
    const water = (
      <rect 
        key="water" 
        x={-200 + panOffset.x} 
        y={200 + panOffset.y} 
        width={300} 
        height={200} 
        fill="#BFDBFE" 
        transform={`scale(${zoom / 10})`}
      />
    );
    
    // Add park
    const park = (
      <rect 
        key="park" 
        x={100 + panOffset.x} 
        y={-150 + panOffset.y} 
        width={150} 
        height={100} 
        fill="#BBF7D0" 
        transform={`scale(${zoom / 10})`}
      />
    );
    
    return [...streets, ...buildings, water, park];
  };
  
  // Handle mouse events for panning the map
  const startDrag = (e) => {
    setIsDragging(true);
    setStartDragPos({ 
      x: e.clientX - panOffset.x, 
      y: e.clientY - panOffset.y 
    });
  };
  
  const onDrag = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - startDragPos.x,
        y: e.clientY - startDragPos.y
      });
    }
  };
  
  const endDrag = () => {
    setIsDragging(false);
  };
  
  // Handle zoom in/out
  const zoomIn = () => {
    setZoom(Math.min(zoom + 1, 20));
  };
  
  const zoomOut = () => {
    setZoom(Math.max(zoom - 1, 5));
  };
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* SVG Map */}
      <svg 
        className="w-full h-full cursor-move"
        onMouseDown={startDrag}
        onMouseMove={onDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        viewBox="-200 -150 400 300"
      >
        {/* Background */}
        <rect x="-200" y="-150" width="400" height="300" fill="#F3F4F6" />
        
        {/* Map Features */}
        <g>{generateMapFeatures()}</g>
        
        {/* Hotel Marker */}
        <g 
          transform={`translate(0,0) scale(${zoom / 10})`}
          onClick={() => setInfoVisible(!infoVisible)}
          className="cursor-pointer"
        >
          <circle 
            cx={panOffset.x} 
            cy={panOffset.y} 
            r="5" 
            fill="#EF4444" 
            stroke="#B91C1C" 
            strokeWidth="1" 
          />
          <circle 
            cx={panOffset.x} 
            cy={panOffset.y} 
            r="10" 
            fill="#EF4444" 
            opacity="0.3" 
          />
        </g>
        
        {/* Info Box */}
        {infoVisible && (
          <g transform={`translate(${panOffset.x + 10},${panOffset.y - 10}) scale(${zoom / 10})`}>
            <rect 
              x="0" 
              y="-30" 
              width="80" 
              height="30" 
              rx="2" 
              fill="white" 
              stroke="#D1D5DB" 
              strokeWidth="0.5"
            />
            <text x="5" y="-20" fontSize="5" fill="#111827" fontWeight="bold">{hotelName}</text>
            <text x="5" y="-10" fontSize="3" fill="#4B5563">{address.substring(0, 20)}...</text>
          </g>
        )}
      </svg>
      
      {/* Controls */}
      <div className="absolute bottom-2 right-2 flex flex-col">
        <button 
          onClick={zoomIn}
          className="bg-white rounded-t p-1 border border-gray-300 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={zoomOut}
          className="bg-white rounded-b p-1 border-l border-r border-b border-gray-300 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="absolute bottom-2 left-2 bg-white px-2 py-1 text-xs rounded border border-gray-300">
        {hotelName}
      </div>
    </div>
  );
};

// Export the component
export default BookingConfirmation;