import { Request, Response } from 'express';
import { FlightService } from '../services/flight.service';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class FlightController {
  constructor(private flightService: FlightService) {}

  async listFlights(req: Request, res: Response) {
    try {
      const { date, departure, arrival, direction } = req.query;
      const flights = await this.flightService.listFlights({
        date: date as string,
        departure: departure as string,
        arrival: arrival as string,
        direction: direction as string
      });
      
      res.json({
        success: true,
        data: flights
      });
    } catch (error) {
      console.error('Error in listFlights:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch flights' 
      });
    }
  }

  async getFlightDetails(req: Request, res: Response) {
    try {
      const { flightId } = req.params;
      const flight = await this.flightService.getFlightDetails(parseInt(flightId, 10));
      
      res.json({
        success: true,
        data: flight
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch flight details' 
      });
    }
  }

  async reserveFlight(req: Request, res: Response) {
    try {
      const { userId, flightId, seatNumber } = req.body;
      
      if (!userId || !flightId || seatNumber === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const reservation = await this.flightService.reserveFlight(
        parseInt(userId, 10),
        parseInt(flightId, 10),
        parseInt(seatNumber, 10)
      );

      res.json({
        success: true,
        data: reservation
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error in reserveFlight:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to reserve flight'
        });
      }
    }
  }

  async cancelReservation(req: Request, res: Response) {
    try {
      const { reservationId } = req.params;
      const { userId } = req.body;

      if (!reservationId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const result = await this.flightService.cancelReservation(
        parseInt(reservationId, 10), 
        parseInt(userId, 10)
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error in cancelReservation:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to cancel reservation'
        });
      }
    }
  }

  async getActiveFlights(req: Request, res: Response) {
    try {
      const activeFlights = await this.flightService.getActiveFlights();
      res.json({
        success: true,
        data: activeFlights
      });
    } catch (error) {
      console.error('Error in getActiveFlights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active flights'
      });
    }
  }
  
  async getBookingTrends(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      // Validate and parse date strings
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      // Parse dates, ensuring they are valid
      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      // Validate parsed dates
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      const bookingTrends = await this.flightService.getBookingTrends(
        parsedStartDate, 
        parsedEndDate
      );
      
      res.json({
        success: true,
        data: bookingTrends
      });
    } catch (error) {
      console.error('Error in getBookingTrends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking trends'
      });
    }
  }

  async getFlightRoutes(req: Request, res: Response) {
    try {
      const routesData = await this.flightService.getFlightRoutes();
      
      res.json(routesData); // This now contains { flightRoutes: [...] }
    } catch (error) {
      console.error('Error in getFlightRoutes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve flight routes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Create an instance of FlightController with the required FlightService
const flightService = new FlightService();
export const flightController = new FlightController(flightService);