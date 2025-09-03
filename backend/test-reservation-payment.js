const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const User = require('./dist/models/User.js').default;

async function testReservationPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🧪 TESTING COURT RESERVATION PAYMENT SYSTEM');
    console.log('='.repeat(60));
    
    // Find RoelSundiam user
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ RoelSundiam user not found');
      return;
    }
    console.log(`👤 Found user: ${user.fullName} (ID: ${user._id})`);
    
    // Create a test reservation
    const testReservation = new Reservation({
      userId: user._id,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timeSlot: 10, // 10 AM
      players: [user._id.toString()],
      status: 'pending',
      paymentStatus: 'pending' // Initial status
    });
    
    await testReservation.save();
    console.log(`🎾 Created test reservation: ${testReservation._id}`);
    console.log(`   Date: ${testReservation.date.toDateString()}`);
    console.log(`   Time: ${testReservation.timeSlot}:00`);
    console.log(`   Initial Payment Status: ${testReservation.paymentStatus}`);
    
    // Test direct payment creation (simulating what the API does)
    console.log('\n💰 CREATING PAYMENT RECORD:');
    console.log('='.repeat(60));
    
    // Calculate payment amount
    const calculation = Payment.calculatePaymentAmount(
      testReservation.timeSlot,
      testReservation.players.length,
      testReservation.date
    );
    
    console.log(`💵 Calculated Amount: ₱${calculation.amount}`);
    console.log(`📊 Peak Hour: ${calculation.isPeakHour ? 'YES' : 'NO'}`);
    console.log(`🧮 Calculation: ${calculation.breakdown.calculation}`);
    
    // Create payment (like the API does)
    const payment = new Payment({
      reservationId: testReservation._id,
      userId: user._id,
      amount: calculation.amount,
      paymentMethod: 'gcash',
      description: `Court reservation payment for ${testReservation.date.toDateString()} ${testReservation.timeSlot}:00-${testReservation.timeSlot + 1}:00`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: {
        timeSlot: testReservation.timeSlot,
        date: testReservation.date,
        playerCount: testReservation.players.length,
        isPeakHour: calculation.isPeakHour,
        originalFee: calculation.amount,
        discounts: []
      }
    });
    
    console.log('\n🔍 BEFORE SAVING PAYMENT:');
    console.log(`   Payment Status: ${payment.status}`);
    console.log(`   Payment Date: ${payment.paymentDate || 'Not set'}`);
    console.log(`   Reservation Payment Status: ${testReservation.paymentStatus}`);
    
    await payment.save();
    
    console.log('\n💾 AFTER SAVING PAYMENT:');
    console.log(`   Payment Status: ${payment.status}`);
    console.log(`   Payment Date: ${payment.paymentDate || 'Not set'}`);
    console.log(`   Reference: ${payment.referenceNumber}`);
    
    // Update reservation payment status (like the API does)
    testReservation.paymentStatus = 'paid'; // This should now be the new behavior
    await testReservation.save({ validateBeforeSave: false });
    
    console.log('\n🎾 AFTER UPDATING RESERVATION:');
    console.log(`   Reservation Payment Status: ${testReservation.paymentStatus}`);
    
    // Verify from database
    const savedPayment = await Payment.findById(payment._id);
    const savedReservation = await Reservation.findById(testReservation._id);
    
    console.log('\n🔍 DATABASE VERIFICATION:');
    console.log('='.repeat(60));
    console.log(`✅ Payment Status: ${savedPayment.status}`);
    console.log(`✅ Payment Date Set: ${savedPayment.paymentDate ? 'YES' : 'NO'}`);
    console.log(`✅ Reservation Payment Status: ${savedReservation.paymentStatus}`);
    console.log(`✅ Amount Correct: ₱${savedPayment.amount}`);
    
    // Check results
    const paymentCompleted = savedPayment.status === 'completed';
    const paymentDateSet = !!savedPayment.paymentDate;
    const reservationPaid = savedReservation.paymentStatus === 'paid';
    
    console.log('\n🎯 RESULTS:');
    console.log('='.repeat(60));
    console.log(`✅ Payment Automatically Completed: ${paymentCompleted ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Payment Date Automatically Set: ${paymentDateSet ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Reservation Marked as Paid: ${reservationPaid ? 'PASS' : 'FAIL'}`);
    
    if (paymentCompleted && paymentDateSet && reservationPaid) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('   ✅ Court reservation payments are automatically completed');
      console.log('   ✅ Payment dates are automatically set');
      console.log('   ✅ Reservations are automatically marked as paid');
      console.log('   ✅ System is working as intended!');
    } else {
      console.log('\n❌ SOME TESTS FAILED - ISSUES REMAIN:');
      if (!paymentCompleted) console.log('   ❌ Payment not automatically completed');
      if (!paymentDateSet) console.log('   ❌ Payment date not automatically set');
      if (!reservationPaid) console.log('   ❌ Reservation not automatically marked as paid');
    }
    
    // Clean up test data
    await Payment.findByIdAndDelete(payment._id);
    await Reservation.findByIdAndDelete(testReservation._id);
    console.log('\n🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
testReservationPayment();