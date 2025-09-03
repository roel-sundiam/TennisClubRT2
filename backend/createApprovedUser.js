const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple script to create an approved user
async function createApprovedUser() {
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
    
    // Check if user exists
    const existing = await User.findOne({ username: 'testmember' });
    if (existing) {
      console.log('✅ Test member already exists');
      console.log('Username: testmember');
      console.log('Password: pass123');
      return;
    }
    
    const hashedPassword = await bcrypt.hash('pass123', 10);
    
    const testUser = new User({
      username: 'testmember',
      fullName: 'Test Member',
      email: 'test@member.com',
      password: hashedPassword,
      gender: 'male',
      role: 'member',
      isApproved: true,
      isActive: true,
      coinBalance: 100,
      membershipFeesPaid: true
    });
    
    await testUser.save();
    console.log('✅ Approved test user created!');
    console.log('Username: testmember');
    console.log('Password: pass123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createApprovedUser();