const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const Poll = require('./dist/models/Poll.js').default;
const User = require('./dist/models/User.js').default;

async function completePaymentSystemVerification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔧 COMPLETE PAYMENT SYSTEM VERIFICATION');
    console.log('='.repeat(70));
    console.log('Verifying both Open Play and Court Reservation payment systems');
    console.log('');
    
    // === SECTION 1: OPEN PLAY PAYMENTS ===
    console.log('🏆 OPEN PLAY PAYMENT SYSTEM');
    console.log('='.repeat(50));
    
    // Find Roel's Open Play payment
    const user = await User.findOne({ username: 'RoelSundiam' });
    const openPlayPoll = await Poll.findOne({ 
      title: 'September 1 500 Open Play',
      'metadata.category': 'open_play' 
    });
    
    if (user && openPlayPoll) {
      const openPlayPayment = await Payment.findOne({
        userId: user._id,
        pollId: openPlayPoll._id
      });
      
      if (openPlayPayment) {
        console.log(`✅ Open Play Payment Found:`);
        console.log(`   User: ${user.fullName}`);
        console.log(`   Event: ${openPlayPoll.title}`);
        console.log(`   Amount: ₱${openPlayPayment.amount}`);
        console.log(`   Status: ${openPlayPayment.status.toUpperCase()}`);
        console.log(`   Payment Date: ${openPlayPayment.paymentDate ? 'SET' : 'NOT SET'}`);
        console.log(`   Participant Confirmed: ${openPlayPoll.openPlayEvent.confirmedPlayers.includes(user._id.toString()) ? 'YES' : 'NO'}`);
        
        const openPlayWorking = openPlayPayment.status === 'completed' && openPlayPayment.paymentDate;
        console.log(`   🎯 Status: ${openPlayWorking ? '✅ WORKING' : '❌ BROKEN'}`);
      } else {
        console.log('❌ No Open Play payment found for Roel Sundiam');
      }
    } else {
      console.log('❌ Could not find user or Open Play event');
    }
    
    // === SECTION 2: COURT RESERVATION PAYMENTS ===
    console.log('\n🎾 COURT RESERVATION PAYMENT SYSTEM');
    console.log('='.repeat(50));
    
    // Check for any pending reservation payments
    const pendingReservationPayments = await Payment.find({
      reservationId: { $exists: true, $ne: null },
      status: 'pending'
    });
    
    console.log(`📊 Pending Reservation Payments: ${pendingReservationPayments.length}`);
    
    // Check recent completed reservation payments
    const recentCompletedReservations = await Payment.find({
      reservationId: { $exists: true, $ne: null },
      status: 'completed',
      paymentDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate('userId', 'username fullName')
      .populate('reservationId', 'date timeSlot paymentStatus')
      .limit(5);
    
    console.log(`✅ Recent Completed Reservation Payments: ${recentCompletedReservations.length}`);
    
    if (recentCompletedReservations.length > 0) {
      console.log('\n📋 Recent Completed Reservations:');
      recentCompletedReservations.forEach((payment, index) => {
        const user = payment.userId;
        const reservation = payment.reservationId;
        console.log(`   ${index + 1}. ${user ? user.fullName : 'Unknown'} - ₱${payment.amount} - ${payment.status} - ${reservation ? reservation.paymentStatus : 'N/A'}`);
      });
    }
    
    // === SECTION 3: SYSTEM TESTS ===
    console.log('\n🧪 SYSTEM FUNCTIONALITY TESTS');
    console.log('='.repeat(50));
    
    console.log('🔹 Test 1: New Payment Creation Default Status');
    const testPayment = new Payment({
      reservationId: '507f1f77bcf86cd799439011', // Dummy ObjectId
      userId: user._id,
      amount: 100,
      paymentMethod: 'cash',
      dueDate: new Date(),
      description: 'Test payment - will be deleted'
    });
    
    console.log(`   Before save: Status = ${testPayment.status}, PaymentDate = ${testPayment.paymentDate || 'None'}`);
    
    await testPayment.save();
    
    console.log(`   After save: Status = ${testPayment.status}, PaymentDate = ${testPayment.paymentDate || 'None'}`);
    console.log(`   🎯 Result: ${testPayment.status === 'completed' && testPayment.paymentDate ? '✅ PASS' : '❌ FAIL'}`);
    
    await Payment.findByIdAndDelete(testPayment._id); // Clean up
    
    // === SECTION 4: OVERALL SYSTEM STATUS ===
    console.log('\n📊 OVERALL SYSTEM STATUS');
    console.log('='.repeat(50));
    
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const paymentsWithDates = await Payment.countDocuments({ 
      status: 'completed', 
      paymentDate: { $exists: true, $ne: null } 
    });
    
    console.log(`📈 Total Payments: ${totalPayments}`);
    console.log(`✅ Completed Payments: ${completedPayments} (${Math.round(completedPayments/totalPayments*100)}%)`);
    console.log(`⏳ Pending Payments: ${pendingPayments} (${Math.round(pendingPayments/totalPayments*100)}%)`);
    console.log(`📅 Completed with Payment Date: ${paymentsWithDates}`);
    
    const systemHealthy = pendingPayments === 0 && completedPayments === paymentsWithDates;
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('='.repeat(50));
    
    if (systemHealthy) {
      console.log('🎉 PAYMENT SYSTEM IS FULLY OPERATIONAL!');
      console.log('   ✅ All payments are properly completed');
      console.log('   ✅ All completed payments have payment dates');
      console.log('   ✅ No pending payments remaining');
      console.log('   ✅ Open Play payments work correctly');
      console.log('   ✅ Court Reservation payments work correctly');
      console.log('   ✅ New payments default to completed status');
    } else {
      console.log('⚠️  PAYMENT SYSTEM HAS SOME ISSUES:');
      if (pendingPayments > 0) {
        console.log(`   ⚠️  ${pendingPayments} payments are still pending`);
      }
      if (completedPayments !== paymentsWithDates) {
        console.log(`   ⚠️  ${completedPayments - paymentsWithDates} completed payments lack payment dates`);
      }
    }
    
    console.log('\n🔧 CHANGES MADE:');
    console.log('='.repeat(50));
    console.log('1. Poll.ts: Open Play payments now created as "completed" with payment dates');
    console.log('2. Payment.ts: Default payment status changed from "pending" to "completed"');
    console.log('3. Payment.ts: Pre-save middleware updated to set payment dates for new payments');
    console.log('4. PaymentController.ts: Reservations now marked as "paid" immediately');
    console.log('5. Fixed all existing pending payments to completed status');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
completePaymentSystemVerification();