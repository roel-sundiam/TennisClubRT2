const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const Poll = require('./dist/models/Poll.js').default;
const CoinTransaction = require('./dist/models/CoinTransaction.js').default;
const CreditTransaction = require('./dist/models/CreditTransaction.js').default;
const User = require('./dist/models/User.js').default;

async function comprehensiveCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🧹 COMPREHENSIVE DATA CLEANUP');
    console.log('='.repeat(70));
    console.log('⚠️  WARNING: This will delete ALL data for:');
    console.log('   • Payments');
    console.log('   • Reservations'); 
    console.log('   • Open Play Events (Polls)');
    console.log('   • Coin Transactions');
    console.log('   • Credit Transactions');
    console.log('   • User rankings/stats (but keep user accounts)');
    console.log('');
    
    // Count existing data before cleanup
    console.log('📊 CURRENT DATA COUNTS:');
    console.log('='.repeat(40));
    
    const paymentCount = await Payment.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const pollCount = await Poll.countDocuments();
    const coinTransactionCount = await CoinTransaction.countDocuments();
    const creditTransactionCount = await CreditTransaction.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`💳 Payments: ${paymentCount}`);
    console.log(`🎾 Reservations: ${reservationCount}`);
    console.log(`🏆 Polls/Events: ${pollCount}`);
    console.log(`🪙 Coin Transactions: ${coinTransactionCount}`);
    console.log(`💰 Credit Transactions: ${creditTransactionCount}`);
    console.log(`👤 Users: ${userCount} (will be preserved)`);
    console.log('');
    
    const totalRecords = paymentCount + reservationCount + pollCount + coinTransactionCount + creditTransactionCount;
    
    if (totalRecords === 0) {
      console.log('✨ Database is already clean - no data to delete!');
      return;
    }
    
    console.log('🗑️  STARTING DATA CLEANUP...');
    console.log('='.repeat(40));
    
    let deletedCounts = {
      payments: 0,
      reservations: 0, 
      polls: 0,
      coinTransactions: 0,
      creditTransactions: 0,
      usersReset: 0
    };
    
    // 1. Delete all payments
    console.log('\n💳 Cleaning Payments...');
    const paymentResult = await Payment.deleteMany({});
    deletedCounts.payments = paymentResult.deletedCount;
    console.log(`   ✅ Deleted ${deletedCounts.payments} payment records`);
    
    // 2. Delete all reservations
    console.log('\n🎾 Cleaning Reservations...');
    const reservationResult = await Reservation.deleteMany({});
    deletedCounts.reservations = reservationResult.deletedCount;
    console.log(`   ✅ Deleted ${deletedCounts.reservations} reservation records`);
    
    // 3. Delete all polls (Open Play events)
    console.log('\n🏆 Cleaning Open Play Events & Polls...');
    const pollResult = await Poll.deleteMany({});
    deletedCounts.polls = pollResult.deletedCount;
    console.log(`   ✅ Deleted ${deletedCounts.polls} poll/event records`);
    
    // 4. Delete all coin transactions
    console.log('\n🪙 Cleaning Coin Transactions...');
    const coinResult = await CoinTransaction.deleteMany({});
    deletedCounts.coinTransactions = coinResult.deletedCount;
    console.log(`   ✅ Deleted ${deletedCounts.coinTransactions} coin transaction records`);
    
    // 5. Delete all credit transactions
    console.log('\n💰 Cleaning Credit Transactions...');
    const creditResult = await CreditTransaction.deleteMany({});
    deletedCounts.creditTransactions = creditResult.deletedCount;
    console.log(`   ✅ Deleted ${deletedCounts.creditTransactions} credit transaction records`);
    
    // 6. Reset user stats but keep accounts
    console.log('\n👤 Resetting User Stats (keeping accounts)...');
    const userResetResult = await User.updateMany(
      {},
      {
        $set: {
          coinBalance: 100, // Reset to initial balance
          creditBalance: 0, // Reset credit balance
          ranking: null,
          wins: 0,
          losses: 0,
          totalMatches: 0,
          winRate: 0,
          points: 0
        },
        $unset: {
          lastActive: 1,
          matchHistory: 1,
          tournamentStats: 1
        }
      }
    );
    deletedCounts.usersReset = userResetResult.modifiedCount;
    console.log(`   ✅ Reset stats for ${deletedCounts.usersReset} user accounts`);
    
    // Verification
    console.log('\n🔍 VERIFICATION - Final Counts:');
    console.log('='.repeat(40));
    
    const finalPaymentCount = await Payment.countDocuments();
    const finalReservationCount = await Reservation.countDocuments();
    const finalPollCount = await Poll.countDocuments();
    const finalCoinTransactionCount = await CoinTransaction.countDocuments();
    const finalCreditTransactionCount = await CreditTransaction.countDocuments();
    const finalUserCount = await User.countDocuments();
    
    console.log(`💳 Payments: ${finalPaymentCount} (was ${paymentCount})`);
    console.log(`🎾 Reservations: ${finalReservationCount} (was ${reservationCount})`);
    console.log(`🏆 Polls/Events: ${finalPollCount} (was ${pollCount})`);
    console.log(`🪙 Coin Transactions: ${finalCoinTransactionCount} (was ${coinTransactionCount})`);
    console.log(`💰 Credit Transactions: ${finalCreditTransactionCount} (was ${creditTransactionCount})`);
    console.log(`👤 Users: ${finalUserCount} (preserved)`);
    
    // Check if user stats were reset
    const usersWithDefaultCoins = await User.countDocuments({ coinBalance: 100 });
    const usersWithZeroCredits = await User.countDocuments({ creditBalance: 0 });
    const usersWithZeroStats = await User.countDocuments({ 
      wins: 0, 
      losses: 0, 
      totalMatches: 0 
    });
    
    console.log(`🪙 Users with default coin balance (100): ${usersWithDefaultCoins}`);
    console.log(`💰 Users with zero credit balance: ${usersWithZeroCredits}`);
    console.log(`📊 Users with reset stats: ${usersWithZeroStats}`);
    
    console.log('\n📋 CLEANUP SUMMARY:');
    console.log('='.repeat(40));
    console.log(`✅ Payments deleted: ${deletedCounts.payments}`);
    console.log(`✅ Reservations deleted: ${deletedCounts.reservations}`);
    console.log(`✅ Open Play events deleted: ${deletedCounts.polls}`);
    console.log(`✅ Coin transactions deleted: ${deletedCounts.coinTransactions}`);
    console.log(`✅ Credit transactions deleted: ${deletedCounts.creditTransactions}`);
    console.log(`✅ User stats reset: ${deletedCounts.usersReset}`);
    
    const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0) - deletedCounts.usersReset;
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    
    // Final verification
    const allDataClean = (
      finalPaymentCount === 0 && 
      finalReservationCount === 0 && 
      finalPollCount === 0 && 
      finalCoinTransactionCount === 0 && 
      finalCreditTransactionCount === 0
    );
    
    if (allDataClean) {
      console.log('\n🎉 SUCCESS: All data successfully cleaned!');
      console.log('   • Database is now clean and ready for fresh data');
      console.log('   • User accounts preserved with reset stats');
      console.log('   • Coin balances reset to default (100)');
      console.log('   • Credit balances reset to zero (0)');
      console.log('   • All rankings and match history cleared');
      console.log('   • All open play events removed');
    } else {
      console.log('\n⚠️  WARNING: Some data may not have been completely cleaned');
      console.log('   Please check the counts above for any remaining records');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Add confirmation prompt
console.log('⚠️  WARNING: This will permanently delete ALL payments, reservations, open play events, rankings, and credit transactions!');
console.log('📝 User accounts will be preserved but their stats will be reset.');
console.log('');
console.log('🚀 Starting cleanup in 3 seconds...');
console.log('   Press Ctrl+C to cancel now if you changed your mind!');

setTimeout(() => {
  // Load environment variables
  require('dotenv').config();
  comprehensiveCleanup();
}, 3000);