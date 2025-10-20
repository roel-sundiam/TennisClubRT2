import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reservation from '../models/Reservation';

// Load environment variables
dotenv.config();

async function checkBlockedReservations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all blocked reservations
    const blockedReservations = await Reservation.find({
      reservationType: 'blocked'
    }).sort({ date: 1, timeSlot: 1 });

    console.log(`\n📊 Found ${blockedReservations.length} blocked reservation(s)\n`);

    blockedReservations.forEach((reservation: any, index: number) => {
      console.log(`\n🚫 Blocked Reservation #${index + 1}:`);
      console.log(`   ID: ${reservation._id}`);
      console.log(`   Date (UTC): ${reservation.date.toISOString()}`);
      console.log(`   Date (Local): ${reservation.date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}`);
      console.log(`   Time Slot: ${reservation.timeSlot}`);
      console.log(`   Duration: ${reservation.duration || 1} hour(s)`);
      console.log(`   End Time Slot: ${reservation.endTimeSlot || 'NOT SET'}`);
      console.log(`   Status: ${reservation.status}`);
      console.log(`   Block Reason: ${reservation.blockReason || 'N/A'}`);
      console.log(`   Block Notes: ${reservation.blockNotes || 'N/A'}`);
      console.log(`   Time Range: ${reservation.timeSlot}:00 - ${reservation.endTimeSlot || (reservation.timeSlot + (reservation.duration || 1))}:00`);

      // Check for issues
      const issues = [];
      if (!reservation.endTimeSlot) {
        issues.push('⚠️  Missing endTimeSlot field');
      }
      if (reservation.status !== 'confirmed') {
        issues.push(`⚠️  Status is '${reservation.status}' (should be 'confirmed')`);
      }
      if (reservation.reservationType !== 'blocked') {
        issues.push(`⚠️  reservationType is '${reservation.reservationType}' (should be 'blocked')`);
      }

      if (issues.length > 0) {
        console.log(`\n   ⚠️  ISSUES FOUND:`);
        issues.forEach(issue => console.log(`      ${issue}`));
      } else {
        console.log(`\n   ✅ No issues found`);
      }
    });

    // Check specific dates
    console.log('\n\n🔍 Checking specific dates:');

    const datesToCheck = [
      new Date('2025-10-30'),
      new Date('2025-11-15')
    ];

    for (const checkDate of datesToCheck) {
      const startOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      const endOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() + 1);

      const reservations = await Reservation.find({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      console.log(`\n📅 ${checkDate.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}:`);
      console.log(`   Found ${reservations.length} reservation(s)`);

      reservations.forEach((r: any) => {
        console.log(`   - Type: ${r.reservationType || 'regular'}, Slots: ${r.timeSlot}-${r.endTimeSlot}, Status: ${r.status}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBlockedReservations();
