import prisma from '../lib/prisma'
import { Prisma } from '.prisma/client'

export class BookingService {
  // Hotel Booking Methods
  async createHotelBooking(data: Prisma.HotelBookingCreateInput) {
    return prisma.hotelBooking.create({
      data,
      include: {
        user: true,
        room: {
          include: {
            hotel: true
          }
        },
        payment: true
      }
    })
  }

  async updateHotelBooking(id: string, data: Prisma.HotelBookingUpdateInput) {
    return prisma.hotelBooking.update({
      where: { id },
      data,
      include: {
        user: true,
        room: {
          include: {
            hotel: true
          }
        },
        payment: true
      }
    })
  }

  async getHotelBooking(id: string) {
    return prisma.hotelBooking.findUnique({
      where: { id },
      include: {
        user: true,
        room: {
          include: {
            hotel: true
          }
        },
        payment: true
      }
    })
  }

  async getUserHotelBookings(userId: string) {
    return prisma.hotelBooking.findMany({
      where: { userId },
      include: {
        user: true,
        room: {
          include: {
            hotel: true
          }
        },
        payment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async cancelHotelBooking(id: string) {
    return prisma.hotelBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        user: true,
        room: {
          include: {
            hotel: true
          }
        },
        payment: true
      }
    })
  }

  // Flight Reservation Methods
  async createFlightReservation(data: Prisma.FlightReservationCreateInput) {
    return prisma.flightReservation.create({
      data,
      include: {
        user: true,
        flight: true,
        payment: true
      }
    })
  }

  async updateFlightReservation(id: string, data: Prisma.FlightReservationUpdateInput) {
    return prisma.flightReservation.update({
      where: { id },
      data,
      include: {
        user: true,
        flight: true,
        payment: true
      }
    })
  }

  async getFlightReservation(id: string) {
    return prisma.flightReservation.findUnique({
      where: { id },
      include: {
        user: true,
        flight: true,
        payment: true
      }
    })
  }

  async getUserFlightReservations(userId: string) {
    return prisma.flightReservation.findMany({
      where: { userId },
      include: {
        user: true,
        flight: true,
        payment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async cancelFlightReservation(id: string) {
    return prisma.flightReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        user: true,
        flight: true,
        payment: true
      }
    })
  }

  // Utility Methods
  async checkRoomAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date
  ) {
    const overlappingBookings = await prisma.hotelBooking.findMany({
      where: {
        roomId,
        status: 'CONFIRMED',
        OR: [
          {
            AND: [
              { checkIn: { lte: checkIn } },
              { checkOut: { gt: checkIn } }
            ]
          },
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gte: checkOut } }
            ]
          },
          {
            AND: [
              { checkIn: { gte: checkIn } },
              { checkOut: { lte: checkOut } }
            ]
          }
        ]
      }
    })

    return overlappingBookings.length === 0
  }

  async checkFlightAvailability(
    flightId: string,
    seatNumber: string
  ) {
    const existingReservation = await prisma.flightReservation.findFirst({
      where: {
        flightId,
        seatNumber,
        status: 'CONFIRMED'
      }
    })

    return !existingReservation
  }
}

export default BookingService