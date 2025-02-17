import { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class HotelController {
  async listRooms(req: Request, res: Response) {
    try {
      // Implement logic to list hotel rooms
      res.json({ message: 'List of hotel rooms' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch hotel rooms' });
    }
  }

  async bookRoom(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      // Implement logic to book a hotel room
      res.json({ message: `Room ${roomId} booked` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to book room' });
    }
  }

  checkRoomAvailability: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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

      const isRoomAvailable = await prisma.hotelRoom.findFirst({
        where: {
          id: String(roomId),
          available: true,
          bookings: {
            none: {
              AND: [
                { checkOut: { gt: new Date(checkIn as string) } },
                { checkIn: { lt: new Date(checkOut as string) } }
              ]
            }
          }
        }
      });

      res.json({
        success: true,
        available: !!isRoomAvailable,
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