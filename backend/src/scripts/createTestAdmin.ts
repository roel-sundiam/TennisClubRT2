import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { connectDatabase } from '../config/database';

async function createTestAdmin() {
  try {
    await connectDatabase();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Test admin already exists');
      console.log('Username: admin');
      console.log('Password: admin123');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    const admin = new User({
      username: 'admin',
      fullName: 'Test Admin',
      email: 'admin@tennisrt2.com',
      password: hashedPassword,
      gender: 'male',
      role: 'admin',
      isApproved: true,
      isActive: true,
      coinBalance: 500,
      membershipFeesPaid: true,
      registrationDate: new Date()
    });
    
    await admin.save();
    
    console.log('✅ Test admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createTestAdmin();