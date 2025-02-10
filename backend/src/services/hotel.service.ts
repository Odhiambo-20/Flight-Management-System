import { HotelSearch } from '../types/types';
import { DatabaseService } from '../services/database.service';

export class HotelService {
  static async searchHotels(searchParams: HotelSearch) {
    const query = `
      SELECT * FROM hotels 
      WHERE location ILIKE $1 
      AND available_rooms >= $2
      AND price_per_night <= $3
    `;

    const values = [
      `%${searchParams.location}%`,
      searchParams.rooms,
      searchParams.maxPrice || 1000
    ];

    return await DatabaseService.executeQuery(query, values);
  }
}
