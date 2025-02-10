import { Request, Response } from 'express';
import { FlightService } from '../services/flight.service';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class FlightController {
  constructor(private flightService: FlightService) {}

  async listFlights(req: Request, res: Response) {
    try {
      const { date, direction } = req.query;
      const flights = await this.flightService.listFlights({
        date: date as string,
        direction: direction as string
      });
      res.json({
        success: true,
        data: flights
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch flights' 
      });
    }
  }

  async getFlightDetails(req: Request, res: Response) {
    try {
      const { flightId } = req.params;
      const flight = await this.flightService.getFlightDetails(flightId);
      if (!flight) {
        return res.status(404).json({ 
          success: false, 
          message: 'Flight not found' 
        });
      }
      res.json({
        success: true,
        data: flight
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch flight details' 
      });
    }
  }

  async reserveFlight(req: Request, res: Response) {
    try {
      const { userId, flightId, seatNumber } = req.body;
      
      if (!userId || !flightId || !seatNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const reservation = await this.flightService.reserveFlight(
        userId,
        flightId,
        seatNumber
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

      const result = await this.flightService.cancelReservation(reservationId, userId);
      
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
        res.status(500).json({
          success: false,
          message: 'Failed to cancel reservation'
        });
      }
    }
  }
}

// Create an instance of FlightController with the required FlightService
const flightService = new FlightService();
export const flightController = new FlightController(flightService);