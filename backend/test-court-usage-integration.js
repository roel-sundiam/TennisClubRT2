const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const CourtUsageReport = require('./dist/models/CourtUsageReport.js').default;
const User = require('./dist/models/User.js').default;

// Load environment variables
require('dotenv').config();

async function testCourtUsageIntegration() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find a user to use for testing (find a member)
    const testUser = await User.findOne({ role: 'member', isActive: true, isApproved: true });
    if (!testUser) {
      console.error('❌ No active approved member found for testing');
      process.exit(1);
    }
    
    console.log(`👤 Using test user: ${testUser.fullName} (${testUser._id})`);

    // Check current court usage for this member
    const currentUsage = await CourtUsageReport.findOne({ 
      memberName: testUser.fullName, 
      year: 2025 
    });
    
    console.log('📊 Current court usage:', currentUsage ? {
      memberName: currentUsage.memberName,
      september: currentUsage.september,
      totalAmount: currentUsage.totalAmount
    } : 'No record found');

    // Create a test payment for September 2025
    const testPayment = new Payment({
      userId: testUser._id,
      amount: 100,
      currency: 'PHP',
      paymentMethod: 'cash',
      status: 'completed',
      dueDate: new Date(),
      paymentDate: new Date('2025-09-08'), // September payment
      description: 'Test court usage payment for integration testing',
      metadata: {
        courtUsageDate: new Date('2025-09-08'),
        isManualPayment: true,
        playerNames: [testUser.fullName]
      }
    });

    await testPayment.save();
    console.log(`💰 Created test payment: ${testPayment._id} for ₱${testPayment.amount}`);

    // Simulate the recordPayment function - update status to 'record'
    testPayment.status = 'record';
    testPayment.recordedBy = testUser._id; // Self-record for testing
    testPayment.recordedAt = new Date();
    await testPayment.save();

    console.log('📝 Payment marked as recorded, triggering court usage update...');

    // Now manually trigger the updateCourtUsageReport function
    // (This simulates what happens in the recordPayment controller)
    await testPayment.populate('userId', 'fullName');
    
    const memberName = testPayment.userId.fullName;
    const usageDate = testPayment.metadata?.courtUsageDate || testPayment.paymentDate || new Date();
    const month = new Date(usageDate).getMonth(); // 8 for September
    const year = new Date(usageDate).getFullYear();
    
    const monthFields = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthField = monthFields[month];
    
    console.log(`📊 Updating ${memberName}'s ${monthField} ${year} court usage with ₱${testPayment.amount}`);
    
    // Find or create the member's court usage record
    let courtUsageRecord = await CourtUsageReport.findOne({ 
      memberName: memberName,
      year: year
    });
    
    if (!courtUsageRecord) {
      courtUsageRecord = new CourtUsageReport({
        memberName: memberName,
        year: year
      });
      courtUsageRecord[monthField] = testPayment.amount;
      console.log(`📊 Created new court usage record for ${memberName} (${year})`);
    } else {
      const currentAmount = courtUsageRecord[monthField] || 0;
      courtUsageRecord[monthField] = currentAmount + testPayment.amount;
      console.log(`📊 Updated ${memberName}'s ${monthField} from ₱${currentAmount} to ₱${currentAmount + testPayment.amount}`);
    }
    
    await courtUsageRecord.save();
    console.log(`✅ Court usage report updated successfully`);

    // Check the updated court usage
    const updatedUsage = await CourtUsageReport.findOne({ 
      memberName: testUser.fullName, 
      year: 2025 
    });
    
    console.log('📊 Updated court usage:', {
      memberName: updatedUsage.memberName,
      september: updatedUsage.september,
      totalAmount: updatedUsage.totalAmount
    });

    // Test the reverse operation - unrecord the payment
    console.log('\n🔄 Testing unrecord operation...');
    
    testPayment.status = 'completed';
    testPayment.recordedBy = undefined;
    testPayment.recordedAt = undefined;
    await testPayment.save();
    
    console.log('📝 Payment unrecorded, triggering court usage subtraction...');
    
    // Simulate the subtractFromCourtUsageReport function
    if (updatedUsage) {
      const currentAmount = updatedUsage[monthField] || 0;
      const newAmount = Math.max(0, currentAmount - testPayment.amount);
      updatedUsage[monthField] = newAmount;
      await updatedUsage.save();
      console.log(`📊 Subtracted from ${memberName}'s ${monthField} from ₱${currentAmount} to ₱${newAmount}`);
    }

    // Check final court usage
    const finalUsage = await CourtUsageReport.findOne({ 
      memberName: testUser.fullName, 
      year: 2025 
    });
    
    console.log('📊 Final court usage:', {
      memberName: finalUsage.memberName,
      september: finalUsage.september,
      totalAmount: finalUsage.totalAmount
    });

    // Clean up - delete test payment
    await Payment.findByIdAndDelete(testPayment._id);
    console.log('🧹 Cleaned up test payment');

    console.log('\n✅ Court usage integration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testCourtUsageIntegration();