const mongoose = require('mongoose');
require('dotenv').config();

async function createTestDeposit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Import the actual CreditTransaction model
    const CreditTransaction = mongoose.model('CreditTransaction', new mongoose.Schema({
      userId: { type: String, required: true },
      type: { type: String, enum: ['deposit', 'deduction', 'refund', 'adjustment'], required: true },
      amount: { type: Number, required: true },
      balanceBefore: { type: Number, required: true },
      balanceAfter: { type: Number, required: true },
      description: { type: String, required: true },
      referenceType: String,
      metadata: mongoose.Schema.Types.Mixed,
      status: { type: String, enum: ['pending', 'completed', 'failed', 'reversed', 'recorded'], default: 'completed' },
      processedAt: Date
    }, { timestamps: true }));
    
    // Get RoelSundiam user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const roelUser = await User.findOne({ username: 'RoelSundiam' });
    
    if (!roelUser) {
      console.log('RoelSundiam user not found');
      mongoose.connection.close();
      return;
    }
    
    console.log('Creating test credit deposit for RoelSundiam...');
    
    // Create a test deposit transaction
    const testDeposit = new CreditTransaction({
      userId: roelUser._id.toString(),
      type: 'deposit',
      amount: 500,
      balanceBefore: roelUser.creditBalance || 0,
      balanceAfter: (roelUser.creditBalance || 0) + 500,
      description: 'Credit deposit via bank_transfer - Test deposit',
      referenceType: 'deposit',
      metadata: {
        paymentMethod: 'bank_transfer',
        source: 'user_deposit',
        paymentReference: 'TEST-REF-123'
      },
      status: 'pending' // This should show up in the Credit Purchases tab
    });
    
    await testDeposit.save();
    console.log('Test deposit created successfully!');
    console.log('Transaction ID:', testDeposit._id);
    console.log('Amount: ₱', testDeposit.amount);
    console.log('Status:', testDeposit.status);
    console.log('Payment Method:', testDeposit.metadata.paymentMethod);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test deposit:', error);
  }
}

createTestDeposit();