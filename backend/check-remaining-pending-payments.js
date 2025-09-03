const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;

async function checkRemainingPendingPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 CHECKING REMAINING PENDING PAYMENTS');
    console.log('='.repeat(60));
    
    // Find all pending payments
    const pendingPayments = await Payment.find({
      status: 'pending'
    });
    
    console.log(`📊 Found ${pendingPayments.length} pending payments\n`);
    
    for (const payment of pendingPayments) {
      console.log(`💳 Payment ID: ${payment._id}`);
      console.log(`👤 User ID: ${payment.userId}`);
      console.log(`💰 Amount: ₱${payment.amount}`);
      console.log(`💳 Payment Method: ${payment.paymentMethod}`);
      console.log(`📝 Description: ${payment.description}`);
      console.log(`📅 Created: ${payment.createdAt}`);
      console.log(`📋 Type: ${payment.reservationId ? 'COURT RESERVATION' : payment.pollId ? 'OPEN PLAY EVENT' : 'OTHER'}`);
      
      if (payment.reservationId) {
        console.log(`🎾 Reservation ID: ${payment.reservationId}`);
      } else if (payment.pollId) {
        console.log(`🏆 Poll ID: ${payment.pollId}`);
      }
      
      console.log(`🎟️ Reference: ${payment.referenceNumber}`);
      console.log('---');
    }
    
    // Categorize the pending payments
    const reservationPayments = pendingPayments.filter(p => p.reservationId);
    const openPlayPayments = pendingPayments.filter(p => p.pollId);
    const otherPayments = pendingPayments.filter(p => !p.reservationId && !p.pollId);
    
    console.log('\n📊 CATEGORIZATION:');
    console.log('='.repeat(60));
    console.log(`🎾 Court Reservation Payments: ${reservationPayments.length}`);
    console.log(`🏆 Open Play Event Payments: ${openPlayPayments.length}`);
    console.log(`❓ Other Payments: ${otherPayments.length}`);
    
    console.log('\n🔍 ANALYSIS:');
    console.log('='.repeat(60));
    
    if (reservationPayments.length > 0) {
      console.log('⚠️  Court reservation payments should be automatically completed!');
      console.log('   These need to be fixed.');
    }
    
    if (openPlayPayments.length > 0) {
      console.log('⚠️  Open Play event payments should be automatically completed!');
      console.log('   These need to be fixed.');
    }
    
    if (otherPayments.length > 0) {
      console.log('ℹ️  Other payments might be coin purchases or admin-approval required payments.');
      console.log('   These might be correctly pending.');
      
      // Check if these are coin purchase payments
      const coinPayments = otherPayments.filter(p => 
        p.description && p.description.toLowerCase().includes('coin')
      );
      
      if (coinPayments.length > 0) {
        console.log(`   💰 ${coinPayments.length} appear to be coin purchase payments (correctly pending)`);
      }
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (reservationPayments.length > 0 || openPlayPayments.length > 0) {
      const needFixing = reservationPayments.length + openPlayPayments.length;
      console.log(`🔧 Fix ${needFixing} reservation/event payments that should be completed`);
      console.log('   These payments were likely created before the system fix');
    }
    
    if (otherPayments.length > 0) {
      console.log(`ℹ️  Review ${otherPayments.length} other payments to determine if they should remain pending`);
      console.log('   (e.g., coin purchases requiring admin approval)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
checkRemainingPendingPayments();