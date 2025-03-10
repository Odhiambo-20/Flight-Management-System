import { PrismaClient, Prisma, Flight, FlightReservation } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface FlightFilters {
  date?: string;
  departure?: string;
  arrival?: string;
  direction?: string;
}

interface FlightResponse {
  id: number;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: Date;
  arrivalTime: Date;
  availableSeats: number;
  price: number;
  totalReservations?: number;
}

interface FlightDetailsResponse extends FlightResponse {
  reservedSeats: number[];
}

interface ReservationResponse {
  reservationId: number;
  flightId: number;
  seatNumber: number;
  status: string;
}

interface ReservationItem {
  seatNumber: number;
  status: string;
}

interface ActiveFlightResponse extends FlightResponse {
  status: string;
}

interface BookingTrendResponse {
  date: Date;
  totalBookings: number;
  totalRevenue: number;
}

interface FlightRoute {
  from: string;
  to: string;
  coordinates: {
    origin: [number, number];
    destination: [number, number];
  };
}

interface AirportCoordinates {
  [code: string]: [number, number];
}

export class FlightService {
  private prisma: PrismaClient;
  private coordinatesCache: AirportCoordinates;
  private readonly AVIATION_API_KEY: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.coordinatesCache = {};
    this.AVIATION_API_KEY = process.env.AVIATION_API_KEY || '';
    
