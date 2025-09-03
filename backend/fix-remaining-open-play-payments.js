const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;

async function fixRemainingOpenPlayPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔧 FIXING REMAINING OPEN PLAY PAYMENTS');
    console.log('='.repeat(60));
    
    // Find all pending Open Play payments
    const pendingOpenPlayPayments = await Payment.find({
      status: 'pending',
      pollId: { $exists: true, $ne: null },
      description: { $regex: /Open Play/i }
    });
    
    console.log(`📊 Found ${pendingOpenPlayPayments.length} pending Open Play payments\n`);
    
    if (pendingOpenPlayPayments.length === 0) {
      console.log('✅ No pending Open Play payments found - system is already clean!');
      return;
    }
    
    console.log('🔄 FIXING PAYMENTS:');
    console.log('='.repeat(40));
    
    let fixedCount = 0;
    
    for (const payment of pendingOpenPlayPayments) {
      try {
        console.log(`\n💳 Fixing payment ${payment._id}`);
        console.log(`   User ID: ${payment.userId}`);
        console.log(`   Amount: ₱${payment.amount}`);
        console.log(`   Description: ${payment.description}`);
        console.log(`   Created: ${payment.createdAt}`);
        
        // Update payment to completed with payment date
        payment.status = 'completed';
        payment.paymentDate = new Date();
        
        await payment.save();
        
        console.log(`   ✅ Status: ${payment.status}`);
        console.log(`   ✅ Payment Date: ${payment.paymentDate}`);
        
        fixedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error fixing payment ${payment._id}:`, error.message);
      }
    }
    
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(40));
    console.log(`✅ Successfully fixed: ${fixedCount} payments`);
    console.log(`❌ Failed to fix: ${pendingOpenPlayPayments.length - fixedCount} payments`);
    
    if (fixedCount === pendingOpenPlayPayments.length) {
      console.log('\n🎉 ALL OPEN PLAY PAYMENTS FIXED!');
      console.log('   • All Open Play payments now have "completed" status');
      console.log('   • All Open Play payments now have payment dates');
      console.log('   • Payment system is now fully operational');
    } else {
      console.log('\n⚠️  Some payments could not be fixed - manual intervention may be needed');
    }
    
    // Verify the fix
    console.log('\n🔍 VERIFICATION:');
    console.log('='.repeat(40));
    
    const remainingPendingOpenPlay = await Payment.countDocuments({
      status: 'pending',
      pollId: { $exists: true, $ne: null },
      description: { $regex: /Open Play/i }
    });
    
    const totalCompletedOpenPlay = await Payment.countDocuments({
      status: 'completed',
      pollId: { $exists: true, $ne: null },
      description: { $regex: /Open Play/i }
    });
    
    console.log(`📊 Remaining Pending Open Play Payments: ${remainingPendingOpenPlay}`);
    console.log(`✅ Total Completed Open Play Payments: ${totalCompletedOpenPlay}`);
    
    if (remainingPendingOpenPlay === 0) {
      console.log('🎯 SUCCESS: No pending Open Play payments remain!');
    } else {
      console.log(`⚠️  WARNING: ${remainingPendingOpenPlay} Open Play payments are still pending`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
fixRemainingOpenPlayPayments();