const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const Poll = require('./dist/models/Poll.js').default;
const CoinTransaction = require('./dist/models/CoinTransaction.js').default;
const User = require('./dist/models/User.js').default;

async function finalConfirmation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🏁 FINAL CLEANUP CONFIRMATION');
    console.log('='.repeat(60));
    
    // Check all main collections
    const paymentCount = await Payment.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const pollCount = await Poll.countDocuments();
    const coinTransactionCount = await CoinTransaction.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('📊 FINAL DATABASE STATE:');
    console.log('='.repeat(40));
    console.log(`💳 Payments: ${paymentCount} ${paymentCount === 0 ? '✅' : '❌'}`);
    console.log(`🎾 Reservations: ${reservationCount} ${reservationCount === 0 ? '✅' : '❌'}`);
    console.log(`🏆 Polls/Events: ${pollCount} ${pollCount === 0 ? '✅' : '❌'}`);
    console.log(`🪙 Coin Transactions: ${coinTransactionCount} ${coinTransactionCount === 0 ? '✅' : '❌'}`);
    console.log(`👤 Users: ${userCount} ✅ (preserved)`);
    
    // Check user stats more accurately
    const allUsers = await User.find({}).select('username fullName coinBalance wins losses totalMatches points');
    
    let usersWithCorrectStats = 0;
    let problematicUsers = [];
    
    allUsers.forEach(user => {
      const hasCorrectCoins = user.coinBalance === 100;
      const hasZeroWins = (user.wins === 0 || user.wins === undefined);
      const hasZeroLosses = (user.losses === 0 || user.losses === undefined);
      const hasZeroMatches = (user.totalMatches === 0 || user.totalMatches === undefined);
      const hasZeroPoints = (user.points === 0 || user.points === undefined);
      
      if (hasCorrectCoins && hasZeroWins && hasZeroLosses && hasZeroMatches && hasZeroPoints) {
        usersWithCorrectStats++;
      } else {
        problematicUsers.push({
          name: user.fullName || user.username,
          coins: user.coinBalance,
          wins: user.wins,
          losses: user.losses,
          matches: user.totalMatches,
          points: user.points
        });
      }
    });
    
    console.log(`\n👤 USER STATS VERIFICATION:`);
    console.log('='.repeat(40));
    console.log(`✅ Users with correct stats: ${usersWithCorrectStats}/${userCount}`);
    
    if (problematicUsers.length > 0) {
      console.log(`❌ Users with incorrect stats: ${problematicUsers.length}`);
      console.log('   First few problematic users:');
      problematicUsers.slice(0, 3).forEach(user => {
        console.log(`   - ${user.name}: coins=${user.coins}, wins=${user.wins}, losses=${user.losses}, matches=${user.matches}, points=${user.points}`);
      });
    }
    
    // Show a sample of correctly reset users
    console.log('\n📋 SAMPLE OF CORRECTLY RESET USERS:');
    console.log('='.repeat(40));
    allUsers.slice(0, 3).forEach(user => {
      console.log(`• ${user.fullName || user.username}:`);
      console.log(`  Coins: ${user.coinBalance}`);
      console.log(`  Wins: ${user.wins || 0}`);
      console.log(`  Losses: ${user.losses || 0}`);
      console.log(`  Matches: ${user.totalMatches || 0}`);
      console.log(`  Points: ${user.points || 0}`);
    });
    
    // Overall assessment
    const dataClean = (
      paymentCount === 0 &&
      reservationCount === 0 &&
      pollCount === 0 &&
      coinTransactionCount === 0
    );
    
    const statsClean = usersWithCorrectStats === userCount;
    
    console.log('\n🎯 OVERALL STATUS:');
    console.log('='.repeat(40));
    
    if (dataClean && statsClean) {
      console.log('🎉 CLEANUP COMPLETE - PERFECT SUCCESS!');
      console.log('   ✅ All payments deleted');
      console.log('   ✅ All reservations deleted');
      console.log('   ✅ All open play events deleted');
      console.log('   ✅ All coin transactions deleted');
      console.log('   ✅ All user stats reset');
      console.log('   ✅ All coin balances reset to 100');
      console.log('');
      console.log('🚀 DATABASE IS READY FOR FRESH DATA!');
    } else {
      console.log('⚠️  CLEANUP STATUS:');
      console.log(`   Transactional data clean: ${dataClean ? '✅' : '❌'}`);
      console.log(`   User stats clean: ${statsClean ? '✅' : '❌'}`);
      
      if (!dataClean) {
        console.log('   Issues with transactional data - some records remain');
      }
      if (!statsClean) {
        console.log(`   Issues with user stats - ${problematicUsers.length} users need fixing`);
      }
    }
    
    console.log('\n📈 WHAT YOU CAN DO NOW:');
    console.log('='.repeat(40));
    console.log('• Create new court reservations');
    console.log('• Set up new Open Play tournaments'); 
    console.log('• Users can start making payments');
    console.log('• Begin tracking new match results');
    console.log('• Build new rankings from scratch');
    console.log('• All users have fresh 100 coin balance');
    
  } catch (error) {
    console.error('❌ Error during confirmation:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config();
finalConfirmation();