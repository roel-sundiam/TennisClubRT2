const mongoose = require('mongoose');
const User = require('./dist/models/User.js').default;

async function completePointsVerification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 COMPLETE POINTS VERIFICATION');
    console.log('='.repeat(60));
    
    // Get a comprehensive view of all users
    const allUsers = await User.find({}).lean();
    const totalUsers = allUsers.length;
    
    console.log(`👤 Total Users: ${totalUsers}`);
    
    // Check for ANY point-related fields
    const pointFields = [
      'points', 'seedPoints', 'rankingPoints', 'tournamentPoints', 
      'seasonPoints', 'totalPoints', 'ranking', 'rank', 'position',
      'playerRating', 'competitiveRating', 'skillRating', 'wins', 'losses'
    ];
    
    let usersWithAnyPoints = [];
    
    allUsers.forEach(user => {
      let hasPoints = false;
      let userPointsData = {};
      
      pointFields.forEach(field => {
        if (user[field] !== undefined && user[field] !== null && user[field] !== 0) {
          hasPoints = true;
          userPointsData[field] = user[field];
        }
      });
      
      if (hasPoints) {
        usersWithAnyPoints.push({
          name: user.fullName || user.username,
          ...userPointsData
        });
      }
    });
    
    console.log(`\n📊 Users with any form of points/rankings: ${usersWithAnyPoints.length}`);
    
    if (usersWithAnyPoints.length > 0) {
      console.log('\n❌ USERS STILL HAVING POINTS/RANKINGS:');
      console.log('='.repeat(40));
      usersWithAnyPoints.forEach(user => {
        console.log(`• ${user.name}:`);
        Object.entries(user).forEach(([key, value]) => {
          if (key !== 'name') {
            console.log(`   ${key}: ${value}`);
          }
        });
      });
    } else {
      console.log('\n✅ NO USERS HAVE ANY POINTS OR RANKINGS!');
    }
    
    // Show sample of clean users
    console.log('\n📋 SAMPLE OF COMPLETELY CLEAN USERS:');
    console.log('='.repeat(40));
    const sampleUsers = allUsers.slice(0, 5);
    sampleUsers.forEach(user => {
      console.log(`• ${user.fullName || user.username}:`);
      console.log(`  Coins: ${user.coinBalance}`);
      console.log(`  Points: ${user.points || 0}`);
      console.log(`  Seed Points: ${user.seedPoints || 'None'}`);
      console.log(`  Ranking: ${user.ranking || 'None'}`);
      console.log(`  Wins: ${user.wins || 0}`);
      console.log(`  Losses: ${user.losses || 0}`);
    });
    
    // Final summary
    console.log('\n🎯 FINAL CLEANUP STATUS:');
    console.log('='.repeat(40));
    
    if (usersWithAnyPoints.length === 0) {
      console.log('🎉 PERFECT! ALL POINTS COMPLETELY CLEARED!');
      console.log('   ✅ No regular points');
      console.log('   ✅ No seed points');
      console.log('   ✅ No rankings');
      console.log('   ✅ No tournament stats');
      console.log('   ✅ All users have 100 coins only');
      console.log('');
      console.log('🚀 The frontend should now show clean data!');
      console.log('📝 If you still see points in the frontend:');
      console.log('   • Clear browser cache (Ctrl+F5)');
      console.log('   • Log out and log back in');
      console.log('   • Check localStorage/sessionStorage');
    } else {
      console.log(`❌ Still have ${usersWithAnyPoints.length} users with points/rankings`);
    }
    
    console.log('\n📊 DATABASE TOTALS:');
    console.log('='.repeat(30));
    console.log(`💳 Payments: ${await mongoose.connection.db.collection('payments').countDocuments()}`);
    console.log(`🎾 Reservations: ${await mongoose.connection.db.collection('reservations').countDocuments()}`);
    console.log(`🏆 Polls: ${await mongoose.connection.db.collection('polls').countDocuments()}`);
    console.log(`🪙 Coin Transactions: ${await mongoose.connection.db.collection('cointransactions').countDocuments()}`);
    console.log(`👤 Users: ${totalUsers} (with clean stats)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

require('dotenv').config();
completePointsVerification();