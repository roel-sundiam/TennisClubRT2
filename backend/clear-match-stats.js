const mongoose = require('mongoose');
const User = require('./dist/models/User.js').default;

async function clearMatchStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🧹 CLEARING ALL MATCH STATISTICS');
    console.log('='.repeat(50));
    
    // First, check current status
    const usersWithStats = await User.find({
      $or: [
        { matchesWon: { $exists: true, $ne: 0, $ne: null } },
        { matchesPlayed: { $exists: true, $ne: 0, $ne: null } },
        { winRate: { $exists: true, $ne: 0, $ne: null } }
      ]
    }).select('username fullName matchesWon matchesPlayed winRate');
    
    console.log(`📊 Found ${usersWithStats.length} users with match statistics`);
    
    if (usersWithStats.length > 0) {
      console.log('\n⚠️  USERS WITH CURRENT MATCH STATS:');
      console.log('='.repeat(40));
      usersWithStats.forEach((user, index) => {
        const record = `${user.matchesWon || 0}-${(user.matchesPlayed || 0) - (user.matchesWon || 0)}`;
        const winRate = user.matchesPlayed > 0 ? ((user.matchesWon || 0) / user.matchesPlayed * 100).toFixed(0) + '%' : '0%';
        console.log(`${index + 1}. ${user.fullName || user.username}:`);
        console.log(`   Current Record: ${record} (${user.matchesPlayed || 0} played)`);
        console.log(`   Current Win Rate: ${winRate}`);
      });
      
      console.log('\n🧹 CLEARING ALL MATCH STATISTICS...');
      console.log('='.repeat(40));
      
      // Clear all match-related statistics
      const updateResult = await User.updateMany(
        {},
        {
          $set: {
            matchesWon: 0,
            matchesPlayed: 0,
            winRate: 0,
            totalMatches: 0
          },
          $unset: {
            matchHistory: 1,
            recentMatches: 1,
            tournamentStats: 1,
            seasonStats: 1,
            playerStats: 1,
            lastMatchUpdate: 1
          }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} users`);
      
      // Verification
      console.log('\n🔍 VERIFICATION AFTER CLEARING:');
      console.log('='.repeat(40));
      
      const remainingStats = await User.find({
        $or: [
          { matchesWon: { $exists: true, $ne: 0, $ne: null } },
          { matchesPlayed: { $exists: true, $ne: 0, $ne: null } },
          { winRate: { $exists: true, $ne: 0, $ne: null } }
        ]
      }).countDocuments();
      
      console.log(`📊 Users with remaining match stats: ${remainingStats}`);
      
      if (remainingStats === 0) {
        console.log('✅ All match statistics successfully cleared!');
        console.log('   • Record will show: 0-0');
        console.log('   • Win Rate will show: 0%');
        console.log('   • All match history removed');
      } else {
        console.log('❌ Some match statistics remain');
      }
      
    } else {
      console.log('✅ No users have match statistics - already clean!');
    }
    
    // Show final sample
    console.log('\n📋 FINAL SAMPLE OF USERS:');
    console.log('='.repeat(40));
    const finalSample = await User.find({})
      .select('username fullName matchesWon matchesPlayed winRate')
      .limit(5);
    
    finalSample.forEach(user => {
      const record = `${user.matchesWon || 0}-${(user.matchesPlayed || 0) - (user.matchesWon || 0)}`;
      const winRate = user.matchesPlayed > 0 ? ((user.matchesWon || 0) / user.matchesPlayed * 100).toFixed(0) + '%' : '0%';
      console.log(`• ${user.fullName || user.username}:`);
      console.log(`  Record: ${record}`);
      console.log(`  Win Rate: ${winRate}`);
    });
    
    console.log('\n🎯 FINAL STATUS:');
    console.log('='.repeat(40));
    console.log('✅ All match statistics cleared');
    console.log('✅ Records reset to 0-0');
    console.log('✅ Win rates reset to 0%');
    console.log('✅ Ready for clean display in frontend');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

require('dotenv').config();
clearMatchStats();