const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔌 Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:@]+@/, ':***@') : 'NOT SET');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
  process.exit(1);
});