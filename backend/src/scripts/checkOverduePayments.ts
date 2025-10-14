import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import User from '../models/User';

dotenv.config();

async function checkOverduePayments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    // Get user RoelSundiam
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ User RoelSundiam not found');
      process.exit(1);
    }

    console.log(`\n👤 User: ${user.fullName} (${user.username})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 User ID: ${user._id}`);

    // Check for overdue payments (1+ days past due)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(23, 59, 59, 999);

    console.log(`\n⏰ Current date: ${new Date().toISOString()}`);
    console.log(`⏰ One day ago cutoff: ${oneDayAgo.toISOString()}`);

    // Check Payment collection for pending overdue payments
    const overduePayments = await Payment.find({
      userId: user._id,
      status: 'pending',
      dueDate: { $lt: oneDayAgo }
    }).lean();

    console.log(`\n💰 Found ${overduePayments.length} overdue Payment records:`);

    if (overduePayments.length > 0) {
      overduePayments.forEach((payment: any, index: number) => {
        const daysOverdue = Math.ceil((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`\n${index + 1}. Payment ID: ${payment._id}`);
        console.log(`   Amount: ₱${payment.amount}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Due Date: ${new Date(payment.dueDate).toISOString()}`);
        console.log(`   Days Overdue: ${daysOverdue}`);
        console.log(`   Description: ${payment.description}`);
        console.log(`   Payment Method: ${payment.paymentMethod}`);
        console.log(`   Created At: ${new Date(payment.createdAt).toISOString()}`);
      });

      console.log(`\n🚫 USER SHOULD BE BLOCKED FROM MAKING NEW RESERVATIONS`);
    } else {
      console.log(`\n✅ No overdue payments found - user can make reservations`);
    }

    // Also check all pending payments (not just overdue)
    const allPendingPayments = await Payment.find({
      userId: user._id,
      status: 'pending'
    }).lean();

    console.log(`\n💳 All pending payments: ${allPendingPayments.length}`);
    allPendingPayments.forEach((payment: any, index: number) => {
      const isOverdue = new Date(payment.dueDate) < oneDayAgo;
      console.log(`\n${index + 1}. Payment ID: ${payment._id}`);
      console.log(`   Amount: ₱${payment.amount}`);
      console.log(`   Due Date: ${new Date(payment.dueDate).toISOString()}`);
      console.log(`   Is Overdue: ${isOverdue ? '🔴 YES' : '🟢 NO'}`);
      console.log(`   Description: ${payment.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOverduePayments();
