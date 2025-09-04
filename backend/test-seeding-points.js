const mongoose = require('mongoose');
require('dotenv').config();

// Define schema for the test
const seedingPointSchema = new mongoose.Schema({}, { collection: 'seedingpoints', strict: false });

async function testSeedingPoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Testing seeding points system...');
    
    const SeedingPoint = mongoose.model('SeedingPoint', seedingPointSchema);
    
    // Check if we can create a test seeding point
    const testPoint = new SeedingPoint({
      userId: '68a7bd6d2e91c9d68ec84547', // Test user ID (Antonnette Tayag)
      points: 10,
      description: 'Test seeding point',
      tournamentTier: '100',
      pollId: '68b8c4482cb436d47ee60bc2', // Test poll ID
      matchId: 'test_match_1'
    });
    
    await testPoint.save();
    console.log('✅ Successfully created test seeding point');
    
    // Verify it was created
    const savedPoint = await SeedingPoint.findById(testPoint._id);
    console.log('📊 Test seeding point details:');
    console.log(`   User ID: ${savedPoint.userId}`);
    console.log(`   Points: ${savedPoint.points}`);
    console.log(`   Description: ${savedPoint.description}`);
    console.log(`   Tournament Tier: ${savedPoint.tournamentTier}`);
    console.log(`   Poll ID: ${savedPoint.pollId}`);
    
    // Clean up test data
    await SeedingPoint.deleteOne({ _id: testPoint._id });
    console.log('🧹 Cleaned up test data');
    
    console.log('\n🎯 System Ready! The seeding points system should now work correctly.');
    console.log('💡 Next step: Record a match result in the admin UI and check if points are awarded.');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error testing seeding points:', error);
    process.exit(1);
  }
}

testSeedingPoints();