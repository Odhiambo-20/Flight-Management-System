import express, { Request, Response, NextFunction } from 'express';
import { authenticateUser } from '../middlewares/auth';
import { flightController, FlightController } from '../controllers/flightController';
import reservationController from '../controllers/reservationController';
import hotelController from '../controllers/hotelController';
import paymentController from '../controllers/paymentController';
import authController from '../controllers/authController';

// Define interface for common request parameters with index signatures
interface FlightParams {
  flightId?: string;
  [key: string]: string | undefined;
}

interface UserParams {
  userId?: string;
  [key: string]: string | undefined;
}

interface RoomParams {
  roomId?: string;
  [key: string]: string | undefined;
}

// Define specific controller interfaces
interface FlightControllerType {
  listFlights: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  getFlightDetails: (
    req: Request<FlightParams>,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

interface ReservationControllerType {
  createReservation: (
    req: Request<FlightParams>,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  listReservations: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  getUserReservations: (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

interface HotelControllerType {
  listRooms: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  bookRoom: (
    req: Request<RoomParams>,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

interface PaymentControllerType {
  processPayment: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

interface AuthControllerType {
  signup: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  signin: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

// Type assertions for controllers with specific interfaces using double assertion
const typedFlightController = flightController as unknown as FlightControllerType;
const typedReservationController = reservationController as unknown as ReservationControllerType;
const typedHotelController = hotelController as unknown as HotelControllerType;
const typedPaymentController = paymentController as unknown as PaymentControllerType;
const typedAuthController = authController as unknown as AuthControllerType;

// Helper function to wrap async controllers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const router = express.Router();

// Flight routes
router.get('/flights', 
  asyncHandler(typedFlightController.listFlights.bind(typedFlightController))
);
router.get('/flights/:flightId', 
  authenticateUser,
  asyncHandler(typedFlightController.getFlightDetails.bind(typedFlightController))
);
router.post('/flights/:flightId/reserve', 
  authenticateUser,
  asyncHandler(typedReservationController.createReservation.bind(typedReservationController))
);

// Reservation routes
router.get('/reservations', 
  authenticateUser,
  asyncHandler(typedReservationController.listReservations.bind(typedReservationController))
);
router.get('/users/:userId/reservations', 
  authenticateUser,
  asyncHandler(typedReservationController.getUserReservations.bind(typedReservationController))
);

// Hotel routes
router.get('/hotels/rooms', 
  asyncHandler(typedHotelController.listRooms.bind(typedHotelController))
);
router.post('/hotels/rooms/:roomId/book', 
  authenticateUser,
  asyncHandler(typedHotelController.bookRoom.bind(typedHotelController))
);

// Payment routes
router.post('/payments', 
  authenticateUser,
  asyncHandler(typedPaymentController.processPayment.bind(typedPaymentController))
);

// Auth routes
router.post('/auth/signup', 
  asyncHandler(typedAuthController.signup.bind(typedAuthController))
);
router.post('/auth/signin', 
  asyncHandler(typedAuthController.signin.bind(typedAuthController))
);

export default router;