const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas directly in the script
const pollSchema = new mongoose.Schema({}, { collection: 'polls', strict: false });
const paymentSchema = new mongoose.Schema({}, { collection: 'payments', strict: false });
const seedingPointSchema = new mongoose.Schema({}, { collection: 'seedingpoints', strict: false });

async function cleanupOpenPlayData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Connected to MongoDB for cleanup');
    
    const Poll = mongoose.model('Poll', pollSchema);
    const Payment = mongoose.model('Payment', paymentSchema);
    const SeedingPoint = mongoose.model('SeedingPoint', seedingPointSchema);
    
    console.log('\n🧹 Starting comprehensive Open Play cleanup...\n');
    
    // 1. Find all Open Play polls
    const openPlayPolls = await Poll.find({ 'metadata.category': 'open_play' });
    console.log(`📊 Found ${openPlayPolls.length} Open Play polls to delete`);
    
    if (openPlayPolls.length > 0) {
      console.log('Open Play polls found:');
      openPlayPolls.forEach(poll => {
        console.log(`  - ${poll.title} (ID: ${poll._id})`);
        console.log(`    Date: ${poll.openPlayEvent?.eventDate || 'unknown'}`);
        console.log(`    Confirmed Players: ${poll.openPlayEvent?.confirmedPlayers?.length || 0}`);
        console.log(`    Matches: ${poll.openPlayEvent?.matches?.length || 0}`);
      });
    }
    
    // 2. Find and delete related payments
    const openPlayPayments = await Payment.find({
      description: { $regex: 'Open Play', $options: 'i' }
    });
    console.log(`💳 Found ${openPlayPayments.length} Open Play payments to delete`);
    
    if (openPlayPayments.length > 0) {
      console.log('Open Play payments found:');
      openPlayPayments.forEach(payment => {
        console.log(`  - ${payment.description} - ₱${payment.amount} (${payment.status})`);
      });
      
      const paymentResult = await Payment.deleteMany({
        description: { $regex: 'Open Play', $options: 'i' }
      });
      console.log(`✅ Deleted ${paymentResult.deletedCount} Open Play payments`);
    }
    
    // 3. Find and delete seeding points from Open Play
    const openPlaySeedingPoints = await SeedingPoint.find({
      $or: [
        { description: { $regex: '100 Series|250 Series|500 Series', $options: 'i' } },
        { description: { $regex: 'Open Play', $options: 'i' } },
        { description: { $regex: 'Won.*match|Participated.*match', $options: 'i' } }
      ]
    });
    console.log(`🏆 Found ${openPlaySeedingPoints.length} Open Play seeding points to delete`);
    
    if (openPlaySeedingPoints.length > 0) {
      console.log('Seeding points found:');
      const pointsByUser = {};
      openPlaySeedingPoints.forEach(point => {
        if (!pointsByUser[point.userId]) {
          pointsByUser[point.userId] = { points: 0, count: 0, descriptions: [] };
        }
        pointsByUser[point.userId].points += point.points;
        pointsByUser[point.userId].count += 1;
        pointsByUser[point.userId].descriptions.push(point.description);
      });
      
      for (const [userId, data] of Object.entries(pointsByUser)) {
        console.log(`  User ${userId}: ${data.points} points (${data.count} entries)`);
        console.log(`    Descriptions: ${data.descriptions.join(', ')}`);
      }
      
      const seedingResult = await SeedingPoint.deleteMany({
        $or: [
          { description: { $regex: '100 Series|250 Series|500 Series', $options: 'i' } },
          { description: { $regex: 'Open Play', $options: 'i' } },
          { description: { $regex: 'Won.*match|Participated.*match', $options: 'i' } }
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
        { description: { $regex: 'Open Play', $options: 'i' } },
        { description: { $regex: 'Won.*match|Participated.*match', $options: 'i' } }
      ]
    });
    
    console.log(`📊 Remaining Open Play polls: ${remainingPolls}`);
    console.log(`💳 Remaining Open Play payments: ${remainingPayments}`);
    console.log(`🏆 Remaining Open Play seeding points: ${remainingSeedingPoints}`);
    
    if (remainingPolls === 0 && remainingPayments === 0 && remainingSeedingPoints === 0) {
      console.log('\n🎉 SUCCESS: All Open Play data has been completely removed!');
      console.log('✅ Ready for fresh testing');
      console.log('\n📝 Next steps:');
      console.log('1. Create a new Open Play event');
      console.log('2. Add players and generate matches');  
      console.log('3. Record match results to test seeding points');
      console.log('4. Check rankings to verify points are awarded correctly');
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

cleanupOpenPlayData();