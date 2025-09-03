const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;

async function completePayment() {
  try {
    await mongoose.connect('mongodb+srv://admin:Helenbot04117777!1@mydb.zxr9i5k.mongodb.net/TennisClubRT2?retryWrites=true&w=majority&appName=MyDB');
    console.log('✅ Connected to MongoDB');
    
    // Find the most recent pending payment for RoelSundiam
    const payment = await Payment.findOne({ 
      referenceNumber: 'TC-1755994392010-VW1SAT' // Most recent payment
    });
    
    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }
    
    console.log('📋 Found payment:', payment.referenceNumber);
    console.log('💰 Amount:', payment.amount);
    console.log('📊 Current status:', payment.status);
    
    // Mark as completed
    payment.status = 'completed';
    payment.paymentDate = new Date();
    await payment.save();
    
    console.log('✅ Payment marked as completed');
    console.log('📅 Payment date set to:', payment.paymentDate);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completePayment();