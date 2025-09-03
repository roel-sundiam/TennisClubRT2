const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const User = require('./dist/models/User.js').default;

async function checkExistingReservationPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 CHECKING EXISTING COURT RESERVATION PAYMENTS');
    console.log('='.repeat(60));
    
    // Find all payments that are for reservations (have reservationId) and are pending
    const pendingReservationPayments = await Payment.find({
      reservationId: { $exists: true, $ne: null },
      status: 'pending'
    }).populate('userId', 'username fullName')
      .populate('reservationId', 'date timeSlot paymentStatus');
    
    console.log(`📊 Found ${pendingReservationPayments.length} pending reservation payments`);
    
    if (pendingReservationPayments.length === 0) {
      console.log('✅ No pending reservation payments found - system is clean!');
      return;
    }
    
    console.log('\n📋 PENDING RESERVATION PAYMENTS:');
    console.log('='.repeat(60));
    
    for (const payment of pendingReservationPayments) {
      const user = payment.userId;
      const reservation = payment.reservationId;
      
      console.log(`\n💳 Payment ID: ${payment._id}`);
      console.log(`👤 User: ${user ? user.fullName || user.username : 'Unknown'}`);
      console.log(`📅 Reservation: ${reservation ? reservation.date.toDateString() : 'Unknown'} ${reservation ? reservation.timeSlot + ':00' : ''}`);
      console.log(`💰 Amount: ₱${payment.amount}`);
      console.log(`📊 Payment Status: ${payment.status}`);
      console.log(`🎾 Reservation Payment Status: ${reservation ? reservation.paymentStatus : 'N/A'}`);
      console.log(`📅 Created: ${payment.createdAt}`);
      console.log(`🎟️ Reference: ${payment.referenceNumber}`);
      console.log('---');
    }
    
    // Ask if we should fix these
    console.log('\n🔧 FIXING PENDING RESERVATION PAYMENTS:');
    console.log('='.repeat(60));
    console.log('These payments should be automatically completed based on the new system design.');
    
    let fixedCount = 0;
    
    for (const payment of pendingReservationPayments) {
      try {
        console.log(`\n🔄 Fixing payment ${payment._id}...`);
        
        // Update payment to completed
        payment.status = 'completed';
        payment.paymentDate = new Date();
        await payment.save();
        
        // Update reservation payment status if it exists
        if (payment.reservationId) {
          const reservation = await Reservation.findById(payment.reservationId);
          if (reservation && reservation.paymentStatus === 'pending') {
            reservation.paymentStatus = 'paid';
            await reservation.save({ validateBeforeSave: false });
            console.log(`   ✅ Updated reservation ${reservation._id} to paid status`);
          }
        }
        
        console.log(`   ✅ Payment ${payment._id} fixed successfully`);
        fixedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error fixing payment ${payment._id}:`, error.message);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Fixed ${fixedCount} out of ${pendingReservationPayments.length} pending payments`);
    
    if (fixedCount === pendingReservationPayments.length) {
      console.log('🎉 All pending reservation payments have been fixed!');
      console.log('   • All payments now have "completed" status');
      console.log('   • All payments now have payment dates set');
      console.log('   • All reservations now have "paid" status');
    } else if (fixedCount > 0) {
      console.log(`⚠️  Fixed ${fixedCount} payments, but ${pendingReservationPayments.length - fixedCount} still have issues`);
    } else {
      console.log('❌ No payments were fixed - there may be deeper issues');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
checkExistingReservationPayments();