#!/usr/bin/env ts-node
/**
 * Fix specific reservation with incorrect totalFee
 * Reservation ID: 68ee5398bd2570947d994831
 * Should be: 1 hour, 2 members @ ₱20 = ₱40 (not ₱140)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reservation from '../models/Reservation';

dotenv.config();

async function fixSpecificReservation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    const reservationId = '68ee5398bd2570947d994831';

    // Find the reservation
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      console.log(`❌ Reservation ${reservationId} not found`);
      await mongoose.disconnect();
      return;
    }

    console.log('\n📋 Current reservation data:');
    console.log(`   ID: ${reservation._id}`);
    console.log(`   Date: ${reservation.date}`);
    console.log(`   Time Slot: ${reservation.timeSlot}:00`);
    console.log(`   Duration: ${reservation.duration || 'NOT SET'}`);
    console.log(`   End Time Slot: ${reservation.endTimeSlot || 'NOT SET'}`);
    console.log(`   Players: ${reservation.players.join(', ')} (${reservation.players.length} players)`);
    console.log(`   Current Total Fee: ₱${reservation.totalFee}`);
    console.log(`   Payment Status: ${reservation.paymentStatus}`);
    console.log(`   Status: ${reservation.status}`);

    // Calculate correct fee
    const peakHours = [5, 18, 19, 20, 21];
    const isPeak = peakHours.includes(reservation.timeSlot);
    const duration = reservation.duration || 1;

    let correctTotalFee = 0;
    const endTimeSlot = reservation.endTimeSlot || (reservation.timeSlot + duration);

    for (let hour = reservation.timeSlot; hour < endTimeSlot; hour++) {
      if (peakHours.includes(hour)) {
        // Peak hour: ₱100 minimum
        correctTotalFee += 100;
      } else {
        // Off-peak: ₱20 per member (assuming all are members)
        correctTotalFee += reservation.players.length * 20;
      }
    }

    console.log(`\n💰 Fee calculation:`);
    console.log(`   Duration: ${duration} hour(s)`);
    console.log(`   Peak hour? ${isPeak ? 'YES' : 'NO'}`);
    console.log(`   Players: ${reservation.players.length}`);
    console.log(`   CORRECT Total Fee: ₱${correctTotalFee}`);

    if (reservation.totalFee === correctTotalFee) {
      console.log('\n✅ Fee is already correct, no update needed');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n⚠️  Fee mismatch detected!`);
    console.log(`   Current: ₱${reservation.totalFee}`);
    console.log(`   Should be: ₱${correctTotalFee}`);
    console.log(`   Difference: ₱${Math.abs(reservation.totalFee - correctTotalFee)}`);

    // Update the reservation
    reservation.duration = duration;
    reservation.endTimeSlot = endTimeSlot;
    reservation.isMultiHour = duration > 1;
    reservation.totalFee = correctTotalFee;

    await reservation.save({ validateBeforeSave: false });

    console.log(`\n✅ Reservation updated successfully!`);
    console.log(`   New Total Fee: ₱${correctTotalFee}`);
    console.log(`   Duration: ${duration} hour(s)`);
    console.log(`   End Time Slot: ${endTimeSlot}:00`);

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixSpecificReservation();
