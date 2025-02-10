// Types for travel booking system with validation and documentation
import { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';

/**
 * Flight search parameters interface with validation schema
 * @property from - Departure airport code (e.g., 'LAX', 'JFK')
 * @property to - Arrival airport code
 * @property tripType - Whether the flight is one-way or round-trip
 * @property class - Cabin class selection
 * @property adults - Number of adult passengers (1-9)
 * @property departureDate - Date of departure in ISO format
 * @property returnDate - Optional return date for round-trips
 */
export interface FlightSearch {
  from: string;
  to: string;
  tripType: 'oneWay' | 'roundTrip';
  class: 'economy' | 'business' | 'first';
  adults: number;
  departureDate: string;
  returnDate?: string;
}

// Validation schema for FlightSearch
export const FlightSearchSchema = z.object({
  from: z.string().length(3).uppercase(),
  to: z.string().length(3).uppercase(),
  tripType: z.enum(['oneWay', 'roundTrip']),
  class: z.enum(['economy', 'business', 'first']),
  adults: z.number().min(1).max(9),
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().optional()
}).refine(data => {
  if (data.tripType === 'roundTrip' && !data.returnDate) {
    return false;
  }
  if (data.from === data.to) {
    return false;
  }
  return true;
}, {
  message: "Invalid flight search parameters"
});

/**
 * Hotel search parameters interface with validation schema
 * @property checkIn - Check-in date in ISO format
 * @property checkOut - Check-out date in ISO format
 * @property adults - Number of adult guests
 * @property children - Number of children guests
 * @property rooms - Number of rooms required
 * @property location - Hotel location (city, region, or specific address)
 */
export interface HotelSearch {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  location: string;
  maxPrice?: number;
}

// Validation schema for HotelSearch
export const HotelSearchSchema = z.object({
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  adults: z.number().min(1),
  children: z.number().min(0),
  rooms: z.number().min(1),
  location: z.string().min(2)
}).refine(data => {
  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);
  return checkOutDate > checkInDate;
}, {
  message: "Check-out date must be after check-in date"
});

/**
 * Flight details interface
 * @property id - Unique flight identifier
 * @property from - Departure airport code
 * @property to - Arrival airport code
 * @property departureTime - Departure date and time
 * @property arrivalTime - Arrival date and time
 * @property price - Flight price in the default currency
 * @property class - Cabin class
 * @property availableSeats - Number of seats available
 */
export interface Flight {
  id: number;
  from: string;
  to: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  class: string;
  availableSeats: number;
}

/**
 * Hotel details interface
 * @property id - Unique hotel identifier
 * @property name - Hotel name
 * @property location - Hotel location
 * @property price - Price per night in the default currency
 * @property availableRooms - Number of rooms available
 * @property rating - Hotel rating (0-5)
 * @property amenities - List of available amenities
 */
export interface Hotel {
  id: number;
  name: string;
  location: string;
  price: number;
  availableRooms: number;
  rating: number;
  amenities: string[];
}

// Extended Express Request interface to include user authentication
declare module 'express-serve-static-core' {
  interface Request {
    user?: string | JwtPayload;
  }
}

// Type guard to check if user is authenticated
export function isAuthenticated(user: Request['user']): user is JwtPayload {
  return user !== undefined && typeof user !== 'string';
}

// Utility type for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}