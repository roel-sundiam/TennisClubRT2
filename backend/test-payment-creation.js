const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;

async function testPaymentCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🧪 TESTING NEW PAYMENT CREATION');
    console.log('='.repeat(50));
    
    // Test creating a new payment without explicitly setting status
    const testPayment = new Payment({
      pollId: '68b378c1ef8af140c9723507', // Using the September 1 Open Play poll ID
      userId: '68a7bd752e91c9d68ec845ab', // Using Roel's user ID
      amount: 150,
      currency: 'PHP',
      paymentMethod: 'cash',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      description: 'Test payment creation'
    });
    
    console.log('💰 Before saving:');
    console.log(`   Status: ${testPayment.status}`);
    console.log(`   Payment Date: ${testPayment.paymentDate || 'None'}`);
    
    await testPayment.save();
    
    console.log('\n💰 After saving:');
    console.log(`   Status: ${testPayment.status}`);
    console.log(`   Payment Date: ${testPayment.paymentDate || 'None'}`);
    console.log(`   Reference: ${testPayment.referenceNumber}`);
    
    // Verify from database
    const savedPayment = await Payment.findById(testPayment._id);
    console.log('\n🔍 Database verification:');
    console.log(`   Status in DB: ${savedPayment.status}`);
    console.log(`   Payment Date in DB: ${savedPayment.paymentDate || 'None'}`);
    
    if (savedPayment.status === 'completed' && savedPayment.paymentDate) {
      console.log('\n✅ SUCCESS: New payments are automatically completed with payment date!');
    } else {
      console.log('\n❌ ISSUE: New payment was not automatically completed');
    }
    
    // Clean up test payment
    await Payment.findByIdAndDelete(testPayment._id);
    console.log('🧹 Test payment cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
testPaymentCreation();