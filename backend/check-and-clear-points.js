const mongoose = require('mongoose');
const User = require('./dist/models/User.js').default;

async function checkAndClearPoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 CHECKING MEMBER POINTS STATUS');
    console.log('='.repeat(60));
    
    // First, let's see what points-related fields exist
    const sampleUser = await User.findOne({}).lean();
    console.log('📋 Sample user structure (points-related fields):');
    const pointsFields = Object.keys(sampleUser).filter(key => 
      key.toLowerCase().includes('point') || 
      key.toLowerCase().includes('rank') || 
      key.toLowerCase().includes('rating') ||
      key.toLowerCase().includes('score')
    );
    console.log('Points-related fields found:', pointsFields);
    
    // Check all users with any form of points
    const usersWithPoints = await User.find({
      $or: [
        { points: { $exists: true, $ne: 0, $ne: null } },
        { ranking: { $exists: true, $ne: null } },
        { playerRating: { $exists: true, $ne: 0, $ne: null } },
        { rankingPoints: { $exists: true, $ne: 0, $ne: null } },
        { tournamentPoints: { $exists: true, $ne: 0, $ne: null } }
      ]
    }).select('username fullName points ranking playerRating rankingPoints tournamentPoints');
    
    console.log(`\n📊 Found ${usersWithPoints.length} users with points/rankings:`);
    
    if (usersWithPoints.length > 0) {
      console.log('\n⚠️  USERS WITH REMAINING POINTS:');
      console.log('='.repeat(40));
      usersWithPoints.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName || user.username}:`);
        if (user.points !== undefined && user.points !== 0) console.log(`   Points: ${user.points}`);
        if (user.ranking) console.log(`   Ranking: ${user.ranking}`);
        if (user.playerRating !== undefined && user.playerRating !== 0) console.log(`   Rating: ${user.playerRating}`);
        if (user.rankingPoints !== undefined && user.rankingPoints !== 0) console.log(`   Ranking Points: ${user.rankingPoints}`);
        if (user.tournamentPoints !== undefined && user.tournamentPoints !== 0) console.log(`   Tournament Points: ${user.tournamentPoints}`);
      });
      
      console.log('\n🧹 CLEARING ALL POINTS AND RANKINGS...');
      console.log('='.repeat(40));
      
      // Comprehensive points clearing
      const updateResult = await User.updateMany(
        {},
        {
          $set: {
            points: 0,
            playerRating: 0,
            rankingPoints: 0,
            tournamentPoints: 0,
            seasonPoints: 0,
            totalPoints: 0,
            wins: 0,
            losses: 0,
            totalMatches: 0,
            winRate: 0
          },
          $unset: {
            ranking: 1,
            rank: 1,
            position: 1,
            leaderboard: 1,
            leaderboardPosition: 1,
            seasonRanking: 1,
            tournamentRanking: 1,
            matchHistory: 1,
            tournamentStats: 1,
            seasonStats: 1,
            playerStats: 1,
            competitiveRating: 1,
            skillRating: 1,
            performanceRating: 1,
            lastRankingUpdate: 1
          }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} users`);
      
      // Verification
      console.log('\n🔍 VERIFICATION AFTER CLEARING:');
      console.log('='.repeat(40));
      
      const remainingUsersWithPoints = await User.find({
        $or: [
          { points: { $exists: true, $ne: 0, $ne: null } },
          { ranking: { $exists: true, $ne: null } },
          { playerRating: { $exists: true, $ne: 0, $ne: null } },
          { rankingPoints: { $exists: true, $ne: 0, $ne: null } },
          { tournamentPoints: { $exists: true, $ne: 0, $ne: null } }
        ]
      }).select('username fullName points ranking playerRating rankingPoints tournamentPoints');
      
      console.log(`📊 Users with remaining points: ${remainingUsersWithPoints.length}`);
      
      if (remainingUsersWithPoints.length > 0) {
        console.log('❌ Still have points:');
        remainingUsersWithPoints.forEach(user => {
          console.log(`   - ${user.fullName || user.username}: points=${user.points}, ranking=${user.ranking}, rating=${user.playerRating}`);
        });
      } else {
        console.log('✅ All points and rankings successfully cleared!');
      }
      
    } else {
      console.log('✅ No users found with points or rankings - already clean!');
    }
    
    // Show final sample of users
    console.log('\n📋 FINAL SAMPLE OF USERS:');
    console.log('='.repeat(40));
    const finalSample = await User.find({})
      .select('username fullName coinBalance points ranking wins losses totalMatches')
      .limit(5);
    
    finalSample.forEach(user => {
      console.log(`• ${user.fullName || user.username}:`);
      console.log(`  Coins: ${user.coinBalance}`);
      console.log(`  Points: ${user.points || 0}`);
      console.log(`  Ranking: ${user.ranking || 'None'}`);
      console.log(`  Wins: ${user.wins || 0}`);
      console.log(`  Losses: ${user.losses || 0}`);
      console.log(`  Matches: ${user.totalMatches || 0}`);
    });
    
    // Final count verification
    const totalUsers = await User.countDocuments();
    const usersWithZeroPoints = await User.countDocuments({ 
      $or: [
        { points: { $exists: false } },
        { points: 0 },
        { points: null }
      ]
    });
    const usersWithNoRanking = await User.countDocuments({ 
      $or: [
        { ranking: { $exists: false } },
        { ranking: null }
      ]
    });
    
    console.log('\n🎯 FINAL STATUS:');
    console.log('='.repeat(40));
    console.log(`👤 Total Users: ${totalUsers}`);
    console.log(`🔢 Users with zero/no points: ${usersWithZeroPoints}/${totalUsers} ${usersWithZeroPoints === totalUsers ? '✅' : '❌'}`);
    console.log(`🏆 Users with no ranking: ${usersWithNoRanking}/${totalUsers} ${usersWithNoRanking === totalUsers ? '✅' : '❌'}`);
    
    if (usersWithZeroPoints === totalUsers && usersWithNoRanking === totalUsers) {
      console.log('\n🎉 SUCCESS: All member points and rankings completely cleared!');
      console.log('   • All users have 0 points');
      console.log('   • All rankings removed');
      console.log('   • All tournament stats cleared');
      console.log('   • Ready for fresh competition data');
    } else {
      console.log('\n⚠️  Some issues remain - check the details above');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config();
checkAndClearPoints();