    if (!this.AVIATION_API_KEY) {
      console.warn('Aviation API key not found in environment variables');
    }
  }

  async getAirportCoordinates(code: string): Promise<[number, number] | null> {
    try {
      // Return from cache if available
      if (this.coordinatesCache[code]) {
        return this.coordinatesCache[code];
      }

      const url = `http://api.aviationstack.com/v1/airports?access_key=${this.AVIATION_API_KEY}&iata_code=${code}`;
      const response = await axios.get(url);
     
      
      if (!response.data.data || response.data.data.length === 0) {
        console.warn(`No data found for airport code: ${code}`);
        return null;
      }

      const { longitude, latitude } = response.data.data[0];
      
      // Convert to numbers and ensure they're in the correct order for our interface
      const coordinates: [number, number] = [
        parseFloat(longitude), 
        parseFloat(latitude)
      ];
      
      // Cache the result for future requests
      this.coordinatesCache[code] = coordinates;
      
      return coordinates;
    } catch (error) {
      console.error(`Error fetching coordinates for airport ${code}:`, error);
      return null;
    }
  }

  async listFlights(filters: FlightFilters): Promise<FlightResponse[]> {
    try {
      const { date, departure, arrival, direction } = filters;
      
      const where: Prisma.FlightWhereInput = {
        availableSeats: {
          gt: 0
        }
      };

      if (date) {
        const searchDate = new Date(date);
        where.departureTime = {
          gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          lt: new Date(searchDate.setHours(23, 59, 59, 999))
        };
      }

      // Handle specific departure airport
      if (departure) {
        where.from = departure;
      }

      // Handle specific arrival airport
      if (arrival) {
        where.to = arrival;
      }

      // Handle direction (either departure or arrival)
      if (direction && !departure && !arrival) {
        where.OR = [
          { from: direction },
          { to: direction }
        ];
      }

      const flights = await this.prisma.flight.findMany({
        where,
        orderBy: {
          departureTime: 'asc'
        },
        include: {
          _count: {
            select: {
              reservations: true
            }
          }
        }
      });

      const flightResponses: FlightResponse[] = flights.map(flight => ({
        id: Number(flight.id),
        flightNumber: flight.flightNumber,
        from: flight.from,
        to: flight.to,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        availableSeats: flight.availableSeats,
        price: flight.price,
        totalReservations: flight._count.reservations
      }));

      return flightResponses;
    } catch (error) {
      console.error('Error listing flights:', error);
      throw error;
    }
  }

  async getFlightDetails(flightId: number): Promise<FlightDetailsResponse> {
    try {
      const numericFlightId = Number(flightId);

      const flight = await this.prisma.flight.findUnique({
        where: { id: numericFlightId },
        include: {
          reservations: {
            select: {
              seatNumber: true,
              status: true
            }
          }
        }
      });

      if (!flight) {
        throw new NotFoundError('Flight not found');
      }

      const reservations = flight.reservations || [];
      
      const typedReservations = reservations.map(r => ({
        seatNumber: Number(r.seatNumber),
        status: String(r.status)
      }));

      return {
        id: Number(flight.id),
        flightNumber: flight.flightNumber,
        from: flight.from,
        to: flight.to,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        availableSeats: flight.availableSeats,
        price: flight.price,
        reservedSeats: typedReservations
          .filter(r => r.status === 'CONFIRMED')
          .map(r => r.seatNumber)
      };
    } catch (error) {
      console.error('Error getting flight details:', error);
      throw error;
    }
  }

  async reserveFlight(userId: number, flightId: number, seatNumber: number): Promise<ReservationResponse> {
    try {
      const numericUserId = Number(userId);
      const numericFlightId = Number(flightId);
      const numericSeatNumber = Number(seatNumber);

      return await this.prisma.$transaction(async (tx) => {
        const flight = await tx.flight.findUnique({
          where: { id: numericFlightId },
          include: {
            reservations: {
              where: {
                seatNumber: numericSeatNumber,
                status: 'CONFIRMED'
              }
            }
          }
        });

        if (!flight) {
          throw new NotFoundError('Flight not found');
        }

        if (flight.availableSeats <= 0) {
          throw new BadRequestError('No available seats on this flight');
        }

        if (flight.reservations && flight.reservations.length > 0) {
          throw new BadRequestError('Seat already reserved');
        }

        const existingReservation = await tx.flightReservation.findFirst({
          where: {
            userId: numericUserId,
            flightId: numericFlightId,
            status: 'CONFIRMED'
          }
        });

        if (existingReservation) {
          throw new BadRequestError('User already has a reservation on this flight');
        }

        const reservation = await tx.flightReservation.create({
          data: {
            userId: numericUserId,
            flightId: numericFlightId,
            seatNumber: numericSeatNumber,
            status: 'CONFIRMED' // Changed from PENDING to CONFIRMED for simplicity
          }
        });

        await tx.flight.update({
          where: { id: numericFlightId },
          data: {
            availableSeats: {
              decrement: 1
            }
          }
        });

        return {
          reservationId: Number(reservation.id),
          flightId: Number(reservation.flightId),
          seatNumber: Number(reservation.seatNumber),
          status: reservation.status
        };
      });
    } catch (error) {
      console.error('Error reserving flight:', error);
      throw error;
    }
  }

  async validateSeatAvailability(flightId: number, seatNumber: number): Promise<boolean> {
    const numericFlightId = Number(flightId);
    const numericSeatNumber = Number(seatNumber);

    const reservation = await this.prisma.flightReservation.findFirst({
      where: {
        flightId: numericFlightId,
        seatNumber: numericSeatNumber,
        status: 'CONFIRMED'
      }
    });

    return !reservation;
  }

  async updateReservationStatus(reservationId: number, status: string): Promise<void> {
    const numericReservationId = Number(reservationId);

    await this.prisma.flightReservation.update({
      where: { id: numericReservationId },
      data: { status }
    });
  }

  async cancelReservation(reservationId: number, userId: number): Promise<{ message: string }> {
    try {
      const numericReservationId = Number(reservationId);
      const numericUserId = Number(userId);

      return await this.prisma.$transaction(async (tx) => {
        const reservation = await tx.flightReservation.findFirst({
          where: {
            id: numericReservationId,
            userId: numericUserId,
            status: 'CONFIRMED'
          }
        });

        if (!reservation) {
          throw new NotFoundError('Reservation not found');
        }

        await tx.flightReservation.update({
          where: { id: numericReservationId },
          data: { status: 'CANCELLED' }
        });

        await tx.flight.update({
          where: { id: Number(reservation.flightId) },
          data: {
            availableSeats: {
              increment: 1
            }
          }
        });

        return { message: 'Reservation cancelled successfully' };
      });
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  async getActiveFlights(): Promise<ActiveFlightResponse[]> {
    try {
      const now = new Date();
      
      const flights = await this.prisma.flight.findMany({
        where: {
          departureTime: {
            gt: now
          },
          availableSeats: {
            gt: 0
          }
        },
        include: {
          _count: {
            select: {
              reservations: true
            }
          }
        },
        orderBy: {
          departureTime: 'asc'
        }
      });

      return flights.map(flight => ({
        id: Number(flight.id),
        flightNumber: flight.flightNumber,
        from: flight.from,
        to: flight.to,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        availableSeats: flight.availableSeats,
        price: flight.price,
        totalReservations: flight._count.reservations,
        status: flight.departureTime > now ? 'UPCOMING' : 'ACTIVE'
      }));
    } catch (error) {
      console.error('Error fetching active flights:', error);
      throw error;
    }
  }

  async getFlightRoutes(): Promise<FlightRoute[]> {
    try {
      const now = new Date();
      
      const routes = await this.prisma.flight.findMany({
        select: {
          from: true,
          to: true,
        },
        distinct: ['from', 'to'],
        where: {
          departureTime: {
            gt: now
          }
        }
      });
      
      // Use API to get coordinates
      const routesWithCoordinates: FlightRoute[] = [];
      
      for (const route of routes) {
        const originCoordinates = await this.getAirportCoordinates(route.from);
        const destinationCoordinates = await this.getAirportCoordinates(route.to);
        
        if (originCoordinates && destinationCoordinates) {
          routesWithCoordinates.push({
            from: route.from,
            to: route.to,
            coordinates: {
              origin: originCoordinates,
              destination: destinationCoordinates
            }
          });
        } else {
          console.warn(`Skipping route ${route.from} to ${route.to} due to missing coordinates`);
        }
      }
      
      return routesWithCoordinates;
    } catch (error) {
      console.error('Error fetching flight routes:', error);
      throw error;
    }
  }

  async getBookingTrends(startDate: Date, endDate: Date): Promise<BookingTrendResponse[]> {
    try {
      if (endDate < startDate) {
        throw new BadRequestError('End date must be after start date');
      }

      // Get all confirmed reservations in the date range
      const confirmedReservations = await this.prisma.flightReservation.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'CONFIRMED'
        },
        include: {
          flight: {
            select: {
              price: true
            }
          }
        }
      });

      // Group by date
      const dateMap = new Map<string, { totalBookings: number, totalRevenue: number }>();
      
      confirmedReservations.forEach(reservation => {
        const dateKey = reservation.createdAt.toISOString().split('T')[0];
        const currentData = dateMap.get(dateKey) || { totalBookings: 0, totalRevenue: 0 };
        
        dateMap.set(dateKey, {
          totalBookings: currentData.totalBookings + 1,
          totalRevenue: currentData.totalRevenue + (reservation.flight?.price || 0)
        });
      });

      // Convert map to array
      return Array.from(dateMap.entries()).map(([dateString, data]) => ({
        date: new Date(dateString),
        totalBookings: data.totalBookings,
        totalRevenue: data.totalRevenue
      }));
    } catch (error) {
      console.error('Error fetching booking trends:', error);
      throw error;
    }
  }
}

export default new FlightService();