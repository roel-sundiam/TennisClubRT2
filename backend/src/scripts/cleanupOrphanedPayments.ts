import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';

dotenv.config();

async function cleanupOrphanedPayments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Searching for orphaned pending payments...\n');

    // Find all pending payments
    const pendingPayments = await Payment.find({ status: 'pending' }).lean();
    console.log(`📊 Found ${pendingPayments.length} total pending payments`);

    let cleanedCount = 0;
    let skippedCount = 0;
    const cleanupReport: any[] = [];

    for (const payment of pendingPayments) {
      // Check if this payment is associated with a reservation
      if (payment.reservationId) {
        const reservation = await Reservation.findById(payment.reservationId).lean();

        if (!reservation) {
          // Reservation doesn't exist - orphaned payment
          console.log(`\n⚠️  ORPHANED: Payment ${payment._id} - Reservation not found`);
          console.log(`   Amount: ₱${payment.amount}`);
          console.log(`   Description: ${payment.description}`);

          await Payment.findByIdAndUpdate(payment._id, {
            status: 'failed',
            'metadata.cancellation': {
              reason: 'Orphaned payment - reservation no longer exists',
              cancelledAt: new Date(),
              cancelledBy: 'system_cleanup',
              previousStatus: 'pending'
            }
          });

          cleanedCount++;
          cleanupReport.push({
            paymentId: payment._id,
            amount: payment.amount,
            description: payment.description,
            reason: 'Reservation not found',
            reservationId: payment.reservationId
          });

        } else if (reservation.status === 'cancelled') {
          // Reservation is cancelled but payment is still pending
          console.log(`\n🗑️  CANCELLED: Payment ${payment._id} - Reservation is cancelled`);
          console.log(`   Reservation Date: ${new Date(reservation.date).toISOString().split('T')[0]}`);
          console.log(`   Time Slot: ${reservation.timeSlot}:00`);
          console.log(`   Amount: ₱${payment.amount}`);

          await Payment.findByIdAndUpdate(payment._id, {
            status: 'failed',
            'metadata.cancellation': {
              reason: 'Orphaned payment - reservation was cancelled',
              cancelledAt: new Date(),
              cancelledBy: 'system_cleanup',
              previousStatus: 'pending'
            }
          });

          cleanedCount++;
          cleanupReport.push({
            paymentId: payment._id,
            amount: payment.amount,
            description: payment.description,
            reason: 'Reservation cancelled',
            reservationDate: reservation.date,
            timeSlot: reservation.timeSlot
          });

        } else if (reservation.status === 'completed') {
          // Reservation is completed but payment is still pending
          console.log(`\n✅ COMPLETED: Payment ${payment._id} - Reservation is completed`);
          console.log(`   Reservation Date: ${new Date(reservation.date).toISOString().split('T')[0]}`);
          console.log(`   Time Slot: ${reservation.timeSlot}:00`);
          console.log(`   Amount: ₱${payment.amount}`);

          await Payment.findByIdAndUpdate(payment._id, {
            status: 'failed',
            'metadata.cancellation': {
              reason: 'Orphaned payment - reservation already completed without payment',
              cancelledAt: new Date(),
              cancelledBy: 'system_cleanup',
              previousStatus: 'pending'
            }
          });

          cleanedCount++;
          cleanupReport.push({
            paymentId: payment._id,
            amount: payment.amount,
            description: payment.description,
            reason: 'Reservation completed',
            reservationDate: reservation.date,
            timeSlot: reservation.timeSlot
          });

        } else {
          // Reservation is still active (pending/confirmed) - keep payment as is
          skippedCount++;
          console.log(`   ⏭️  Skipped: Payment ${payment._id} - Reservation is ${reservation.status}`);
        }
      } else if (payment.pollId) {
        // Open Play payment - skip for now
        skippedCount++;
        console.log(`   ⏭️  Skipped: Payment ${payment._id} - Open Play payment`);
      } else if (payment.metadata?.isManualPayment) {
        // Manual payment - skip for now
        skippedCount++;
        console.log(`   ⏭️  Skipped: Payment ${payment._id} - Manual payment`);
      } else {
        // Unknown payment type
        console.log(`   ⚠️  Unknown: Payment ${payment._id} - No reservation, poll, or manual payment flag`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Total Pending Payments: ${pendingPayments.length}`);
    console.log(`✅ Cleaned Up (Orphaned): ${cleanedCount}`);
    console.log(`⏭️  Skipped (Active): ${skippedCount}`);
    console.log('='.repeat(60));

    if (cleanupReport.length > 0) {
      console.log('\n📋 CLEANUP REPORT:\n');
      cleanupReport.forEach((item, index) => {
        console.log(`${index + 1}. Payment ID: ${item.paymentId}`);
        console.log(`   Amount: ₱${item.amount}`);
        console.log(`   Reason: ${item.reason}`);
        console.log(`   Description: ${item.description}`);
        if (item.reservationDate) {
          console.log(`   Reservation: ${new Date(item.reservationDate).toISOString().split('T')[0]} at ${item.timeSlot}:00`);
        }
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedPayments();
