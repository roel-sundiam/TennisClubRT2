const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const User = require('./dist/models/User.js').default;

async function checkPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TennisClubRT2');
    console.log('✅ Connected to MongoDB');
    
    // Find RoelSundiam user
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ RoelSundiam user not found');
      return;
    }
    console.log('👤 Found user:', user.fullName, 'ID:', user._id);
    
    // Find all payments for this user
    const payments = await Payment.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log('💳 Total payments found:', payments.length);
    
    payments.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`);
      console.log('  Amount:', payment.amount);
      console.log('  Status:', payment.status);
      console.log('  Method:', payment.paymentMethod);
      console.log('  Created:', payment.createdAt);
      console.log('  Payment Date:', payment.paymentDate);
      console.log('  Reference:', payment.referenceNumber);
      console.log('---');
    });
    
    // Check the date range for the report (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    console.log('📅 Report date range:');
    console.log('  Start:', startDate.toISOString());
    console.log('  End:', endDate.toISOString());
    
    // Check payments in the report date range
    const recentPayments = await Payment.find({ 
      userId: user._id,
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    console.log('📊 Payments in report date range:', recentPayments.length);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPayments();