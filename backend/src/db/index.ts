import { Pool } from 'pg';
import { dbConfig } from '../config/dbConfig';

const pool = new Pool(dbConfig);

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

export default pool;