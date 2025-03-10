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

  async updateHotelBooking(id: number, data: Prisma.HotelBookingUpdateInput) {
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

  async getHotelBooking(id: number) {
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

  async getUserHotelBookings(userId: number) {
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

  async cancelHotelBooking(id: number) {
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

  async updateFlightReservation(id: number, data: Prisma.FlightReservationUpdateInput) {
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

  async getFlightReservation(id: number) {
    return prisma.flightReservation.findUnique({
      where: { id },
      include: {
        user: true,
        flight: true,
        payment: true
      }
    })
  }

  async getUserFlightReservations(userId: number) {
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

  async cancelFlightReservation(id: number) {
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

  // Unified Booking Methods
  async createBooking(
    type: 'HOTEL' | 'FLIGHT', 
    data: Prisma.HotelBookingCreateInput | Prisma.FlightReservationCreateInput
  ): Promise<any> {
    if (type === 'HOTEL') {
      return this.createHotelBooking(data as Prisma.HotelBookingCreateInput)
    } else {
      return this.createFlightReservation(data as Prisma.FlightReservationCreateInput)
    }
  }

  async cancelBooking(
    type: 'HOTEL' | 'FLIGHT', 
    id: number
  ): Promise<any> {
    if (type === 'HOTEL') {
      return this.cancelHotelBooking(id)
    } else {
      return this.cancelFlightReservation(id)
    }
  }

  async getBookingDetails(
    type: 'HOTEL' | 'FLIGHT', 
    id: number
  ): Promise<any> {
    if (type === 'HOTEL') {
      return this.getHotelBooking(id)
    } else {
      return this.getFlightReservation(id)
    }
  }

  async getActiveBookings(
    userId: number, 
    type?: 'HOTEL' | 'FLIGHT'
  ): Promise<any[]> {
    if (type === 'HOTEL') {
      return prisma.hotelBooking.findMany({
        where: { 
          userId, 
          status: 'CONFIRMED' 
        },
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
    } else if (type === 'FLIGHT') {
      return prisma.flightReservation.findMany({
        where: { 
          userId, 
          status: 'CONFIRMED' 
        },
        include: {
          user: true,
          flight: true,
          payment: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // If no type specified, fetch both hotel and flight bookings
      const hotelBookings = await prisma.hotelBooking.findMany({
        where: { 
          userId, 
          status: 'CONFIRMED' 
        },
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

      const flightReservations = await prisma.flightReservation.findMany({
        where: { 
          userId, 
          status: 'CONFIRMED' 
        },
        include: {
          user: true,
          flight: true,
          payment: true
        }
      })

      return [...hotelBookings, ...flightReservations]
    }
  }

  // Utility Methods
  async checkRoomAvailability(roomId: number, checkIn: Date, checkOut: Date): Promise<boolean> {
    console.log("Checking room availability for:", {
      roomId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString()
    });
  
    // Log all bookings for this room regardless of status or dates
    const allBookings = await prisma.hotelBooking.findMany({
      where: { roomId }
    });
    console.log(`Found ${allBookings.length} total bookings for room ${roomId}:`, 
      allBookings.map(b => ({
        id: b.id,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut
      }))
    );
  
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
    });
  
    console.log(`Found ${overlappingBookings.length} overlapping bookings:`, 
      overlappingBookings.map(b => ({
        id: b.id,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut
      }))
    );
  
    return overlappingBookings.length === 0;
  }

  async checkFlightAvailability(
    flightId: number,
    seatNumber: number
  ): Promise<boolean> {
    const existingReservation = await prisma.flightReservation.findFirst({
      where: {
        flightId,
        seatNumber,
        status: 'CONFIRMED'
      }
    })

    return !existingReservation
  }

  // New method to calculate total revenue
  async calculateTotalRevenue(
    type?: 'HOTEL' | 'FLIGHT', 
    startDate?: Date, 
    endDate?: Date
  ): Promise<number> {
    // Base query conditions
    const baseHotelConditions: Prisma.HotelBookingWhereInput = {
      status: 'CONFIRMED',
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } })
    }

    const baseFlightConditions: Prisma.FlightReservationWhereInput = {
      status: 'CONFIRMED',
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } })
    }

    if (type === 'HOTEL') {
      // Calculate hotel bookings revenue
      const hotelBookings = await prisma.hotelBooking.findMany({
        where: baseHotelConditions,
        include: { payment: true }
      })

      return hotelBookings.reduce((total, booking) => 
        total + (booking.payment?.amount || 0), 0)
    } else if (type === 'FLIGHT') {
      // Calculate flight reservations revenue
      const flightReservations = await prisma.flightReservation.findMany({
        where: baseFlightConditions,
        include: { payment: true }
      })

      return flightReservations.reduce((total, reservation) => 
        total + (reservation.payment?.amount || 0), 0)
    } else {
      // Calculate total revenue for all bookings
      const hotelBookings = await prisma.hotelBooking.findMany({
        where: baseHotelConditions,
        include: { payment: true }
      })

      const flightReservations = await prisma.flightReservation.findMany({
        where: baseFlightConditions,
        include: { payment: true }
      })

      const hotelRevenue = hotelBookings.reduce((total, booking) => 
        total + (booking.payment?.amount || 0), 0)
      
      const flightRevenue = flightReservations.reduce((total, reservation) => 
        total + (reservation.payment?.amount || 0), 0)

      return hotelRevenue + flightRevenue
    }
  }

  // New method to get occupied hotels
  async getOccupiedHotels(
    startDate?: Date, 
    endDate?: Date
  ): Promise<any[]> {
    // Find hotels with confirmed bookings in the specified date range
    const occupiedHotels = await prisma.hotel.findMany({
      where: {
        rooms: {
          some: {
            bookings: { // Changed 'hotelBookings' to 'bookings' to match the schema
              some: {
                status: 'CONFIRMED',
                ...(startDate && { checkIn: { gte: startDate } }),
                ...(endDate && { checkOut: { lte: endDate } })
              }
            }
          }
        }
      },
      include: {
        rooms: {
          include: {
            bookings: { // Changed 'hotelBookings' to 'bookings' to match the schema
              where: {
                status: 'CONFIRMED',
                ...(startDate && { checkIn: { gte: startDate } }),
                ...(endDate && { checkOut: { lte: endDate } })
              }
            }
          }
        }
      }
    })

    return occupiedHotels
  }

  // New method to get all rooms
  async getAllRooms(
    filters?: {
      hotelId?: number,
      roomType?: string,
      minPrice?: number,
      maxPrice?: number
    }
  ): Promise<any[]> {
    // Construct dynamic where conditions based on filters
    const whereConditions: Prisma.HotelRoomWhereInput = { // Changed to HotelRoomWhereInput
      ...(filters?.hotelId && { hotelId: filters.hotelId }),
      ...(filters?.roomType && { type: filters.roomType }),
      ...(filters?.minPrice && filters?.maxPrice && { 
        price: { 
          gte: filters.minPrice, 
          lte: filters.maxPrice 
        } 
      })
    }

    // Fetch rooms with included details
    const rooms = await prisma.hotelRoom.findMany({ // Changed to hotelRoom
      where: whereConditions,
      include: {
        hotel: true,
        bookings: { // Changed 'hotelBookings' to 'bookings' to match the schema
          where: { status: 'CONFIRMED' },
          select: { checkIn: true, checkOut: true }
        }
      }
    })

    return rooms
  }
}

export default BookingService