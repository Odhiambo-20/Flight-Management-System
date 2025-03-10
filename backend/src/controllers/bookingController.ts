import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import BookingService from '../services/booking.service';
import { BadRequestError, NotFoundError } from '../utils/errors';

class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  // Retrieve active bookings
  async getActiveBookings(req: Request, res: Response) {
    try {
      const { userId } = req.body; // Assuming authenticated route
      const { type } = req.query; // Optional booking type filter
      
      const activeBookings = await this.bookingService.getActiveBookings(
        userId, 
        type as 'HOTEL' | 'FLIGHT' | undefined
      );
      
      res.json({
        success: true,
        data: activeBookings,
        message: 'Active bookings retrieved successfully'
      });
    } catch (error) {
      console.error('Error retrieving active bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active bookings'
      });
    }
  }

  // Create a new booking
  async createBooking(req: Request, res: Response) {
    try {
      const { 
        type,
        userId, 
        roomId, 
        flightId,
        seatNumber,
        checkIn, 
        checkOut, 
        guests 
      } = req.body;

      // Validate required fields based on booking type
      if (!type || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Booking type and user ID are required'
        });
      }

      if (type === 'HOTEL' && (!roomId || !checkIn || !checkOut)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required hotel booking information'
        });
      }

      if (type === 'FLIGHT' && (!flightId || !seatNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required flight reservation information'
        });
      }

      // Prepare booking data based on type with type assertion
      let bookingData: Prisma.HotelBookingCreateInput | Prisma.FlightReservationCreateInput;

      if (type === 'HOTEL') {
        bookingData = {
          user: { 
            connect: { id: userId } 
          },
          room: { 
            connect: { id: roomId } 
          },
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          status: 'CONFIRMED'
        } as Prisma.HotelBookingCreateInput;

        // Only add guests if it's a valid optional field in your Prisma schema
        if (guests !== undefined) {
          (bookingData as any).guests = guests || 1;
        }
      } else {
        bookingData = {
          user: { 
            connect: { id: userId } 
          },
          flight: { 
            connect: { id: flightId } 
          },
          seatNumber,
          status: 'CONFIRMED'
        } as Prisma.FlightReservationCreateInput;
      }

      const booking = await this.bookingService.createBooking(
        type as 'HOTEL' | 'FLIGHT', 
        bookingData
      );

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully'
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Booking creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking'
      });
    }
  }
   // Cancel an existing booking
   async cancelBooking(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const { type } = req.body;

      if (!bookingId || !type) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID and type are required'
        });
      }

      // Convert bookingId from string to number
      const bookingIdNumber = parseInt(bookingId, 10);
      
      // Validate the parsed number
      if (isNaN(bookingIdNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID format'
        });
      }

      const cancelResult = await this.bookingService.cancelBooking(
        type as 'HOTEL' | 'FLIGHT', 
        bookingIdNumber // Pass number instead of string
      );

      res.json({
        success: true,
        data: cancelResult,
        message: 'Booking cancelled successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Booking cancellation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking'
      });
    }
  }

  // Check room availability for specific dates
  async checkRoomAvailability(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const { checkIn, checkOut } = req.query;

      // Validate input
      if (!checkIn || !checkOut || typeof checkIn !== 'string' || typeof checkOut !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required'
        });
      }

      // Convert roomId from string to number
      const roomIdNumber = parseInt(roomId, 10);
      
      // Validate the parsed number
      if (isNaN(roomIdNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room ID format'
        });
      }

      const isAvailable = await this.bookingService.checkRoomAvailability(
        roomIdNumber, // Pass number instead of string
        new Date(checkIn),
        new Date(checkOut)
      );

      res.json({
        success: true,
        available: isAvailable,
        message: isAvailable 
          ? 'Room is available for the selected dates' 
          : 'Room is not available for the selected dates'
      });
    } catch (error) {
      console.error('Room availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking room availability',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get booking details
  async getBookingDetails(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const { type } = req.body;

      if (!bookingId || !type) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID and type are required'
        });
      }

      // Convert bookingId from string to number
      const bookingIdNumber = parseInt(bookingId, 10);
      
      // Validate the parsed number
      if (isNaN(bookingIdNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID format'
        });
      }

      const bookingDetails = await this.bookingService.getBookingDetails(
        type as 'HOTEL' | 'FLIGHT', 
        bookingIdNumber // Pass number instead of string
      );

      res.json({
        success: true,
        data: bookingDetails,
        message: 'Booking details retrieved successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Booking details retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking details'
      });
    }
  }
}

export default new BookingController();