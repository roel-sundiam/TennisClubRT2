import mongoose from 'mongoose';
import Payment from '../models/Payment';
import User from '../models/User';
import * as dotenv from 'dotenv';

dotenv.config();

async function createOverduePayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Find LeaNacu user
    const user = await User.findOne({ username: 'LeaNacu' });
    if (!user) {
      console.log('❌ LeaNacu not found');
      process.exit(1);
    }

    console.log('👤 Found user:', user.username, '- ID:', user._id.toString());

    // Check existing payments
    const existingPayments = await Payment.find({ userId: user._id });
    console.log('📊 Existing payments for LeaNacu:', existingPayments.length);

    // Create an overdue payment (due 3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(23, 59, 59, 999);

    const overduePayment = new Payment({
      userId: user._id,
      amount: 100,
      paymentMethod: 'cash',
      status: 'pending',
      dueDate: threeDaysAgo,
      description: 'TEST: Court reservation payment (OVERDUE - for testing)',
      metadata: {
        isTest: true,
        timeSlot: 18,
        playerCount: 2
      }
    });

    await overduePayment.save();
    console.log('✅ Created overdue test payment:');
    console.log('   - Amount: ₱' + overduePayment.amount);
    console.log('   - Due Date:', overduePayment.dueDate.toISOString());
    console.log('   - Days Overdue:', Math.ceil((Date.now() - overduePayment.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    console.log('   - Payment ID:', (overduePayment._id as mongoose.Types.ObjectId).toString());

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createOverduePayment();
