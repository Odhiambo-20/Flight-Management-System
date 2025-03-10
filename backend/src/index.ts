import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { flightController } from './controllers/flightController';
import paymentController from './controllers/paymentController';
import bookingController from './controllers/bookingController';
import cors from 'cors';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import WebSocket from 'ws';

// Extend Express Request type to include rawBody
interface ExtendedRequest extends Request {
  rawBody?: string;
}

config();

// Initialize Prisma and PostgreSQL pool
const prisma = new PrismaClient();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Start Python chatbot backend
const pythonScriptPath = path.join(
  __dirname,
  '../../frontend/public/Chatbot/backend.py'
);

console.log(`Starting Python process from: ${pythonScriptPath}`);

const pythonProcess = spawn('python', [pythonScriptPath]);

pythonProcess.stdout.on('data', (data) => {
  console.log(`Python stdout: ${data}`);
});

pythonProcess.stderr.on('data', (data) => {
  console.error(`Python stderr: ${data}`);
});

pythonProcess.on('close', (code) => {
  console.log(`Python process exited with code ${code}`);
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

// Helper function to validate date string format
const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$|^\d{4}\/\d{2}\/\d{2}$/; // Match YYYY-MM-DD or YYYY/MM/DD
  if (!regex.test(dateString)) return false;
  
  // Parse the date
  const date = new Date(dateString);
  
  // Check if the date is valid
  return !isNaN(date.getTime());
};

// Auth middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    req.body.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

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
        phoneNumber,
        dateOfBirth,
        nationality
      } = req.body;
  
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
      const hotels = await prisma.hotelRoom.findMany({
        include: {
          hotel: true,
          bookings: true,
        },
        where: {
          available: true,
        },
      });

      res.json({
        success: true,
        data: hotels,
        message: 'Hotels retrieved successfully',
      });
    } catch (error) {
      console.error('Basic search error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching hotels',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  public searchWithCriteria: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Search criteria received:', req.query);
      
      const { checkIn, checkOut, adults, children, maxPrice, roomType } = req.query as HotelSearchCriteria;
  
      // Validate date parameters
      if (checkIn && !isValidDate(checkIn)) {
        res.status(400).json({
          success: false,
          message: 'Invalid check-in date format',
        });
        return;
      }
  
      if (checkOut && !isValidDate(checkOut)) {
        res.status(400).json({
          success: false,
          message: 'Invalid check-out date format',
        });
        return;
      }
  
      const where: any = {
        available: true,
      };

      if (maxPrice) {
        where.price = {
          lte: parseFloat(maxPrice.toString()),
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
                  gt: new Date(checkIn),
                },
              },
              {
                checkIn: {
                  lt: new Date(checkOut),
                },
              },
            ],
          },
        };
      }

      const availableRooms = await prisma.hotelRoom.findMany({
        where,
        include: {
          hotel: true,
          bookings: {
            where: {
              AND: [
                {
                  checkOut: {
                    gt: checkIn ? new Date(checkIn) : undefined,
                  },
                },
                {
                  checkIn: {
                    lt: checkOut ? new Date(checkOut) : undefined,
                  },
                },
              ],
            },
          },
        },
        orderBy: {
          price: 'asc',
        },
      });

      res.json({
        success: true,
        data: availableRooms,
        message: 'Available rooms retrieved successfully',
        searchCriteria: {
          checkIn,
          checkOut,
          adults,
          children,
          maxPrice,
          roomType,
        },
      });
    } catch (error) {
      console.error('Search with criteria error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching hotels',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
  };

  public bookRoom: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, roomId, checkIn, checkOut } = req.body;

      const checkInDate = new Date(checkIn).toISOString().split('T')[0];
      const checkOutDate = new Date(checkOut).toISOString().split('T')[0];

      const isRoomAvailable = await prisma.hotelRoom.findFirst({
        where: {
          id: parseInt(roomId),
          available: true,
          bookings: {
            none: {
              OR: [
                {
                  checkIn: {
                    lt: new Date(checkOutDate),
                  },
                  checkOut: {
                    gt: new Date(checkInDate),
                  },
                },
              ],
            },
          },
        },
      });

      if (!isRoomAvailable) {
        res.status(400).json({
          success: false,
          message: 'Room is not available for the selected dates',
        });
        return;
      }

      const booking = await prisma.hotelBooking.create({
        data: {
          userId,
          roomId,
          checkIn: new Date(checkInDate),
          checkOut: new Date(checkOutDate),
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: booking,
        message: 'Room booked successfully',
      });
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Error booking room',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  public checkRoomAvailability: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const { checkIn, checkOut } = req.query;

      if (!checkIn || !checkOut || typeof checkIn !== 'string' || typeof checkOut !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required',
        });
        return;
      }

      const checkInDate = new Date(checkIn).toISOString().split('T')[0];
      const checkOutDate = new Date(checkOut).toISOString().split('T')[0];

      const isRoomAvailable = await prisma.hotelRoom.findFirst({
        where: {
          id: parseInt(roomId),
          available: true,
          bookings: {
            none: {
              OR: [
                {
                  checkIn: {
                    lt: new Date(checkOutDate),
                  },
                  checkOut: {
                    gt: new Date(checkInDate),
                  },
                },
              ],
            },
          },
        },
      });

      res.json({
        success: true,
        available: !!isRoomAvailable,
        message: isRoomAvailable
          ? 'Room is available for the selected dates'
          : 'Room is not available for the selected dates',
      });
    } catch (error) {
      console.error('Room availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking room availability',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

// SMS Controller
class SmsController {
  private username: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.username = process.env.AT_USERNAME || '';
    this.apiKey = process.env.AT_API_KEY || '';
    this.baseUrl = 'https://api.africastalking.com/version1';
  }

  public sendSms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipients, message } = req.body;

      if (!recipients || !message) {
        res.status(400).json({
          success: false,
          message: 'Recipients and message are required'
        });
        return;
      }

      const formattedRecipients = Array.isArray(recipients) 
        ? recipients.join(',') 
        : recipients;

      const data = {
        username: this.username,
        to: formattedRecipients,
        message
      };

      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/messaging`,
        new URLSearchParams(data).toString(),
        config
      );

      res.json({
        success: true,
        data: response.data,
        message: 'SMS sent successfully'
      });
    } catch (error) {
      console.error('SMS sending error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending SMS',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public getSmsStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        res.status(400).json({
          success: false,
          message: 'Message ID is required'
        });
        return;
      }

      const config = {
        headers: {
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        },
        params: {
          username: this.username,
          messageId
        }
      };

      const response = await axios.get(
        `${this.baseUrl}/messaging`,
        config
      );

      res.json({
        success: true,
        data: response.data,
        message: 'SMS status retrieved successfully'
      });
    } catch (error) {
      console.error('Get SMS status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting SMS status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public handleDeliveryReport = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Delivery report received:', req.body);
      res.json({
        success: true,
        message: 'Delivery report processed successfully'
      });
    } catch (error) {
      console.error('Process delivery report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing delivery report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// Flight Assistant WebSocket Controller
class FlightAssistantController {
  private wss: WebSocket.Server;

  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      
      // Send welcome message
      this.sendResponse(ws, {
        response: 'Connected to flight assistant',
        flight_data: null
      });

      ws.on('message', (message: WebSocket.Data) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server initialized');
  }

  private async handleMessage(ws: WebSocket, data: WebSocket.Data): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      // Process the message
      const userQuery = message.message.toLowerCase();
      let response = '';
      let flightData = null;

      // Simple flight query handler
      if (userQuery.includes('flight status')) {
        response = 'All of our flights are currently on time.';
        flightData = {
          allFlightsOnTime: true,
          lastUpdated: new Date().toISOString()
        };
      } else if (userQuery.includes('book') && userQuery.includes('flight')) {
        response = 'To book a flight, please use our booking form on the main page or tell me your departure city, destination, and preferred date.';
      } else if (userQuery.includes('cancel') && userQuery.includes('reservation')) {
        response = 'To cancel a reservation, please provide your booking reference number.';
      } else if (userQuery.includes('luggage') || userQuery.includes('baggage')) {
        response = 'Our standard baggage allowance is 23kg for checked luggage and 7kg for carry-on.';
        flightData = {
          baggagePolicy: {
            checkedAllowance: '23kg',
            carryOnAllowance: '7kg',
            extraFees: 'Apply for excess baggage'
          }
        };
      } else {
        // Fetch available flights from the database for demonstration
        try {
          const flights = await prisma.flight.findMany({
            take: 5,
            orderBy: {
              departureTime: 'asc'
            }
          });
          
          if (flights && flights.length > 0) {
            response = 'Here are some of our upcoming flights:';
            flightData = { availableFlights: flights };
          } else {
            response = "I'm your flight assistant. How can I help you today?";
          }
        } catch (error) {
          console.error('Error fetching flights:', error);
          response = "I'm your flight assistant. How can I help you with booking, flight status, or travel information?";
        }
      }

      // Send response
      this.sendResponse(ws, {
        response,
        flight_data: flightData
      });
    } catch (error) {
      console.error('Error processing message:', error);
      this.sendResponse(ws, {
        response: 'Sorry, I encountered an error processing your request.',
        flight_data: null
      });
    }
  }

  private sendResponse(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

// Initialize controllers
const authController = new AuthController();
const hotelController = new HotelController();
const smsController = new SmsController();

const app = express();
const server = http.createServer(app);
const router = express.Router();
const port = process.env.PORT || 5000;

// Initialize WebSocket controller
const flightAssistantController = new FlightAssistantController(server);

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ 
  verify: (req: ExtendedRequest, res: Response, buf: Buffer) => {
    const url = req.url;
    if (url.startsWith('/api/payments/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.options('*', cors(corsOptions));

// Routes
router.post('/auth/signup', authController.signup);
router.post('/auth/signin', authController.signin);

router.get('/hotels/search', hotelController.searchWithCriteria);
router.post('/hotels/search', hotelController.searchWithCriteria);
router.post('/hotels/book', hotelController.bookRoom);
router.get('/hotels/rooms/:roomId/availability', hotelController.checkRoomAvailability);

router.get('/bookings/active', authenticateToken, (req, res) => bookingController.getActiveBookings(req, res));
router.post('/bookings/create', authenticateToken, (req, res) => bookingController.createBooking(req, res));
router.delete('/bookings/:bookingId', authenticateToken, (req, res) => bookingController.cancelBooking(req, res));
router.get('/bookings/:bookingId', authenticateToken, (req, res) => bookingController.getBookingDetails(req, res));

// Flight routes
router.get('/flights', flightController.listFlights.bind(flightController));
router.get('/flights/search', flightController.listFlights.bind(flightController)); // Add explicit search endpoint
router.get('/flights/active', flightController.getActiveFlights.bind(flightController));
router.get('/flights/routes', flightController.getFlightRoutes.bind(flightController));
router.get('/flights/:flightId', flightController.getFlightDetails.bind(flightController));
router.post('/flights/reserve', flightController.reserveFlight.bind(flightController));
router.post('/reservations/:reservationId/cancel', flightController.cancelReservation.bind(flightController));
router.get('/analytics/booking-trends', flightController.getBookingTrends.bind(flightController));

router.post('/payments/process', authenticateToken, (req, res) => paymentController.processPayment(req, res));
router.get('/payments/:transactionId/status', authenticateToken, (req, res) => 
  paymentController.getPaymentStatus(req, res)
);
router.post('/payments/webhook/:provider', (req, res) => paymentController.handleWebhook(req, res));
router.post('/payments/mpesa/stkpush', paymentController.StkPush);
router.post('/payments/mpesa/callback', paymentController.callback);

router.post('/notifications/sms/send', authenticateToken, (req, res) => smsController.sendSms(req, res));
router.get('/notifications/sms/:messageId/status', authenticateToken, (req, res) => smsController.getSmsStatus(req, res));
router.post('/notifications/sms/delivery-report', (req, res) => smsController.handleDeliveryReport(req, res));

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
    res.status(500).json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Database connection error' 
    });
  }
});

app.use('/api', router);

// 404 handler
app.use((req: Request, res: Response) => {
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
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

// Use http.Server instead of app.listen
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Available endpoints:');
  console.log('- WebSocket: ws://localhost:5000/ws');
  console.log('- POST /api/auth/signup');
  console.log('- POST /api/auth/signin');
  console.log('- GET  /api/hotels/search');
  console.log('- POST /api/hotels/search');
  console.log('- POST /api/hotels/book');
  console.log('- GET  /api/hotels/rooms/:roomId/availability');
  console.log('- GET  /api/flights/search');
  console.log('- GET  /api/flights/:flightId');
  console.log('- POST /api/flights/reserve');
  console.log('- POST /api/flights/reservations/:reservationId/cancel');
  console.log('- POST /api/payments/process');
  console.log('- GET  /api/payments/:transactionId/status');
  console.log('- POST /api/payments/webhook/:provider');
  console.log('- POST /api/payments/mpesa/stkpush');
  console.log('- POST /api/payments/mpesa/callback');
  console.log('- POST /api/notifications/sms/send');
  console.log('- GET  /api/notifications/sms/:messageId/status');
  console.log('- POST /api/notifications/sms/delivery-report');
  console.log('- GET  /api/health');
  console.log('- GET  /api/db-health');
});

export default server;