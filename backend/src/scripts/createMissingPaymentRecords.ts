import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';
import User from '../models/User';

dotenv.config();

/**
 * This script creates Payment records for reservations that have pending payments
 * but no Payment record in the database.
 *
 * This ensures the overdue payment blocking logic works correctly.
 */
async function createMissingPaymentRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    // Find all reservations with pending payment status
    const pendingReservations = await Reservation.find({
      paymentStatus: 'pending',
      status: { $ne: 'cancelled' }
    }).lean();

    console.log(`\n📋 Found ${pendingReservations.length} reservations with pending payments`);

    let created = 0;
    let skipped = 0;

    for (const reservation of pendingReservations) {
      // Check if a Payment record already exists
      const existingPayment = await Payment.findOne({ reservationId: (reservation as any)._id });

      if (existingPayment) {
        console.log(`✓ Payment record already exists for reservation ${(reservation as any)._id}`);
        skipped++;
        continue;
      }

      // Get user info
      const user = await User.findById((reservation as any).userId).lean();
      if (!user) {
        console.log(`⚠️  User not found for reservation ${(reservation as any)._id}, skipping`);
        skipped++;
        continue;
      }

      // Create Payment record
      const reservationDate = new Date((reservation as any).date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reservationDate.setHours(0, 0, 0, 0);

      // Set due date - NEW LOGIC: Payment due 1 day after the reservation date
      const oneDayAfterReservation = new Date(reservationDate);
      oneDayAfterReservation.setDate(oneDayAfterReservation.getDate() + 1);
      oneDayAfterReservation.setHours(23, 59, 59, 999);

      const dueDate = oneDayAfterReservation;

      const payment = new Payment({
        userId: (reservation as any).userId,
        reservationId: (reservation as any)._id,
        amount: (reservation as any).totalFee || 0,
        paymentMethod: 'cash',
        status: 'pending',
        dueDate,
        description: `Court reservation payment for ${reservationDate.toDateString()} ${(reservation as any).timeSlot}:00`,
        metadata: {
          timeSlot: (reservation as any).timeSlot,
          date: (reservation as any).date,
          playerCount: (reservation as any).players?.length || 0,
          originalFee: (reservation as any).totalFee || 0,
          discounts: []
        }
      });

      await payment.save();

      const isOverdue = dueDate < new Date();

      console.log(`\n✅ Created Payment record:`);
      console.log(`   User: ${(user as any).fullName} (${(user as any).username})`);
      console.log(`   Reservation Date: ${reservationDate.toDateString()}`);
      console.log(`   Time Slot: ${(reservation as any).timeSlot}:00`);
      console.log(`   Amount: ₱${payment.amount}`);
      console.log(`   Due Date: ${payment.dueDate.toISOString()}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Is Overdue: ${isOverdue ? '🔴 YES' : '🟢 NO'}`);
      console.log(`   Payment ID: ${payment._id}`);

      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created} payment records`);
    console.log(`   ⏭️  Skipped: ${skipped} (already had payments)`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createMissingPaymentRecords();
