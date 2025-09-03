import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Reservation from '../models/Reservation';
import Payment from '../models/Payment';

dotenv.config();

const createOverduePayment = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📥 Connected to MongoDB');

    // Find RoelSundiam user
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      throw new Error('RoelSundiam user not found. Please ensure user exists.');
    }
    
    console.log('👤 Found user:', user.username, '- ID:', user._id);

    // Create a test reservation for August 20 (3 days ago) 
    const reservationDate = new Date('2025-08-20');
    reservationDate.setHours(18, 0, 0, 0); // 6 PM (peak hour)

    // Check if test reservation already exists
    const existingReservation = await Reservation.findOne({
      userId: user._id,
      date: reservationDate,
      timeSlot: 18
    });

    let reservation;
    if (existingReservation) {
      console.log('📅 Using existing test reservation:', existingReservation._id);
      reservation = existingReservation;
    } else {
      reservation = new Reservation({
        userId: user._id,
        date: reservationDate,
        timeSlot: 18, // 6 PM (peak hour = ₱100)
        players: ['Roel Sundiam', 'Test Player'],
        status: 'confirmed',
        paymentStatus: 'pending'
      });

      await reservation.save({ validateBeforeSave: false });
      console.log('📅 Created test reservation:', reservation._id);
    }

    // Check if overdue payment already exists
    const existingPayment = await Payment.findOne({
      reservationId: reservation._id,
      userId: user._id
    });

    if (existingPayment) {
      console.log('💰 Overdue payment already exists:', existingPayment._id);
      console.log('💰 Payment status:', existingPayment.status);
      console.log('💰 Due date:', existingPayment.dueDate);
      const isOverdue = new Date() > existingPayment.dueDate && existingPayment.status !== 'completed';
      const diffTime = existingPayment.dueDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('💰 Is overdue:', isOverdue);
      console.log('💰 Days until due:', diffDays);
    } else {
      // Create overdue payment (due 3 days ago)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 3);
      dueDate.setHours(23, 59, 59, 999);

      const payment = new Payment({
        reservationId: reservation._id,
        userId: user._id,
        amount: 100, // Peak hour fee
        paymentMethod: 'cash',
        status: 'pending', // This makes it overdue since due date is past
        dueDate: dueDate,
        description: `Court reservation payment for ${reservationDate.toDateString()} 18:00-19:00 (TEST OVERDUE)`,
        metadata: {
          timeSlot: 18,
          date: reservationDate,
          playerCount: 2,
          isPeakHour: true,
          originalFee: 100,
          discounts: [] // Initialize empty discounts array to prevent length error
        }
      });

      await payment.save();
      console.log('💰 Created overdue payment:', payment._id);
      console.log('💰 Payment amount:', `₱${payment.amount.toFixed(2)}`);
      console.log('💰 Due date:', payment.dueDate);
      const isOverdue = new Date() > payment.dueDate && payment.status !== 'completed';
      const diffTime = payment.dueDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('💰 Is overdue:', isOverdue);
      console.log('💰 Days until due:', diffDays);
    }

    // Test the getOverduePayments static method
    console.log('\n🔍 Testing overdue payments query...');
    const overduePayments = await (Payment as any).getOverduePayments();
    const userOverduePayments = overduePayments.filter((p: any) => 
      p.userId && p.userId._id && p.userId._id.toString() === user._id.toString()
    );
    
    console.log('📊 Total overdue payments in system:', overduePayments.length);
    console.log('📊 RoelSundiam overdue payments:', userOverduePayments.length);
    
    if (userOverduePayments.length > 0) {
      userOverduePayments.forEach((payment: any, index: number) => {
        const formattedAmount = `₱${payment.amount.toFixed(2)}`;
        const diffTime = payment.dueDate.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. Amount: ${formattedAmount}, Due: ${payment.dueDate.toDateString()}, Days overdue: ${Math.abs(diffDays)}`);
      });
    }

    console.log('\n✅ Test data created successfully!');
    console.log('🧪 You can now login as RoelSundiam (password: RT2Tennis) to test overdue payment notifications');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
};

createOverduePayment();