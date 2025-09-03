#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Simple User schema for querying (just the parts we need)
const userSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  email: String,
  coinBalance: Number,
  role: String,
  isApproved: Boolean,
  isActive: Boolean,
  registrationDate: Date,
  lastLogin: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function checkCoinBalance() {
  try {
    // Connect to MongoDB using the same connection string from backend
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not defined');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ Connected to MongoDB successfully\n');

    // Query for user "RoelSundiam"
    console.log('🔍 Searching for user "RoelSundiam"...');
    
    const user = await User.findOne({ username: 'RoelSundiam' });
    
    if (!user) {
      console.log('❌ User "RoelSundiam" not found in the database');
    } else {
      console.log('✅ User found!\n');
      console.log('📋 User Information:');
      console.log('-------------------');
      console.log(`👤 Username: ${user.username}`);
      console.log(`👨 Full Name: ${user.fullName}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🪙 Coin Balance: ${user.coinBalance}`);
      console.log(`👑 Role: ${user.role}`);
      console.log(`✅ Approved: ${user.isApproved ? 'Yes' : 'No'}`);
      console.log(`🟢 Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`📅 Registration Date: ${user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A'}`);
      console.log(`🕐 Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}`);
      console.log(`📊 Created At: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`🔄 Updated At: ${user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    console.log('\n📤 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
checkCoinBalance();