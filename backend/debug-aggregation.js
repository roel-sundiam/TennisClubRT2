const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;

async function debugAggregation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TennisClubRT2');
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Find completed payments
    const completedPayments = await Payment.find({ status: 'completed' });
    console.log('💳 Completed payments found:', completedPayments.length);
    
    if (completedPayments.length > 0) {
      const payment = completedPayments[0];
      console.log('📋 First completed payment:');
      console.log('  ID:', payment._id);
      console.log('  User ID:', payment.userId, 'Type:', typeof payment.userId);
      console.log('  Reservation ID:', payment.reservationId, 'Type:', typeof payment.reservationId);
      console.log('  Amount:', payment.amount);
    }
    
    // Step 2: Test the aggregation step by step
    console.log('\n🔍 Testing aggregation pipeline...');
    
    // Just match completed payments
    const step1 = await Payment.aggregate([
      { $match: { status: 'completed' } }
    ]);
    console.log('Step 1 - Match completed:', step1.length);
    
    // Add ObjectId conversion
    const step2 = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $addFields: {
          reservationObjectId: { $toObjectId: '$reservationId' },
          userObjectId: { $toObjectId: '$userId' }
        }
      }
    ]);
    console.log('Step 2 - Add ObjectIds:', step2.length);
    
    // Test reservation lookup
    const step3 = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $addFields: {
          reservationObjectId: { $toObjectId: '$reservationId' },
          userObjectId: { $toObjectId: '$userId' }
        }
      },
      {
        $lookup: {
          from: 'reservations',
          localField: 'reservationObjectId',
          foreignField: '_id',
          as: 'reservation'
        }
      }
    ]);
    console.log('Step 3 - Reservation lookup:', step3.length);
    if (step3[0]) {
      console.log('  Reservations found:', step3[0].reservation.length);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAggregation();