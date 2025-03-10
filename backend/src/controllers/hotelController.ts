import { Request, Response } from 'express';
import BookingService from '../services/booking.service';

class HotelController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  listRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hotelId, roomType, minPrice, maxPrice } = req.query;

      const filters = {
        ...(hotelId && { hotelId: hotelId as string }),
        ...(roomType && { roomType: roomType as string }),
        ...(minPrice && { minPrice: Number(minPrice) }),
        ...(maxPrice && { maxPrice: Number(maxPrice) })
      };

      const rooms = await this.bookingService.getAllRooms(filters);
      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch hotel rooms',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  bookRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const bookingDetails = req.body;

      // Create a hotel booking explicitly
      const booking = await this.bookingService.createBooking('HOTEL', {
        roomId,
        ...bookingDetails
      });
      
      res.status(201).json({
        success: true,
        data: booking,
        message: `Room ${roomId} booked successfully`
      });
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to book room',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getOccupiedHotels = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      const occupiedHotels = await this.bookingService.getOccupiedHotels(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json({
        success: true,
        data: occupiedHotels
      });
    } catch (error) {
      console.error('Occupied hotels error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve occupied hotels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getTotalRevenue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const revenue = await this.bookingService.calculateTotalRevenue(
        type ? type as 'HOTEL' | 'FLIGHT' : undefined,
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json({
        success: true,
        data: {
          totalRevenue: revenue,
          currency: 'USD', // Or dynamically fetch from configuration
          type: type || 'ALL'
        }
      });
    } catch (error) {
      console.error('Revenue calculation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate total revenue',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  checkRoomAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const { checkIn, checkOut } = req.query;
  
      if (!checkIn || !checkOut) {
        res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required'
        });
        return;
      }
  
      const checkInDate = new Date(checkIn as string);
      const checkOutDate = new Date(checkOut as string);
  
      // Validate date order
      if (checkOutDate <= checkInDate) {
        res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
        return;
      }
  
      const isRoomAvailable = await this.bookingService.checkRoomAvailability(
        roomId,
        checkInDate,
        checkOutDate
      );
  
      res.json({
        success: true,
        available: isRoomAvailable,
        message: isRoomAvailable
          ? "Room is available for the selected dates"
          : "Room is not available for the selected dates"
      });
    } catch (error) {
      console.error('Room availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking room availability',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new HotelController();