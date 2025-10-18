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
        // Since we can't access virtual fields on lean() results,
        // we'll just assume 1 hour duration for all old reservations
        // This is the safest approach for legacy data
        const calculatedDuration = 1;
        const calculatedEndTimeSlot = res.timeSlot + 1;

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
        console.log(`✅ Fixed reservation ${res._id}: duration=${calculatedDuration}, endTimeSlot=${calculatedEndTimeSlot}`);
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
