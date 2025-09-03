const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;

async function debugFullAggregation() {
  try {
    await mongoose.connect('mongodb+srv://admin:Helenbot04117777!1@mydb.zxr9i5k.mongodb.net/TennisClubRT2?retryWrites=true&w=majority&appName=MyDB');
    console.log('✅ Connected to MongoDB');
    
    const serviceFeePercentage = 0.10;
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    // Test the full aggregation pipeline
    const result = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
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
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjectId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$reservation',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $addFields: {
          serviceFee: { $multiply: ['$amount', serviceFeePercentage] },
          courtRevenue: { $multiply: ['$amount', { $subtract: [1, serviceFeePercentage] }] },
          isPeakHour: {
            $in: ['$reservation.timeSlot', [5, 18, 19, 21]]
          }
        }
      }
    ]);
    
    console.log('🎯 Final result count:', result.length);
    if (result.length > 0) {
      console.log('📋 First result:');
      console.log('  Payment ID:', result[0]._id);
      console.log('  Amount:', result[0].amount);
      console.log('  Service Fee:', result[0].serviceFee);
      console.log('  Court Revenue:', result[0].courtRevenue);
      console.log('  Member Name:', result[0].user?.fullName);
      console.log('  Time Slot:', result[0].reservation?.timeSlot);
      console.log('  Is Peak Hour:', result[0].isPeakHour);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugFullAggregation();