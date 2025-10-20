import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function listBlockedReservations() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const reservations = await db!.collection('reservations').find({
      reservationType: 'blocked'
    }).toArray();

    console.log(`Found ${reservations.length} blocked reservations:\n`);

    reservations.forEach((r: any, i: number) => {
      console.log(`#${i + 1}:`);
      console.log(`  _id: ${r._id}`);
      console.log(`  date: ${r.date}`);
      console.log(`  timeSlot: ${r.timeSlot}`);
      console.log(`  duration: ${r.duration}`);
      console.log(`  endTimeSlot: ${r.endTimeSlot}`);
      console.log(`  status: ${r.status}`);
      console.log(`  reservationType: ${r.reservationType}`);
      console.log('');
    });

    // Check Oct 30
    const oct30Start = new Date('2025-10-30T00:00:00.000Z');
    const oct30End = new Date('2025-10-31T00:00:00.000Z');

    console.log('\nChecking Oct 30, 2025:');
    const oct30Reservations = await db!.collection('reservations').find({
      date: { $gte: oct30Start, $lt: oct30End },
      status: { $in: ['pending', 'confirmed'] }
    }).toArray();

    console.log(`Found ${oct30Reservations.length} reservations on Oct 30`);
    oct30Reservations.forEach((r: any) => {
      console.log(`  - Type: ${r.reservationType || 'regular'}, Time: ${r.timeSlot}-${r.endTimeSlot}, Status: ${r.status}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listBlockedReservations();
