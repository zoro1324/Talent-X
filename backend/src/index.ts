import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB, syncDB, closeDB } from './config/database';
import { emailRoutes, authRoutes, athleteRoutes, testResultRoutes } from './routes';
import { apiLimiter } from './middleware';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection and sync
const initializeDatabase = async () => {
  try {
    await connectDB();
    await syncDB();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

initializeDatabase();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiter
app.use(apiLimiter);

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/tests', testResultRoutes);
app.use('/api', emailRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Talent-X Backend',
    version: '1.0.0',
    status: 'running',
    database: 'MySQL',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verifyOTP: 'POST /api/auth/verify-otp',
        resendOTP: 'POST /api/auth/resend-otp',
        me: 'GET /api/auth/me',
        changePassword: 'PUT /api/auth/change-password',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
      },
      athletes: {
        create: 'POST /api/athletes',
        list: 'GET /api/athletes',
        get: 'GET /api/athletes/:id',
        update: 'PUT /api/athletes/:id',
        delete: 'DELETE /api/athletes/:id',
        restore: 'PATCH /api/athletes/:id/restore',
        stats: 'GET /api/athletes/:id/stats',
      },
      tests: {
        create: 'POST /api/tests',
        list: 'GET /api/tests',
        get: 'GET /api/tests/:id',
        delete: 'DELETE /api/tests/:id',
        history: 'GET /api/tests/athlete/:athleteId/history',
        leaderboard: 'GET /api/tests/leaderboard/:testType',
        stats: 'GET /api/tests/stats/summary',
      },
      email: {
        sendOTP: 'POST /api/send-otp',
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await closeDB();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     Talent-X Backend Server Started       ║
╠═══════════════════════════════════════════╣
║  Port: ${String(PORT).padEnd(34)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║
║  Database: MySQL + Sequelize              ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
