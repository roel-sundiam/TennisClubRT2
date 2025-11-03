import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import User from '../models/User';
import Reservation from '../models/Reservation';

dotenv.config();

async function checkHelenPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ username: 'HelenSundiam' });
    if (!user) {
      console.log('❌ User HelenSundiam not found');
      process.exit(1);
    }

    console.log(`👤 User: ${user.fullName} (${user.username})`);
    console.log(`🆔 User ID: ${user._id}\n`);

    const payments = await Payment.find({ userId: user._id })
      .sort({ dueDate: -1 })
      .lean();

    console.log(`💰 Total payments: ${payments.length}\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i]!;
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = payment.status === 'pending' && dueDate < today;

      console.log(`${i + 1}. Payment ID: ${payment._id}`);
      console.log(`   Amount: ₱${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Description: ${payment.description}`);
      console.log(`   Due Date: ${new Date(payment.dueDate).toISOString()}`);

      if (payment.reservationId) {
        const reservation = await Reservation.findById(payment.reservationId).lean();
        if (reservation) {
          const resDate = new Date(reservation.date);
          const expectedDue = new Date(resDate);
          expectedDue.setDate(expectedDue.getDate() + 1);

          console.log(`   Reservation Date: ${resDate.toISOString().split('T')[0]}`);
          console.log(`   Expected Due (res+1): ${expectedDue.toISOString().split('T')[0]}`);
          console.log(`   Actual Due: ${new Date(payment.dueDate).toISOString().split('T')[0]}`);

          const match = expectedDue.toISOString().split('T')[0] === new Date(payment.dueDate).toISOString().split('T')[0];
          console.log(`   ✓ Matches new logic: ${match ? '✅ YES' : '❌ NO'}`);
        }
      }

      if (payment.status === 'pending') {
        console.log(`   ${isOverdue ? '🔴' : '🟢'} Days ${isOverdue ? 'overdue' : 'until due'}: ${Math.abs(daysDiff)}`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHelenPayments();
