const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const User = require('./dist/models/User.js').default;
const Poll = require('./dist/models/Poll.js').default;

async function fixRoelPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find RoelSundiam user
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ RoelSundiam user not found');
      return;
    }
    console.log(`👤 Found user: ${user.fullName} (ID: ${user._id})`);
    
    // Find the September 1 500 Open Play poll
    const poll = await Poll.findOne({ 
      title: 'September 1 500 Open Play',
      'metadata.category': 'open_play' 
    });
    
    if (!poll) {
      console.log('❌ September 1 500 Open Play event not found');
      return;
    }
    console.log(`🏆 Found poll: ${poll.title} (ID: ${poll._id})`);
    
    // Find the pending payment for this Open Play event
    const pendingPayment = await Payment.findOne({
      userId: user._id,
      pollId: poll._id,
      status: 'pending'
    });
    
    if (!pendingPayment) {
      console.log('❌ No pending payment found for this Open Play event');
      return;
    }
    
    console.log('🔄 FIXING PAYMENT STATUS:');
    console.log('='.repeat(50));
    console.log(`💰 Payment ID: ${pendingPayment._id}`);
    console.log(`📊 Current Status: ${pendingPayment.status}`);
    console.log(`💳 Amount: ₱${pendingPayment.amount}`);
    console.log(`📅 Created: ${pendingPayment.createdAt}`);
    console.log(`💸 Payment Date: ${pendingPayment.paymentDate || 'None'}`);
    
    // Fix the payment by setting it to completed
    pendingPayment.status = 'completed';
    pendingPayment.paymentDate = new Date();
    
    await pendingPayment.save();
    
    console.log('\n✅ PAYMENT FIXED SUCCESSFULLY:');
    console.log('='.repeat(50));
    console.log(`📊 New Status: ${pendingPayment.status}`);
    console.log(`💸 Payment Date: ${pendingPayment.paymentDate}`);
    console.log(`🎟️ Reference: ${pendingPayment.referenceNumber}`);
    
    // Verify the fix
    const verifiedPayment = await Payment.findById(pendingPayment._id);
    console.log('\n🔍 VERIFICATION:');
    console.log('='.repeat(50));
    console.log(`✅ Status in database: ${verifiedPayment.status}`);
    console.log(`✅ Payment date set: ${verifiedPayment.paymentDate ? 'YES' : 'NO'}`);
    console.log(`✅ Amount correct: ₱${verifiedPayment.amount} (expected: ₱${poll.openPlayEvent.playerFee})`);
    
    if (verifiedPayment.status === 'completed' && verifiedPayment.paymentDate && verifiedPayment.amount === poll.openPlayEvent.playerFee) {
      console.log('\n🎉 SUCCESS: Roel Sundiam\'s payment is now properly completed!');
    } else {
      console.log('\n❌ ISSUE: Payment fix may not have worked completely');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
fixRoelPayment();