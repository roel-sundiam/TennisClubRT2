import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';
import User from '../models/User';

dotenv.config();

async function checkRoelPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    // Get user RoelSundiam
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ User RoelSundiam not found');
      process.exit(1);
    }

    console.log(`\n👤 User: ${user.fullName} (${user.username})`);
    console.log(`🆔 User ID: ${user._id}`);

    // Find the October 11 reservation
    const oct11Date = new Date('2025-10-11T00:00:00.000Z');
    const oct11EndDate = new Date('2025-10-11T23:59:59.999Z');

    const oct11Reservations = await Reservation.find({
      userId: user._id,
      date: {
        $gte: oct11Date,
        $lte: oct11EndDate
      }
    }).lean();

    console.log(`\n📅 Found ${oct11Reservations.length} reservations for October 11, 2025:`);

    for (const reservation of oct11Reservations) {
      console.log(`\n🎾 Reservation:`);
      console.log(`   ID: ${reservation._id}`);
      console.log(`   Date: ${new Date(reservation.date).toISOString()}`);
      console.log(`   Time: ${reservation.timeSlot}:00 - ${reservation.timeSlot + (reservation.duration || 1)}:00`);
      console.log(`   Players: ${(reservation as any).players?.join(', ')}`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Payment Status: ${reservation.paymentStatus}`);
      console.log(`   Total Fee: ₱${reservation.totalFee}`);

      // Check if there's a Payment record for this reservation
      const payment = await Payment.findOne({ reservationId: reservation._id }).lean();

      if (payment) {
        console.log(`\n   💰 Payment Record Found:`);
        console.log(`      Payment ID: ${payment._id}`);
        console.log(`      Amount: ₱${payment.amount}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Due Date: ${new Date(payment.dueDate).toISOString()}`);
        console.log(`      Payment Method: ${payment.paymentMethod}`);
        console.log(`      Description: ${payment.description}`);
        console.log(`      Created At: ${new Date(payment.createdAt).toISOString()}`);

        const now = new Date();
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        oneDayAgo.setHours(23, 59, 59, 999);

        const isOverdue = new Date(payment.dueDate) < oneDayAgo;
        const daysOverdue = Math.ceil((now.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));

        console.log(`\n   📊 Overdue Check:`);
        console.log(`      Current Date: ${now.toISOString()}`);
        console.log(`      One Day Ago Cutoff: ${oneDayAgo.toISOString()}`);
        console.log(`      Is Overdue: ${isOverdue ? '🔴 YES' : '🟢 NO'}`);
        console.log(`      Days Past Due Date: ${daysOverdue} days`);

        if (payment.status === 'pending' && isOverdue) {
          console.log(`\n   🚫 THIS PAYMENT SHOULD BLOCK NEW RESERVATIONS!`);
        } else if (payment.status !== 'pending') {
          console.log(`\n   ℹ️  Payment status is '${payment.status}', not 'pending' - won't block`);
        } else if (!isOverdue) {
          console.log(`\n   ℹ️  Payment is not overdue yet - won't block`);
        }
      } else {
        console.log(`\n   ⚠️  NO Payment Record Found for this reservation!`);
        console.log(`      This is likely the issue - reservation exists but no Payment record`);
      }
    }

    // Also check all payments for this user
    console.log(`\n\n📋 All Payments for ${user.username}:`);
    const allPayments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${allPayments.length} payments (showing last 10):\n`);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(23, 59, 59, 999);

    for (const payment of allPayments) {
      const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < oneDayAgo;
      console.log(`${isOverdue ? '🔴' : '🟢'} ₱${payment.amount} - ${payment.status} - Due: ${new Date(payment.dueDate).toISOString()}`);
      console.log(`   ${payment.description}`);
      console.log(`   Payment ID: ${payment._id}`);
      console.log();
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRoelPayments();
