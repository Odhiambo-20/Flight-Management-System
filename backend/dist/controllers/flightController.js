"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flightController = exports.FlightController = void 0;
const flightService_1 = require("../services/flightService");
class FlightController {
    constructor(flightService) {
        this.flightService = flightService;
    }
    async listFlights(req, res) {
        try {
            const { date, direction } = req.query;
            const flights = await this.flightService.listFlights({
                date: date,
                direction: direction
            });
            res.json(flights);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch flights' });
        }
    }
    async getFlightDetails(req, res) {
        try {
            const { flightId } = req.params;
            const flight = await this.flightService.getFlightDetails(flightId);
            if (!flight) {
                return res.status(404).json({ error: 'Flight not found' });
            }
            res.json(flight);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch flight details' });
        }
    }
}
exports.FlightController = FlightController;
// Create an instance of FlightController with the required FlightService
const flightService = new flightService_1.FlightService();
exports.flightController = new FlightController(flightService);
