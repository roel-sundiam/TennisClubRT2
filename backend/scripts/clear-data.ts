import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Reservation from '../src/models/Reservation';
import Payment from '../src/models/Payment';
import Poll from '../src/models/Poll';
import SeedingPoint from '../src/models/SeedingPoint';
import { PageView, UserActivity, SessionInfo } from '../src/models/Analytics';
import CoinTransaction from '../src/models/CoinTransaction';
import CreditTransaction from '../src/models/CreditTransaction';
import User from '../src/models/User';
import Suggestion from '../src/models/Suggestion';
import { PushSubscription } from '../src/models/PushSubscription';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

interface ClearStats {
  reservations: number;
  payments: number;
  openPlayPolls: number;
  seedingPoints: number;
  pageViews: number;
  userActivities: number;
  sessionInfos: number;
  coinTransactions: number;
  creditTransactions: number;
  usersReset: number;
  suggestions: number;
  pushSubscriptions: number;
}

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function clearCourtReservations(): Promise<number> {
  console.log('🏆 Clearing court reservations...');
  const result = await Reservation.deleteMany({});
  console.log(`   Deleted ${result.deletedCount} reservations`);
  return result.deletedCount;
}

async function clearPayments(): Promise<number> {
  console.log('💰 Clearing payments...');
  const result = await Payment.deleteMany({});
  console.log(`   Deleted ${result.deletedCount} payments`);
  return result.deletedCount;
}

async function clearOpenPlayPolls(): Promise<number> {
  console.log('🎾 Clearing open play polls...');
  const result = await Poll.deleteMany({
    'metadata.category': 'open_play'
  });
  console.log(`   Deleted ${result.deletedCount} open play polls`);
  return result.deletedCount;
}

async function clearRankingPoints(): Promise<number> {
  console.log('🏅 Clearing ranking points...');
  const result = await SeedingPoint.deleteMany({});
  console.log(`   Deleted ${result.deletedCount} seeding point records`);
  return result.deletedCount;
}

async function clearAnalytics(): Promise<{ pageViews: number; userActivities: number; sessionInfos: number }> {
  console.log('📊 Clearing site analytics...');
  
  const pageViewsResult = await PageView.deleteMany({});
  console.log(`   Deleted ${pageViewsResult.deletedCount} page views`);
  
  const userActivitiesResult = await UserActivity.deleteMany({});
  console.log(`   Deleted ${userActivitiesResult.deletedCount} user activities`);
  
  const sessionInfosResult = await SessionInfo.deleteMany({});
  console.log(`   Deleted ${sessionInfosResult.deletedCount} session infos`);
  
  return {
    pageViews: pageViewsResult.deletedCount,
    userActivities: userActivitiesResult.deletedCount,
    sessionInfos: sessionInfosResult.deletedCount
  };
}

async function clearTransactions(): Promise<{ coinTransactions: number; creditTransactions: number }> {
  console.log('💳 Clearing transaction history...');
  
  const coinResult = await CoinTransaction.deleteMany({});
  console.log(`   Deleted ${coinResult.deletedCount} coin transactions`);
  
  const creditResult = await CreditTransaction.deleteMany({});
  console.log(`   Deleted ${creditResult.deletedCount} credit transactions`);
  
  return {
    coinTransactions: coinResult.deletedCount,
    creditTransactions: creditResult.deletedCount
  };
}

async function resetUserStats(): Promise<number> {
  console.log('👤 Resetting user statistics and balances...');
  
  const result = await User.updateMany(
    {},
    {
      $set: {
        matchesWon: 0,
        matchesPlayed: 0,
        seedPoints: 0,
        coinBalance: parseInt(process.env.INITIAL_COIN_BALANCE || '100'),
        creditBalance: 0
      }
    }
  );
  
  console.log(`   Reset statistics for ${result.modifiedCount} users`);
  return result.modifiedCount;
}

async function clearSupportingData(): Promise<{ suggestions: number; pushSubscriptions: number }> {
  console.log('📝 Clearing supporting data...');
  
  const suggestionsResult = await Suggestion.deleteMany({});
  console.log(`   Deleted ${suggestionsResult.deletedCount} suggestions`);
  
  const pushSubscriptionsResult = await PushSubscription.deleteMany({});
  console.log(`   Deleted ${pushSubscriptionsResult.deletedCount} push subscriptions`);
  
  return {
    suggestions: suggestionsResult.deletedCount,
    pushSubscriptions: pushSubscriptionsResult.deletedCount
  };
}

