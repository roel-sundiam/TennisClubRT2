import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';
import User from '../models/User';

dotenv.config();

async function checkHelenReservation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    // Get user HelenSundiam
    const user = await User.findOne({ username: 'HelenSundiam' });
    if (!user) {
      console.log('❌ User HelenSundiam not found');
      process.exit(1);
    }

    console.log(`\n👤 User: ${user.fullName} (${user.username})`);
    console.log(`🆔 User ID: ${user._id}`);

    // Find the October 20, 2025 6PM-7PM reservation
    const oct20Date = new Date('2025-10-20T00:00:00.000Z');
    const oct20EndDate = new Date('2025-10-20T23:59:59.999Z');

    const reservations = await Reservation.find({
      userId: user._id,
      date: {
        $gte: oct20Date,
        $lte: oct20EndDate
      },
      timeSlot: 18 // 6PM
    }).lean();

    console.log(`\n📅 Found ${reservations.length} reservations for October 20, 2025 at 6PM:`);

    if (reservations.length === 0) {
      console.log('❌ No reservation found for October 20, 2025 at 6PM');
      process.exit(1);
    }

    for (const reservation of reservations) {
      console.log(`\n🎾 Reservation Details:`);
      console.log(`   ID: ${reservation._id}`);
      console.log(`   📅 Reservation Date: ${new Date(reservation.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} ${reservation.timeSlot}:00-${reservation.timeSlot + (reservation.duration || 1)}:00`);
      console.log(`   ⏰ CREATED AT: ${new Date((reservation as any).createdAt).toISOString()}`);
      console.log(`   📍 Created: ${new Date((reservation as any).createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
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
        console.log(`      Payment Created At: ${new Date(payment.createdAt).toISOString()}`);

        const now = new Date();
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        oneDayAgo.setHours(23, 59, 59, 999);

        const isOverdue = new Date(payment.dueDate) < oneDayAgo;
        const daysOverdueCurrent = Math.ceil((now.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        const daysOverdueFixed = Math.max(0, daysOverdueCurrent - 1); // Account for grace period

        console.log(`\n   📊 Timeline Analysis:`);
        console.log(`      Reservation Created: ${new Date((reservation as any).createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        console.log(`      Payment Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        console.log(`      Reservation Date: ${new Date(reservation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        console.log(`      Current Date: ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);

        console.log(`\n   📊 Overdue Calculation:`);
        console.log(`      One Day Ago Cutoff: ${oneDayAgo.toISOString()}`);
        console.log(`      Is Overdue: ${isOverdue ? '🔴 YES' : '🟢 NO'}`);
        console.log(`      Days Past Due Date (CURRENT FORMULA): ${daysOverdueCurrent} days ❌ BUG`);
        console.log(`      Days Past Due Date (FIXED FORMULA): ${daysOverdueFixed} day(s) ✅ CORRECT`);

        console.log(`\n   🔍 Due Date Logic:`);
        const reservationCreated = new Date((reservation as any).createdAt);
        const sevenDaysFromCreation = new Date(reservationCreated);
        sevenDaysFromCreation.setDate(sevenDaysFromCreation.getDate() + 7);
        const oneDayBeforeReservation = new Date(reservation.date);
        oneDayBeforeReservation.setDate(oneDayBeforeReservation.getDate() - 1);

        console.log(`      7 days from creation: ${sevenDaysFromCreation.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        console.log(`      1 day before reservation: ${oneDayBeforeReservation.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        console.log(`      Actual due date: ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} = min(${sevenDaysFromCreation.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${oneDayBeforeReservation.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);

        if (payment.status === 'pending' && isOverdue) {
          console.log(`\n   🚫 THIS PAYMENT IS BLOCKING NEW RESERVATIONS!`);
        } else if (payment.status !== 'pending') {
          console.log(`\n   ℹ️  Payment status is '${payment.status}', not 'pending' - won't block`);
        } else if (!isOverdue) {
          console.log(`\n   ℹ️  Payment is not overdue yet - won't block`);
        }
      } else {
        console.log(`\n   ⚠️  NO Payment Record Found for this reservation!`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHelenReservation();
