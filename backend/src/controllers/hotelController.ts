import { Request, Response } from 'express';

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
}

export default new HotelController();