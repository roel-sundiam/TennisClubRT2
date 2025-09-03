const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const Reservation = require('./dist/models/Reservation.js').default;
const User = require('./dist/models/User.js').default;

async function checkPaymentDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TennisClubRT2');
    console.log('✅ Connected to MongoDB');
    
    // Find the completed payment
    const payment = await Payment.findOne({ 
      referenceNumber: 'TC-1755994392010-VW1SAT'
    });
    
    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }
    
    console.log('💳 Payment details:');
    console.log('  ID:', payment._id);
    console.log('  Amount:', payment.amount);
    console.log('  Status:', payment.status);
    console.log('  User ID:', payment.userId);
    console.log('  Reservation ID:', payment.reservationId);
    console.log('  Payment Date:', payment.paymentDate);
    
    // Check if reservation exists
    if (payment.reservationId) {
      const reservation = await Reservation.findById(payment.reservationId);
      if (reservation) {
        console.log('🎾 Linked reservation found:');
        console.log('  Date:', reservation.date);
        console.log('  Time Slot:', reservation.timeSlot);
        console.log('  Players:', reservation.players);
        console.log('  Status:', reservation.status);
      } else {
        console.log('❌ Linked reservation NOT found for ID:', payment.reservationId);
      }
    } else {
      console.log('❌ No reservation ID linked to this payment');
    }
    
    // Check if user exists
    const user = await User.findById(payment.userId);
    if (user) {
      console.log('👤 Linked user found:');
      console.log('  Name:', user.fullName);
      console.log('  Username:', user.username);
    } else {
      console.log('❌ Linked user NOT found for ID:', payment.userId);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPaymentDetails();