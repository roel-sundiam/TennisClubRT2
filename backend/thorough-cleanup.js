const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const Poll = require('./dist/models/Poll.js').default;
const CoinTransaction = require('./dist/models/CoinTransaction.js').default;
const User = require('./dist/models/User.js').default;

async function thoroughCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔧 THOROUGH CLEANUP - FIXING REMAINING ISSUES');
    console.log('='.repeat(60));
    
    // 1. Force delete all coin transactions
    console.log('🪙 Force cleaning ALL coin transactions...');
    const coinResult = await CoinTransaction.deleteMany({});
    console.log(`   ✅ Deleted ${coinResult.deletedCount} coin transactions`);
    
    // 2. More thorough user stats reset
    console.log('\n👤 Thorough user stats reset...');
    const userUpdateResult = await User.updateMany(
      {},
      {
        $set: {
          coinBalance: 100,
          wins: 0,
          losses: 0,
          totalMatches: 0,
          winRate: 0,
          points: 0
        },
        $unset: {
          ranking: 1,
          lastActive: 1,
          matchHistory: 1,
          tournamentStats: 1,
          stats: 1,
          playerRating: 1,
          seasonStats: 1
        }
      }
    );
    console.log(`   ✅ Updated ${userUpdateResult.modifiedCount} users`);
    
    // 3. Check for any additional collections that might need cleaning
    console.log('\n🔍 Checking for other data collections...');
    
    // Get all collection names to see if there are others
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📋 Available collections:', collectionNames);
    
    // Clean any potential ranking or stats collections
    for (const collectionName of collectionNames) {
      if (collectionName.includes('ranking') || 
          collectionName.includes('stat') || 
          collectionName.includes('match') ||
          collectionName.includes('tournament')) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const count = await collection.countDocuments();
          if (count > 0) {
            console.log(`🗑️  Found ${count} documents in ${collectionName}, cleaning...`);
            await collection.deleteMany({});
            console.log(`   ✅ Cleaned ${collectionName}`);
          }
        } catch (error) {
          console.log(`   ⚠️  Could not clean ${collectionName}:`, error.message);
        }
      }
    }
    
    // 4. Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    console.log('='.repeat(40));
    
    const paymentCount = await Payment.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const pollCount = await Poll.countDocuments();
    const coinTransactionCount = await CoinTransaction.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`💳 Payments: ${paymentCount}`);
    console.log(`🎾 Reservations: ${reservationCount}`);
    console.log(`🏆 Polls/Events: ${pollCount}`);
    console.log(`🪙 Coin Transactions: ${coinTransactionCount}`);
    console.log(`👤 Users: ${userCount}`);
    
    // Check user stats
    const usersWithDefaultCoins = await User.countDocuments({ coinBalance: 100 });
    const usersWithZeroWins = await User.countDocuments({ wins: 0 });
    const usersWithZeroLosses = await User.countDocuments({ losses: 0 });
    const usersWithZeroMatches = await User.countDocuments({ totalMatches: 0 });
    const usersWithZeroPoints = await User.countDocuments({ points: 0 });
    
    console.log(`\n📊 USER STATS VERIFICATION:`);
    console.log(`💰 Users with 100 coins: ${usersWithDefaultCoins}/${userCount}`);
    console.log(`🏆 Users with 0 wins: ${usersWithZeroWins}/${userCount}`);
    console.log(`💔 Users with 0 losses: ${usersWithZeroLosses}/${userCount}`);
    console.log(`📊 Users with 0 matches: ${usersWithZeroMatches}/${userCount}`);
    console.log(`🎯 Users with 0 points: ${usersWithZeroPoints}/${userCount}`);
    
    // Show any problematic users
    const problematicUsers = await User.find({
      $or: [
        { coinBalance: { $ne: 100 } },
        { wins: { $ne: 0 } },
        { losses: { $ne: 0 } },
        { totalMatches: { $ne: 0 } },
        { points: { $ne: 0 } }
      ]
    }).select('username fullName coinBalance wins losses totalMatches points');
    
    if (problematicUsers.length > 0) {
      console.log('\n⚠️  Users with non-reset stats:');
      problematicUsers.forEach(user => {
        console.log(`   - ${user.fullName || user.username}: coins=${user.coinBalance}, wins=${user.wins}, losses=${user.losses}, matches=${user.totalMatches}, points=${user.points}`);
      });
      
      // Fix these users specifically
      console.log('\n🔧 Fixing problematic users...');
      for (const user of problematicUsers) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              coinBalance: 100,
              wins: 0,
              losses: 0,
              totalMatches: 0,
              winRate: 0,
              points: 0
            },
            $unset: {
              ranking: 1,
              lastActive: 1,
              matchHistory: 1,
              tournamentStats: 1
            }
          }
        );
        console.log(`   ✅ Fixed ${user.fullName || user.username}`);
      }
    }
    
    // Final final verification
    console.log('\n🏁 FINAL RESULTS:');
    console.log('='.repeat(40));
    
    const finalPaymentCount = await Payment.countDocuments();
    const finalReservationCount = await Reservation.countDocuments();
    const finalPollCount = await Poll.countDocuments();
    const finalCoinTransactionCount = await CoinTransaction.countDocuments();
    const finalUsersWithDefaultCoins = await User.countDocuments({ coinBalance: 100 });
    const finalUsersWithZeroStats = await User.countDocuments({ 
      wins: 0, 
      losses: 0, 
      totalMatches: 0, 
      points: 0 
    });
    
    const perfectCleanup = (
      finalPaymentCount === 0 &&
      finalReservationCount === 0 &&
      finalPollCount === 0 &&
      finalCoinTransactionCount === 0 &&
      finalUsersWithDefaultCoins === userCount &&
      finalUsersWithZeroStats === userCount
    );
    
    if (perfectCleanup) {
      console.log('🎉 PERFECT CLEANUP ACHIEVED!');
      console.log('   ✅ All transactional data: DELETED');
      console.log('   ✅ All user stats: RESET');
      console.log('   ✅ All coin balances: 100');
      console.log('   ✅ Database: READY FOR FRESH DATA');
    } else {
      console.log('❌ CLEANUP INCOMPLETE - Issues remain');
    }
    
  } catch (error) {
    console.error('❌ Error during thorough cleanup:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config();
thoroughCleanup();