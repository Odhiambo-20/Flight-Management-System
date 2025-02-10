import { PrismaClient, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

interface FlightFilters {
  date?: string;
  direction?: string;
}

interface FlightResponse {
  id: string;
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
  reservedSeats: string[];
}

interface ReservationResponse {
  reservationId: string;
  flightId: string;
  seatNumber: string;
  status: string;
}

export class FlightService {
  async listFlights(filters: FlightFilters): Promise<FlightResponse[]> {
    try {
      const { date, direction } = filters;
      
      // Build filter conditions
      const where: Prisma.FlightWhereInput = {
        availableSeats: {
          gt: 0 // Only show flights with available seats
        }
      };

      // Add date filter if provided
      if (date) {
        const searchDate = new Date(date);
        where.departureTime = {
          gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          lt: new Date(searchDate.setHours(23, 59, 59, 999))
        };
      }

      // Add direction filter if provided
      if (direction) {
        where.OR = [
          { from: direction },
          { to: direction }
        ];
      }

      // Fetch flights with filters
      const flights = await prisma.flight.findMany({
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

      // Transform the data for response
      return flights.map(flight => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        from: flight.from,
        to: flight.to,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        availableSeats: flight.availableSeats,
        price: flight.price,
        totalReservations: flight._count.reservations
      }));
    } catch (error) {
      console.error('Error listing flights:', error);
      throw error;
    }
  }

  async getFlightDetails(flightId: string): Promise<FlightDetailsResponse> {
    try {
      const flight = await prisma.flight.findUnique({
        where: { id: flightId },
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

      return {
        id: flight.id,
        flightNumber: flight.flightNumber,
        from: flight.from,
        to: flight.to,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        availableSeats: flight.availableSeats,
        price: flight.price,
        reservedSeats: flight.reservations
          .filter(r => r.status === 'CONFIRMED')
          .map(r => r.seatNumber)
      };
    } catch (error) {
      console.error('Error getting flight details:', error);
      throw error;
    }
  }

  async reserveFlight(userId: string, flightId: string, seatNumber: string): Promise<ReservationResponse> {
    try {
      return await prisma.$transaction(async (tx) => {
        const flight = await tx.flight.findUnique({
          where: { id: flightId },
          include: {
            reservations: {
              where: {
                seatNumber,
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

        if (flight.reservations.length > 0) {
          throw new BadRequestError('Seat already reserved');
        }

        const existingReservation = await tx.flightReservation.findFirst({
          where: {
            userId,
            flightId,
            status: 'CONFIRMED'
          }
        });

        if (existingReservation) {
          throw new BadRequestError('User already has a reservation on this flight');
        }

        const reservation = await tx.flightReservation.create({
          data: {
            userId,
            flightId,
            seatNumber,
            status: 'PENDING'
          }
        });

        await tx.flight.update({
          where: { id: flightId },
          data: {
            availableSeats: {
              decrement: 1
            }
          }
        });

        return {
          reservationId: reservation.id,
          flightId: flight.id,
          seatNumber: reservation.seatNumber,
          status: reservation.status
        };
      });
    } catch (error) {
      console.error('Error reserving flight:', error);
      throw error;
    }
  }

  async validateSeatAvailability(flightId: string, seatNumber: string): Promise<boolean> {
    const reservation = await prisma.flightReservation.findFirst({
      where: {
        flightId,
        seatNumber,
        status: 'CONFIRMED'
      }
    });

    return !reservation;
  }

  async updateReservationStatus(reservationId: string, status: string): Promise<void> {
    await prisma.flightReservation.update({
      where: { id: reservationId },
      data: { status }
    });
  }

  async cancelReservation(reservationId: string, userId: string): Promise<{ message: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        const reservation = await tx.flightReservation.findFirst({
          where: {
            id: reservationId,
            userId,
            status: 'CONFIRMED'
          }
        });

        if (!reservation) {
          throw new NotFoundError('Reservation not found');
        }

        await tx.flightReservation.update({
          where: { id: reservationId },
          data: { status: 'CANCELLED' }
        });

        await tx.flight.update({
          where: { id: reservation.flightId },
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
}