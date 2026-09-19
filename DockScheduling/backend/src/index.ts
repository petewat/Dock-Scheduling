import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { bookingRoutes } from './routes/bookingRoutes';

// Load environment variables from .env file if present
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow frontend to communicate with API
app.use(express.json()); // Parse incoming JSON requests

// Database Connection
// In a real environment, this uses process.env.DATABASE_URL
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dockscheduling'
});

// Test DB Connection on startup
dbPool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL database'))
    .catch(err => console.error('❌ Database connection error:', err.stack));

// Register Routes
app.use('/api/bookings', bookingRoutes(dbPool));

// Healthcheck endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'Dock Scheduling API' });
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Dock Scheduling API running on http://localhost:${port}`);
});
