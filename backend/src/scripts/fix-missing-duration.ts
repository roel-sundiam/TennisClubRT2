#!/usr/bin/env ts-node
/**
 * Migration script to fix reservations missing duration and endTimeSlot fields
 * This adds the missing fields for reservations created before multi-hour support was added
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reservation from '../models/Reservation';

dotenv.config();

async function fixMissingDuration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    // Find all reservations without duration field
    const reservationsWithoutDuration = await Reservation.find({
      $or: [
        { duration: { $exists: false } },
        { duration: null },
        { endTimeSlot: { $exists: false } },
        { endTimeSlot: null }
      ]
    }).lean();

    console.log(`\n📊 Found ${reservationsWithoutDuration.length} reservations missing duration/endTimeSlot fields`);

    if (reservationsWithoutDuration.length === 0) {
      console.log('✅ No reservations need fixing!');
      await mongoose.disconnect();
      return;
    }

    let fixed = 0;
    let errors = 0;

    for (const res of reservationsWithoutDuration) {
      try {
        // Parse timeSlotDisplay to determine duration
        // Format examples: "5PM-6PM", "17:00 - 18:00", "5PM-7PM" (multi-hour)
        let calculatedDuration = 1;
        let calculatedEndTimeSlot = res.timeSlot + 1;

        if (res.timeSlotDisplay) {
          const display = res.timeSlotDisplay as string;

          // Try to extract end time from display
          // Match patterns like "5PM-7PM" or "17:00 - 19:00"
          const pmMatch = display.match(/(\d+)PM-(\d+)PM/);
          const timeMatch = display.match(/(\d+):00\s*-\s*(\d+):00/);

          if (pmMatch) {
            const startHour = parseInt(pmMatch[1]) + 12;
            const endHour = parseInt(pmMatch[2]) + 12;
            calculatedDuration = endHour - startHour;
            calculatedEndTimeSlot = endHour;
          } else if (timeMatch) {
            const startHour = parseInt(timeMatch[1]);
            const endHour = parseInt(timeMatch[2]);
            calculatedDuration = endHour - startHour;
            calculatedEndTimeSlot = endHour;
          }
        }

        // Validate calculated values
        if (calculatedDuration < 1 || calculatedDuration > 12) {
          console.warn(`⚠️  Invalid duration ${calculatedDuration} for reservation ${res._id}, using 1`);
          calculatedDuration = 1;
          calculatedEndTimeSlot = res.timeSlot + 1;
        }

        // Update the reservation
        await Reservation.updateOne(
          { _id: res._id },
          {
            $set: {
              duration: calculatedDuration,
              endTimeSlot: calculatedEndTimeSlot,
              isMultiHour: calculatedDuration > 1
            }
          }
        );

        fixed++;
        console.log(`✅ Fixed reservation ${res._id}: ${res.timeSlotDisplay} -> duration=${calculatedDuration}, endTimeSlot=${calculatedEndTimeSlot}`);
      } catch (error) {
        errors++;
        console.error(`❌ Error fixing reservation ${res._id}:`, error);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total: ${reservationsWithoutDuration.length}`);

    await mongoose.disconnect();
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixMissingDuration();
