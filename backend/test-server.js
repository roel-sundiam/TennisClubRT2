const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    api: 'v1'
  });
});

// Mock endpoints for testing
app.get('/api/reservations/my-upcoming', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Mock login request:', req.body);
  res.json({
    success: true,
    data: {
      token: 'mock-jwt-token',
      user: {
        _id: '1',
        username: 'testuser',
        fullName: 'Test User',
        coinBalance: 100,
        role: 'member'
      }
    },
    message: 'Login successful (mock)'
  });
});

app.get('/api/payments/my', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/coins/balance', (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 100,
      lastUpdated: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});