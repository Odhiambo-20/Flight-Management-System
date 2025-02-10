import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { flightController } from './controllers/flightController';
import cors from 'cors';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { Prisma } from '@prisma/client'

config();

const prisma = new PrismaClient();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Interfaces
interface HotelSearchCriteria {
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  maxPrice?: number;
  roomType?: string;
}

// Auth Controller
class AuthController {
  public signup: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        phoneNumber,    // Now required
        dateOfBirth,    // Now required
        nationality     // Now required
      } = req.body;
  
      // Validate that all required fields are present
      if (!phoneNumber || !dateOfBirth || !nationality) {
        res.status(400).json({ 
          message: 'Phone number, date of birth, and nationality are required' 
        });
        return;
      }
  
      if (password !== confirmPassword) {
        res.status(400).json({ message: "Passwords don't match" });
        return;
      }
  
      const userExists = await prisma.user.findUnique({
        where: { email }
      });
  
      if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          dateOfBirth: new Date(dateOfBirth),
          nationality
        } as Prisma.UserCreateInput,
        select: {
          id: true,
          email: true
        }
      });
  
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );
  
      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Failed to sign up user' });
    }
  };
  
 

  public signin: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
  
      const user = await prisma.user.findUnique({
        where: { email }
      });
  
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }
  
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );
  
      res.json({
        message: 'Successfully signed in',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ message: 'Failed to sign in' });
    }
  };
}

// Hotel Controller
class HotelController {
  public search: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
    try {
      console.log('Performing basic search');
      
      const hotels = await prisma.hotelRoom.findMany({
        include: {
          hotel: true,
          bookings: true
        },
        where: {
          available: true
        }
      });

      console.log('Found hotels:', hotels.length);

      res.json({
        success: true,
        data: hotels,
        message: "Hotels retrieved successfully"
      });
    } catch (error) {
      console.error('Basic search error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching hotels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public searchWithCriteria: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Search criteria received:', req.query);
      
      const {
        checkIn,
        checkOut,
        adults,
        children,
        maxPrice,
        roomType
      } = req.query as HotelSearchCriteria;

      const where: any = {
        available: true
      };

      if (maxPrice) {
        where.price = {
          lte: parseFloat(maxPrice.toString())
        };
      }

      if (roomType) {
        where.type = roomType;
      }

      if (checkIn && checkOut) {
        where.bookings = {
          none: {
            AND: [
              {
                checkOut: {
                  gt: new Date(checkIn)
                }
              },
              {
                checkIn: {
                  lt: new Date(checkOut)
                }
              }
            ]
          }
        };
      }

      console.log('Constructed where clause:', JSON.stringify(where, null, 2));

      const availableRooms = await prisma.hotelRoom.findMany({
        where,
        include: {
          hotel: true,
          bookings: {
            where: {
              AND: [
                {
                  checkOut: {
                    gt: checkIn ? new Date(checkIn) : undefined
                  }
                },
                {
                  checkIn: {
                    lt: checkOut ? new Date(checkOut) : undefined
                  }
                }
              ]
            }
          }
        },
        orderBy: {
          price: 'asc'
        }
      });

      console.log('Search results:', availableRooms.length);

      res.json({
        success: true,
        data: availableRooms,
        message: "Available rooms retrieved successfully",
        searchCriteria: {
          checkIn,
          checkOut,
          adults,
          children,
          maxPrice,
          roomType
        }
      });
    } catch (error) {
      console.error('Search with criteria error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching hotels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public bookRoom: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Booking request received:', req.body);
      
      const { userId, roomId, checkIn, checkOut } = req.body;

      const isRoomAvailable = await prisma.hotelRoom.findFirst({
        where: {
          id: roomId,
          available: true,
          bookings: {
            none: {
              AND: [
                {
                  checkOut: {
                    gt: new Date(checkIn)
                  }
                },
                {
                  checkIn: {
                    lt: new Date(checkOut)
                  }
                }
              ]
            }
          }
        }
      });

      console.log('Room availability check:', isRoomAvailable ? 'Available' : 'Not available');

      if (!isRoomAvailable) {
        res.status(400).json({
          success: false,
          message: 'Room is not available for the selected dates'
        });
        return;
      }

      const booking = await prisma.hotelBooking.create({
        data: {
          userId,
          roomId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('Booking created:', booking);

      res.json({
        success: true,
        data: booking,
        message: "Room booked successfully"
      });
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Error booking room',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// Initialize controllers
const authController = new AuthController();
const hotelController = new HotelController();

const app = express();
const router = express.Router();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// Routes
router.post('/auth/signup', authController.signup);
router.post('/auth/signin', authController.signin);

router.get('/hotels/search', hotelController.searchWithCriteria);
router.post('/hotels/search', hotelController.searchWithCriteria);
router.post('/hotels/book', hotelController.bookRoom);


router.get('/flights/search', (req, res) => flightController.listFlights(req, res));
router.get('/flights/:flightId', (req, res) => flightController.getFlightDetails(req, res));
router.post('/flights/reserve', (req, res) => flightController.reserveFlight(req, res));
router.post('/flights/reservations/:reservationId/cancel', (req, res) => flightController.cancelReservation(req, res));

// Health check endpoints
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/db-health', async (_req: Request, res: Response) => {
  try {
    const roomCount = await prisma.hotelRoom.count();
    res.json({ 
      status: 'ok', 
      roomCount,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Database connection error' 
    });
  }
});

// Mount all routes under /api
app.use('/api', router);

// 404 handler
app.use((req: Request, res: Response) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({ 
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Cleanup
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Available routes:');
  console.log('- POST /api/auth/signup');
  console.log('- POST /api/auth/signin');
  console.log('- GET  /api/hotels/search');
  console.log('- POST /api/hotels/search');
  console.log('- POST /api/hotels/book');
  console.log('- GET  /api/flights/search');          // New
  console.log('- GET  /api/flights/:flightId');       // New
  console.log('- POST /api/flights/reserve'); 
  console.log('- POST /api/flights/reservations/:reservationId/cancel'); // New
  console.log('- GET  /api/health');
  console.log('- GET  /api/db-health');
});

export default app;