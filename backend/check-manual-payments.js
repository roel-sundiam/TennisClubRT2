const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({}, { strict: false });
const Payment = mongoose.model('Payment', paymentSchema);

async function checkPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sundiam:ZC6PhtAFekit6TNK@cluster0.fvstb.mongodb.net/tennis-club?retryWrites=true&w=majority');
    
    console.log('Finding manual payments...\n');
    
    const manualPayments = await Payment.find({
      'metadata.isManualPayment': true
    }).populate('userId', 'fullName username').lean();
    
    console.log(`Found ${manualPayments.length} manual payments:\n`);
    
    for (const payment of manualPayments) {
      console.log('Payment ID:', payment._id);
      console.log('User:', payment.userId?.fullName);
      console.log('Amount:', payment.amount);
      console.log('Status:', payment.status);
      console.log('Description:', payment.description);
      console.log('Metadata:', JSON.stringify(payment.metadata, null, 2));
      console.log('---\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPayments();
