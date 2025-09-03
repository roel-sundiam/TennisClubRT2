const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Kill any existing process on port 3000 first
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

// CORS - Allow all localhost ports
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
}));

// Parse JSON
app.use(express.json());

console.log('🚀 Starting working backend server...');

// Health endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Working server is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', api: 'v1', message: 'Working server is running!' });
});

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('✅ Login request received:', req.body);
  res.json({
    success: true,
    data: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token',
      user: {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        coinBalance: 100,
        role: 'member',
        isApproved: true,
        membershipFeesPaid: true
      }
    },
    message: 'Login successful'
  });
});

// Mock other endpoints
app.get('/api/payments/my', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/coins/balance', (req, res) => {
  res.json({ 
    success: true, 
    data: { balance: 100, lastUpdated: new Date().toISOString() }
  });
});

app.get('/api/reservations/my-upcoming', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/reservations', (req, res) => {
  console.log('✅ All reservations request received');
  console.log('Query params:', req.query);
  
  // Mock reservation data
  const mockReservations = [
    {
      _id: '1',
      date: new Date().toISOString(),
      timeSlot: 18,
      timeSlotDisplay: '18:00 - 19:00',
      players: ['Test Player 1', 'Test Player 2'],
      status: 'confirmed',
      paymentStatus: 'paid',
      totalFee: 100,
      feePerPlayer: 50,
      userId: {
        _id: '1',
        username: 'testuser',
        fullName: 'Test User'
      },
      weatherForecast: {
        temperature: 25,
        description: 'Clear sky',
        icon: '01d'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json({ 
    success: true, 
    data: mockReservations
  });
});

// Catch all for debugging
app.use('*', (req, res) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Endpoint not implemented yet',
    method: req.method,
    url: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Working Backend Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`🔗 Test: http://localhost:${PORT}/health`);
  console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log('✅ Ready for frontend connections!');
});