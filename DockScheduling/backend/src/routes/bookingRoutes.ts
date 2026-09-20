import { Router } from 'express';
import { Pool } from 'pg';
import { BookingService } from '../services/bookingService';

export const bookingRoutes = (db: Pool) => {
    const router = Router();
    const bookingService = new BookingService(db);

    /**
     * GET /api/bookings
     * Retrieve all bookings, optionally filtered by date range.
     */
    router.get('/', async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const bookings = await bookingService.getBookings(
                startDate as string, 
                endDate as string
            );
            return res.json(bookings);
        } catch (error: any) {
            console.error("Error fetching bookings:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });

    /**
     * POST /api/bookings/auto-assign
     * Auto-assigns the smallest available berth for a given vessel.
     */
    router.post('/auto-assign', async (req, res) => {
        try {
            const { 
                vesselName, vesselLength, startDate, endDate, overrideWarning, targetBerthId,
                companyName, contactName, workNumber, cellNumber, email, extraNote 
            } = req.body;
            
            // Basic validation
            if (!vesselName || (!vesselLength && vesselLength !== 0) || !startDate || !endDate) {
                return res.status(400).json({ error: "Missing required fields: vesselName, vesselLength, startDate, endDate" });
            }

            const result = await bookingService.autoAssignBerth(
                vesselName, 
                parseInt(vesselLength) || 0, 
                startDate, 
                endDate, 
                overrideWarning === true,
                15, // buffer
                targetBerthId,
                { companyName, contactName, workNumber, cellNumber, email, extraNote }
            );

            // If the service caught an overlapping name and needs user confirmation
            if (result.status === 'warning') {
                return res.status(409).json(result); // 409 Conflict is perfect for this state
            }

            // Success
            return res.status(201).json(result);

        } catch (error: any) {
            console.error("Booking error:", error);
            
            // Handle specific errors like no berths available
            if (error.message.includes("No available berth fits")) {
                return res.status(404).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error", details: error.message });
        }
    });

    return router;
};
