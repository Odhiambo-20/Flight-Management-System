"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const flightController_1 = require("../controllers/flightController");
const reservationController_1 = __importDefault(require("../controllers/reservationController"));
const hotelController_1 = __importDefault(require("../controllers/hotelController"));
const paymentController_1 = __importDefault(require("../controllers/paymentController"));
const authController_1 = __importDefault(require("../controllers/authController"));
// Type assertions for controllers with specific interfaces using double assertion
const typedFlightController = flightController_1.flightController;
const typedReservationController = reservationController_1.default;
const typedHotelController = hotelController_1.default;
const typedPaymentController = paymentController_1.default;
const typedAuthController = authController_1.default;
// Helper function to wrap async controllers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
const router = express_1.default.Router();
// Flight routes
router.get('/flights', asyncHandler(typedFlightController.listFlights.bind(typedFlightController)));
router.get('/flights/:flightId', auth_1.authenticateUser, asyncHandler(typedFlightController.getFlightDetails.bind(typedFlightController)));
router.post('/flights/:flightId/reserve', auth_1.authenticateUser, asyncHandler(typedReservationController.createReservation.bind(typedReservationController)));
// Reservation routes
router.get('/reservations', auth_1.authenticateUser, asyncHandler(typedReservationController.listReservations.bind(typedReservationController)));
router.get('/users/:userId/reservations', auth_1.authenticateUser, asyncHandler(typedReservationController.getUserReservations.bind(typedReservationController)));
// Hotel routes
router.get('/hotels/rooms', asyncHandler(typedHotelController.listRooms.bind(typedHotelController)));
router.post('/hotels/rooms/:roomId/book', auth_1.authenticateUser, asyncHandler(typedHotelController.bookRoom.bind(typedHotelController)));
// Payment routes
router.post('/payments', auth_1.authenticateUser, asyncHandler(typedPaymentController.processPayment.bind(typedPaymentController)));
// Auth routes
router.post('/auth/signup', asyncHandler(typedAuthController.signup.bind(typedAuthController)));
router.post('/auth/signin', asyncHandler(typedAuthController.signin.bind(typedAuthController)));
exports.default = router;
