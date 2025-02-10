// src/types/index.ts
interface Flight {
    id: string;
    from: string;
    to: string;
    departureTime: Date;
    arrivalTime: Date;
    availableSeats: number;
    price: number;
  }
  
  interface User {
    id: string;
    email: string;
    password: string;
    name: string;
  }
  
  interface Reservation {
    id: string;
    flightId: string;
    userId: string;
    seatNumber: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    createdAt: Date;
  }
  
  interface HotelRoom {
    id: string;
    roomNumber: string;
    type: string;
    price: number;
    isAvailable: boolean;
  }
  
  interface HotelBooking {
    id: string;
    userId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  }
  
  interface Payment {
    id: string;
    userId: string;
    amount: number;
    type: 'FLIGHT' | 'HOTEL';
    referenceId: string; // flightId or hotelBookingId
    paymentMethod: 'PAYPAL' | 'MPESA' | 'VISA' | 'MASTERCARD';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
  }
  