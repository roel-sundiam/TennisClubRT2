const mongoose = require('mongoose');
const User = require('./dist/models/User.js').default;

async function checkSeedPoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 CHECKING SEED POINTS SPECIFICALLY');
    console.log('='.repeat(50));
    
    // Check users with seedPoints
    const usersWithSeedPoints = await User.find({
      seedPoints: { $exists: true, $ne: 0, $ne: null }
    }).select('username fullName seedPoints').limit(10);
    
    console.log(`📊 Users with seedPoints: ${usersWithSeedPoints.length}`);
    
    if (usersWithSeedPoints.length > 0) {
      console.log('\n⚠️  USERS WITH SEED POINTS:');
      console.log('='.repeat(30));
      usersWithSeedPoints.forEach(user => {
        console.log(`• ${user.fullName || user.username}: ${user.seedPoints} seed points`);
      });
      
      console.log('\n🧹 CLEARING SEED POINTS...');
      const updateResult = await User.updateMany(
        {},
        {
          $unset: {
            seedPoints: 1
          }
        }
      );
      console.log(`✅ Updated ${updateResult.modifiedCount} users to remove seedPoints`);
    } else {
      console.log('✅ No users have seedPoints');
    }
    
    // Check all possible point-related fields
    const sampleUser = await User.findOne({}).lean();
    console.log('\n📋 ALL FIELDS IN USER DOCUMENT:');
    console.log('='.repeat(30));
    Object.keys(sampleUser).forEach(key => {
      if (key.toLowerCase().includes('point') || 
          key.toLowerCase().includes('rank') || 
          key.toLowerCase().includes('score') ||
          key.toLowerCase().includes('rating')) {
        console.log(`   ${key}: ${sampleUser[key]}`);
      }
    });
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    const remainingSeedPoints = await User.find({
      seedPoints: { $exists: true, $ne: null }
    }).countDocuments();
    
    console.log(`📊 Users with remaining seedPoints: ${remainingSeedPoints}`);
    
    if (remainingSeedPoints === 0) {
      console.log('✅ All seed points cleared!');
    } else {
      console.log('❌ Some seed points remain');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

require('dotenv').config();
checkSeedPoints();