import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// TEST DATABASE ONLY - will clear reservations and payments
const TEST_URI = 'mongodb+srv://admin:Helenbot04117777!1@mydb.zxr9i5k.mongodb.net/TennisClubRT2_Test?retryWrites=true&w=majority&appName=MyDB';

async function clearReservationsAndPayments() {
  console.log('🗑️  Starting to clear reservations and payments from TEST database...\n');

  // Connect to TEST database
  console.log('📝 Connecting to TEST database (TennisClubRT2_Test)...');
  const connection = await mongoose.createConnection(TEST_URI).asPromise();
  console.log('✅ Connected to TEST database\n');

  try {
    // Clear reservations
    const reservationsCollection = connection.db!.collection('reservations');
    const reservationsCount = await reservationsCollection.countDocuments();
    console.log(`📋 Found ${reservationsCount} reservations`);

    const reservationsResult = await reservationsCollection.deleteMany({});
    console.log(`✅ Deleted ${reservationsResult.deletedCount} reservations\n`);

    // Clear payments
    const paymentsCollection = connection.db!.collection('payments');
    const paymentsCount = await paymentsCollection.countDocuments();
    console.log(`💰 Found ${paymentsCount} payments`);

    const paymentsResult = await paymentsCollection.deleteMany({});
    console.log(`✅ Deleted ${paymentsResult.deletedCount} payments\n`);

    console.log('✅ OPERATION COMPLETE!');
    console.log('📊 Summary:');
    console.log(`   - Reservations deleted: ${reservationsResult.deletedCount}`);
    console.log(`   - Payments deleted: ${paymentsResult.deletedCount}`);
    console.log('\n⚠️  IMPORTANT: Only TEST database was modified');
    console.log('✅ Production database (TennisClubRT2) remains unchanged');

  } catch (error) {
    console.error('❌ Error during operation:', error);
  } finally {
    await connection.close();
    console.log('\n📤 Disconnected from database');
  }
}

clearReservationsAndPayments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
