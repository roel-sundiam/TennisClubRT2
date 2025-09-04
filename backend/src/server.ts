import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authenticateToken } from './middleware/auth';
import { webSocketService } from './services/websocketService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courtRoutes from './routes/courts';
import reservationRoutes from './routes/reservations';
import paymentRoutes from './routes/paymentRoutes';
import weatherRoutes from './routes/weatherRoutes';
import pollRoutes from './routes/pollRoutes';
import suggestionRoutes from './routes/suggestions';
import analyticsRoutes from './routes/analytics';
import coinRoutes from './routes/coinRoutes';
import creditRoutes from './routes/creditRoutes';
import memberRoutes from './routes/memberRoutes';
import reportRoutes, { specialRouter } from './routes/reportRoutes';
import seedingRoutes from './routes/seedingRoutes';
import matchRoutes from './routes/matchRoutes';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO integration
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  console.log('📊 Rate limiting enabled for production');
} else {
  console.log('📊 Rate limiting disabled for development');
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201', 
  'http://localhost:3000'
];

// Add production frontend URL if available
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Request logging
app.use(requestLogger);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    api: 'v1'
  });
});

// API routes
console.log('📥 Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/courts', authenticateToken, courtRoutes);
app.use('/api/reservations', authenticateToken, reservationRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/weather', authenticateToken, weatherRoutes);
console.log('📥 Registering poll routes...', typeof pollRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/suggestions', authenticateToken, suggestionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coins', authenticateToken, coinRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/reports', reportRoutes); // Temporarily removing auth for testing fix endpoint
app.use('/api/reports', specialRouter); // Special router without auth for fix endpoint
app.use('/api/seeding', authenticateToken, seedingRoutes);
app.use('/api/matches', authenticateToken, matchRoutes);
app.use('/api/notifications', notificationRoutes);
console.log('📥 All routes registered');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDatabase();
    console.log('✅ MongoDB connected successfully');
    
    // Initialize WebSocket service
    webSocketService.initialize(httpServer);
    console.log('🔌 WebSocket service initialized');
    
    // Start Google Sheets sync service
    // TEMPORARILY DISABLED - to allow recorded payments to persist
    // const { syncService } = await import('./services/syncService');
    // syncService.startSync();
    console.log('⚠️  Google Sheets sync DISABLED for testing recorded payments integration');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Tennis Club RT2 Backend running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server ready for real-time updates`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    
    // Start server anyway without MongoDB for emergency access
    console.log('⚠️ Starting server without database for emergency access...');
    
    // Initialize WebSocket service even without database
    webSocketService.initialize(httpServer);
    console.log('🔌 WebSocket service initialized (emergency mode)');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Tennis Club RT2 Backend running on port ${PORT} (NO DATABASE)`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('⚠️ Database unavailable - some features may not work');
      console.log(`🔌 WebSocket server ready for real-time updates`);
    });
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();

export default app;// trigger restart
