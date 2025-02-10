import pool from '../db';

export class DatabaseService {
  static async executeQuery<T>(query: string, values: any[]): Promise<T[]> {
    const { rows } = await pool.query(query, values);
    return rows;
  }
}