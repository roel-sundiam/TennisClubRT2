import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ 
      $or: [
        { username: 'superadmin' },
        { role: 'superadmin' }
      ]
    });

    if (existingSuperAdmin) {
      console.log('⚠️ Superadmin already exists:', existingSuperAdmin.username);
      return;
    }

    // Create superadmin user
    const superAdmin = new User({
      username: 'superadmin',
      fullName: 'Super Administrator',
      email: 'admin@tennisclub.com',
      password: 'admin123',
      gender: 'other',
      role: 'superadmin',
      isApproved: true,
      isActive: true,
      membershipFeesPaid: true,
      coinBalance: 1000000 // Give plenty of coins
    });

    await superAdmin.save();
    console.log('✅ Superadmin account created successfully');
    console.log('Username: superadmin');
    console.log('Password: admin123');
    console.log('⚠️ Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
};

createSuperAdmin();