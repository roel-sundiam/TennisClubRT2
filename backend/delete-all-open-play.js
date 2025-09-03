require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas directly since we need to handle ES modules
const { Schema, model } = mongoose;

// Define models inline to avoid import issues
const pollSchema = new Schema({}, { strict: false });
const paymentSchema = new Schema({}, { strict: false });
const creditTransactionSchema = new Schema({}, { strict: false });

let Poll, Payment, CreditTransaction;

async function deleteAllOpenPlayRecords() {
  try {
    console.log('🗑️  Starting deletion of all Open Play records...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Initialize models
    Poll = mongoose.model('Poll', pollSchema);
    Payment = mongoose.model('Payment', paymentSchema);
    CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      console.log('🔍 Finding all Open Play polls...');
      
      // Find all Open Play polls
      const openPlayPolls = await Poll.find({
        'metadata.category': 'open_play'
      }).session(session);
      
      console.log(`📋 Found ${openPlayPolls.length} Open Play polls`);
      
      if (openPlayPolls.length === 0) {
        console.log('ℹ️  No Open Play records found to delete');
        return;
      }
      
      // Extract poll IDs for payment cleanup
      const pollIds = openPlayPolls.map(poll => poll._id.toString());
      
      console.log('🔍 Finding associated payments...');
      
      // Find all payments associated with these polls
      const openPlayPayments = await Payment.find({
        pollId: { $in: pollIds }
      }).session(session);
      
      console.log(`💳 Found ${openPlayPayments.length} Open Play payments`);
      
      // Find credit transactions related to open play
      console.log('🔍 Finding associated credit transactions...');
      const openPlayCreditTransactions = await CreditTransaction.find({
        $or: [
          { 'metadata.referenceType': 'poll', 'metadata.referenceId': { $in: pollIds } },
          { 'metadata.source': 'open_play_participation' },
          { description: { $regex: /open play/i } }
        ]
      }).session(session);
      
      console.log(`💰 Found ${openPlayCreditTransactions.length} Open Play credit transactions`);
      
      // Delete operations
      console.log('🗑️  Deleting credit transactions...');
      const deletedCreditTransactions = await CreditTransaction.deleteMany({
        $or: [
          { 'metadata.referenceType': 'poll', 'metadata.referenceId': { $in: pollIds } },
          { 'metadata.source': 'open_play_participation' },
          { description: { $regex: /open play/i } }
        ]
      }).session(session);
      
      console.log('🗑️  Deleting payments...');
      const deletedPayments = await Payment.deleteMany({
        pollId: { $in: pollIds }
      }).session(session);
      
      console.log('🗑️  Deleting Open Play polls...');
      const deletedPolls = await Poll.deleteMany({
        'metadata.category': 'open_play'
      }).session(session);
      
      // Summary
      console.log('\n📊 DELETION SUMMARY:');
      console.log(`✅ Deleted ${deletedPolls.deletedCount} Open Play polls`);
      console.log(`✅ Deleted ${deletedPayments.deletedCount} Open Play payments`);
      console.log(`✅ Deleted ${deletedCreditTransactions.deletedCount} Open Play credit transactions`);
      console.log('\n🎾 All Open Play records have been successfully deleted!');
    });
    
    await session.endSession();
    
  } catch (error) {
    console.error('❌ Error deleting Open Play records:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  deleteAllOpenPlayRecords()
    .then(() => {
      console.log('✨ Open Play cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Open Play cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = deleteAllOpenPlayRecords;