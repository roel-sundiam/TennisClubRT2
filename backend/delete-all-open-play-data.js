const mongoose = require('mongoose');
require('dotenv').config();

async function deleteAllOpenPlayData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Connected to MongoDB for cleanup');
    
    const Poll = require('./src/models/Poll').default;
    const Payment = require('./src/models/Payment').default;
    const SeedingPoint = require('./src/models/SeedingPoint').default;
    
    console.log('\n🧹 Starting comprehensive Open Play cleanup...\n');
    
    // 1. Find all Open Play polls
    const openPlayPolls = await Poll.find({ 'metadata.category': 'open_play' });
    console.log(`📊 Found ${openPlayPolls.length} Open Play polls to delete`);
    
    if (openPlayPolls.length > 0) {
      openPlayPolls.forEach(poll => {
        console.log(`  - ${poll.title} (ID: ${poll._id})`);
      });
    }
    
    // 2. Find and delete related payments
    const openPlayPayments = await Payment.find({
      description: { $regex: 'Open Play', $options: 'i' }
    });
    console.log(`💳 Found ${openPlayPayments.length} Open Play payments to delete`);
    
    if (openPlayPayments.length > 0) {
      const paymentResult = await Payment.deleteMany({
        description: { $regex: 'Open Play', $options: 'i' }
      });
      console.log(`✅ Deleted ${paymentResult.deletedCount} Open Play payments`);
    }
    
    // 3. Find and delete seeding points from Open Play (tournament series)
    const openPlaySeedingPoints = await SeedingPoint.find({
      $or: [
        { description: { $regex: '100 Series|250 Series|500 Series', $options: 'i' } },
        { description: { $regex: 'Open Play', $options: 'i' } }
      ]
    });
    console.log(`🏆 Found ${openPlaySeedingPoints.length} Open Play seeding points to delete`);
    
    if (openPlaySeedingPoints.length > 0) {
      // Show details of points to be deleted
      const pointsByUser = {};
      openPlaySeedingPoints.forEach(point => {
        if (!pointsByUser[point.userId]) {
          pointsByUser[point.userId] = { points: 0, count: 0 };
        }
        pointsByUser[point.userId].points += point.points;
        pointsByUser[point.userId].count += 1;
      });
      
      console.log('Points to be removed by user:');
      for (const [userId, data] of Object.entries(pointsByUser)) {
        console.log(`  User ${userId}: ${data.points} points (${data.count} entries)`);
      }
      
      const seedingResult = await SeedingPoint.deleteMany({
        $or: [
          { description: { $regex: '100 Series|250 Series|500 Series', $options: 'i' } },
          { description: { $regex: 'Open Play', $options: 'i' } }
        ]
      });
      console.log(`✅ Deleted ${seedingResult.deletedCount} Open Play seeding point entries`);
    }
    
    // 4. Delete all Open Play polls
    if (openPlayPolls.length > 0) {
      const pollResult = await Poll.deleteMany({ 'metadata.category': 'open_play' });
      console.log(`✅ Deleted ${pollResult.deletedCount} Open Play polls`);
    }
    
    // 5. Verify cleanup
    console.log('\n🔍 Verification - checking remaining data:');
    const remainingPolls = await Poll.countDocuments({ 'metadata.category': 'open_play' });
    const remainingPayments = await Payment.countDocuments({
      description: { $regex: 'Open Play', $options: 'i' }
    });
    const remainingSeedingPoints = await SeedingPoint.countDocuments({
      $or: [
        { description: { $regex: '100 Series|250 Series|500 Series', $options: 'i' } },
        { description: { $regex: 'Open Play', $options: 'i' } }
      ]
    });
    
    console.log(`📊 Remaining Open Play polls: ${remainingPolls}`);
    console.log(`💳 Remaining Open Play payments: ${remainingPayments}`);
    console.log(`🏆 Remaining Open Play seeding points: ${remainingSeedingPoints}`);
    
    if (remainingPolls === 0 && remainingPayments === 0 && remainingSeedingPoints === 0) {
      console.log('\n🎉 SUCCESS: All Open Play data has been completely removed!');
      console.log('✅ Ready for fresh testing');
    } else {
      console.log('\n⚠️  WARNING: Some Open Play data may still remain');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

deleteAllOpenPlayData();