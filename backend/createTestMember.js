const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestMember() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tennis-club-rt2');
    
    const UserSchema = new mongoose.Schema({
      username: String,
      fullName: String,
      email: String,
      password: String,
      gender: String,
      role: { type: String, default: 'member' },
      isApproved: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      coinBalance: { type: Number, default: 100 },
      membershipFeesPaid: { type: Boolean, default: false },
      registrationDate: { type: Date, default: Date.now },
      lastLogin: Date,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const User = mongoose.model('User', UserSchema);
    
    // Create test member with proper username format
    const hashedPassword = await bcrypt.hash('RT2Tennis', 10);
    
    const testMember = new User({
      username: 'RoelSundiam',  // FirstnameLastname format
      fullName: 'Roel Sundiam',
      email: 'roel.sundiam@example.com',
      password: hashedPassword,
      gender: 'male',
      role: 'member',
      isApproved: true,  // Pre-approved for testing
      isActive: true,
      coinBalance: 100,
      membershipFeesPaid: true
    });
    
    await testMember.save();
    console.log('✅ Test member created successfully!');
    console.log('Username: RoelSundiam');
    console.log('Password: RT2Tennis');
    console.log('Full Name: Roel Sundiam');
    console.log('Status: Approved and Active');
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Test member already exists');
      console.log('Username: RoelSundiam');
      console.log('Password: RT2Tennis');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await mongoose.connection.close();
  }
}

createTestMember();