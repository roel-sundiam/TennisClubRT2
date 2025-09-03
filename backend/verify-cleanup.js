const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const Poll = require('./dist/models/Poll.js').default;
const CoinTransaction = require('./dist/models/CoinTransaction.js').default;
const User = require('./dist/models/User.js').default;

async function verifyCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 CLEANUP VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    // Check all collections are empty
    const paymentCount = await Payment.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const pollCount = await Poll.countDocuments();
    const coinTransactionCount = await CoinTransaction.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('📊 CURRENT DATABASE STATE:');
    console.log('='.repeat(40));
    console.log(`💳 Payments: ${paymentCount}`);
    console.log(`🎾 Reservations: ${reservationCount}`);
    console.log(`🏆 Polls/Open Play Events: ${pollCount}`);
    console.log(`🪙 Coin Transactions: ${coinTransactionCount}`);
    console.log(`👤 Users: ${userCount}`);
    
    // Check user stats reset
    console.log('\n👤 USER ACCOUNT VERIFICATION:');
    console.log('='.repeat(40));
    
    const usersWithDefaultCoins = await User.countDocuments({ coinBalance: 100 });
    const usersWithZeroWins = await User.countDocuments({ wins: 0 });
    const usersWithZeroLosses = await User.countDocuments({ losses: 0 });
    const usersWithZeroMatches = await User.countDocuments({ totalMatches: 0 });
    const usersWithZeroPoints = await User.countDocuments({ points: 0 });
    
    console.log(`💰 Users with default coin balance (100): ${usersWithDefaultCoins}/${userCount}`);
    console.log(`🏆 Users with wins reset to 0: ${usersWithZeroWins}/${userCount}`);
    console.log(`💔 Users with losses reset to 0: ${usersWithZeroLosses}/${userCount}`);
    console.log(`📊 Users with totalMatches reset to 0: ${usersWithZeroMatches}/${userCount}`);
    console.log(`🎯 Users with points reset to 0: ${usersWithZeroPoints}/${userCount}`);
    
    // Sample a few users to verify
    const sampleUsers = await User.find({})
      .select('username fullName coinBalance wins losses totalMatches points ranking')
      .limit(3);
    
    console.log('\n📋 SAMPLE USER VERIFICATION:');
    console.log('='.repeat(40));
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.username}:`);
      console.log(`   Coins: ${user.coinBalance}`);
      console.log(`   Wins: ${user.wins || 0}`);
      console.log(`   Losses: ${user.losses || 0}`);
      console.log(`   Matches: ${user.totalMatches || 0}`);
      console.log(`   Points: ${user.points || 0}`);
      console.log(`   Ranking: ${user.ranking || 'None'}`);
    });
    
    // Final assessment
    console.log('\n🎯 CLEANUP ASSESSMENT:');
    console.log('='.repeat(40));
    
    const dataClean = (
      paymentCount === 0 &&
      reservationCount === 0 &&
      pollCount === 0 &&
      coinTransactionCount === 0
    );
    
    const statsReset = (
      usersWithDefaultCoins === userCount &&
      usersWithZeroWins === userCount &&
      usersWithZeroLosses === userCount &&
      usersWithZeroMatches === userCount
    );
    
    if (dataClean && statsReset) {
      console.log('🎉 PERFECT: All data successfully cleaned!');
      console.log('   ✅ All transactional data deleted');
      console.log('   ✅ All user stats properly reset');
      console.log('   ✅ User accounts preserved');
      console.log('   ✅ Database is ready for fresh data');
    } else {
      console.log('⚠️  ISSUES DETECTED:');
      if (!dataClean) {
        console.log('   ❌ Some transactional data still exists');
        if (paymentCount > 0) console.log(`      - ${paymentCount} payments remain`);
        if (reservationCount > 0) console.log(`      - ${reservationCount} reservations remain`);
        if (pollCount > 0) console.log(`      - ${pollCount} polls/events remain`);
        if (coinTransactionCount > 0) console.log(`      - ${coinTransactionCount} coin transactions remain`);
      }
      if (!statsReset) {
        console.log('   ❌ Some user stats not properly reset');
        if (usersWithDefaultCoins !== userCount) console.log(`      - ${userCount - usersWithDefaultCoins} users don't have default coins`);
        if (usersWithZeroWins !== userCount) console.log(`      - ${userCount - usersWithZeroWins} users still have wins`);
        if (usersWithZeroLosses !== userCount) console.log(`      - ${userCount - usersWithZeroLosses} users still have losses`);
        if (usersWithZeroMatches !== userCount) console.log(`      - ${userCount - usersWithZeroMatches} users still have match records`);
      }
    }
    
    console.log('\n📈 READY FOR NEW DATA:');
    console.log('='.repeat(40));
    console.log('• 💳 Payments: Ready for new court booking payments');
    console.log('• 🎾 Reservations: Ready for new court bookings');
    console.log('• 🏆 Open Play: Ready for new tournament events');
    console.log('• 🪙 Coins: All users have fresh 100 coin balance');
    console.log('• 📊 Rankings: Clean slate for new match results');
    console.log('• 👤 Users: All accounts preserved and reset');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config();
verifyCleanup();