async function clearAllData(forceConfirm: boolean = false): Promise<void> {
  console.log('\n🚨 DATA CLEARING OPERATION 🚨');
  console.log('================================\n');
  
  console.log('This will permanently delete the following data:');
  console.log('• All court reservations');
  console.log('• All payments');
  console.log('• All open play polls');
  console.log('• All ranking/seeding points');
  console.log('• All site analytics (page views, activities, sessions)');
  console.log('• All transaction history (coins & credits)');
  console.log('• Reset user match statistics and balances');
  console.log('• All suggestions and push subscriptions');
  console.log('\nUser accounts and core settings will be preserved.\n');
  
  if (!forceConfirm) {
    const confirmed = await askConfirmation('Are you absolutely sure you want to proceed? (yes/no): ');
    
    if (!confirmed) {
      console.log('❌ Operation cancelled');
      return;
    }
    
    const doubleConfirm = await askConfirmation('This action cannot be undone. Type "yes" to confirm: ');
    
    if (!doubleConfirm) {
      console.log('❌ Operation cancelled');
      return;
    }
  } else {
    console.log('⚠️ Force confirmation mode - proceeding without interactive prompts...');
  }
  
  console.log('\n🔄 Starting data clearing operation...\n');
  
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const stats: ClearStats = {
        reservations: 0,
        payments: 0,
        openPlayPolls: 0,
        seedingPoints: 0,
        pageViews: 0,
        userActivities: 0,
        sessionInfos: 0,
        coinTransactions: 0,
        creditTransactions: 0,
        usersReset: 0,
        suggestions: 0,
        pushSubscriptions: 0
      };
      
      // Clear all data types
      stats.reservations = await clearCourtReservations();
      stats.payments = await clearPayments();
      stats.openPlayPolls = await clearOpenPlayPolls();
      stats.seedingPoints = await clearRankingPoints();
      
      const analyticsStats = await clearAnalytics();
      stats.pageViews = analyticsStats.pageViews;
      stats.userActivities = analyticsStats.userActivities;
      stats.sessionInfos = analyticsStats.sessionInfos;
      
      const transactionStats = await clearTransactions();
      stats.coinTransactions = transactionStats.coinTransactions;
      stats.creditTransactions = transactionStats.creditTransactions;
      
      stats.usersReset = await resetUserStats();
      
      const supportingStats = await clearSupportingData();
      stats.suggestions = supportingStats.suggestions;
      stats.pushSubscriptions = supportingStats.pushSubscriptions;
      
      // Summary
      console.log('\n✅ DATA CLEARING COMPLETED');
      console.log('==========================');
      console.log(`🏆 Reservations: ${stats.reservations}`);
      console.log(`💰 Payments: ${stats.payments}`);
      console.log(`🎾 Open Play Polls: ${stats.openPlayPolls}`);
      console.log(`🏅 Seeding Points: ${stats.seedingPoints}`);
      console.log(`📊 Page Views: ${stats.pageViews}`);
      console.log(`👥 User Activities: ${stats.userActivities}`);
      console.log(`🔐 Session Infos: ${stats.sessionInfos}`);
      console.log(`🪙 Coin Transactions: ${stats.coinTransactions}`);
      console.log(`💳 Credit Transactions: ${stats.creditTransactions}`);
      console.log(`👤 Users Reset: ${stats.usersReset}`);
      console.log(`📝 Suggestions: ${stats.suggestions}`);
      console.log(`🔔 Push Subscriptions: ${stats.pushSubscriptions}`);
      console.log('\nAll user accounts and core settings have been preserved.');
    });
    
    console.log('\n🎉 Operation completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during data clearing:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

async function main(): Promise<void> {
  const forceConfirm = process.argv.includes('--force') || process.argv.includes('-f');
  
  try {
    await connectToDatabase();
    await clearAllData(forceConfirm);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    if (!forceConfirm) {
      rl.close();
    }
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

if (require.main === module) {
  main();
}