import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new SocketServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting on all routes
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: { error: 'Too many requests, please try again later.' },
    })
);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import authRouter from './routes/auth.routes';
import dashboardRouter from './routes/dashboard.routes';

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
// app.use('/api/vehicles', vehiclesRouter);
// app.use('/api/drivers', driversRouter);
// app.use('/api/trips', tripsRouter);
// app.use('/api/fuel', fuelRouter);
// app.use('/api/maintenance', maintenanceRouter);
// app.use('/api/expenses', expensesRouter);
// app.use('/api/rules', rulesRouter);
// app.use('/api/alerts', alertsRouter);
// app.use('/api/analytics', analyticsRouter);
// app.use('/api/dashboard', dashboardRouter);


// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Export io for use in other modules
export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚛 FleetFlow backend running on http://localhost:${PORT}`);
});

export default app;
