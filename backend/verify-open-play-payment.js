const mongoose = require('mongoose');
const Payment = require('./dist/models/Payment.js').default;
const User = require('./dist/models/User.js').default;
const Poll = require('./dist/models/Poll.js').default;

async function verifyOpenPlayPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find RoelSundiam user
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ RoelSundiam user not found');
      return;
    }
    console.log(`👤 Found user: ${user.fullName} (ID: ${user._id})`);
    
    // Find the September 1 500 Open Play poll
    const poll = await Poll.findOne({ 
      title: 'September 1 500 Open Play',
      'metadata.category': 'open_play' 
    });
    
    if (!poll) {
      console.log('❌ September 1 500 Open Play event not found');
      return;
    }
    console.log(`🏆 Found poll: ${poll.title} (ID: ${poll._id})`);
    console.log(`📅 Event Date: ${poll.openPlayEvent.eventDate}`);
    console.log(`💰 Player Fee: ₱${poll.openPlayEvent.playerFee}`);
    
    // Check if Roel Sundiam is confirmed for this event
    const isConfirmed = poll.openPlayEvent.confirmedPlayers?.includes(user._id.toString());
    console.log(`✅ Roel Sundiam confirmed for event: ${isConfirmed ? 'YES' : 'NO'}`);
    
    // Find payment specifically for this Open Play event
    const openPlayPayment = await Payment.findOne({
      userId: user._id,
      pollId: poll._id
    });
    
    if (!openPlayPayment) {
      console.log('❌ No payment record found for this Open Play event');
      
      // Show all payments for this user for comparison
      const allPayments = await Payment.find({ userId: user._id }).sort({ createdAt: -1 });
      console.log(`\n💳 All payments for ${user.fullName}:`);
      allPayments.forEach((payment, index) => {
        console.log(`  Payment ${index + 1}:`);
        console.log(`    Amount: ₱${payment.amount}`);
        console.log(`    Status: ${payment.status}`);
        console.log(`    Method: ${payment.paymentMethod}`);
        console.log(`    Created: ${payment.createdAt}`);
        console.log(`    Poll ID: ${payment.pollId || 'None'}`);
        console.log(`    Reservation ID: ${payment.reservationId || 'None'}`);
        console.log(`    Description: ${payment.description}`);
        console.log(`    Reference: ${payment.referenceNumber}`);
        console.log('    ---');
      });
      
      return;
    }
    
    console.log('\n🎯 OPEN PLAY PAYMENT VERIFICATION RESULTS:');
    console.log('='.repeat(60));
    console.log(`✅ Payment Found: YES`);
    console.log(`💰 Amount: ₱${openPlayPayment.amount}`);
    console.log(`📊 Status: ${openPlayPayment.status.toUpperCase()}`);
    console.log(`💳 Payment Method: ${openPlayPayment.paymentMethod}`);
    console.log(`📅 Created Date: ${openPlayPayment.createdAt}`);
    console.log(`💸 Payment Date: ${openPlayPayment.paymentDate || 'Not completed yet'}`);
    console.log(`🎟️ Reference Number: ${openPlayPayment.referenceNumber}`);
    console.log(`📝 Description: ${openPlayPayment.description}`);
    console.log(`🏆 Poll ID: ${openPlayPayment.pollId}`);
    
    if (openPlayPayment.metadata) {
      console.log(`\n📋 Payment Metadata:`);
      if (openPlayPayment.metadata.openPlayEventTitle) {
        console.log(`    Event Title: ${openPlayPayment.metadata.openPlayEventTitle}`);
      }
      if (openPlayPayment.metadata.openPlayEventDate) {
        console.log(`    Event Date: ${openPlayPayment.metadata.openPlayEventDate}`);
      }
    }
    
    console.log('\n🔍 VERIFICATION STATUS:');
    console.log('='.repeat(60));
    
    // Verify amount matches
    const correctAmount = openPlayPayment.amount === poll.openPlayEvent.playerFee;
    console.log(`✅ Amount Correct (₱${poll.openPlayEvent.playerFee}): ${correctAmount ? 'YES' : 'NO'}`);
    
    // Verify payment status
    const paymentCompleted = openPlayPayment.status === 'completed';
    console.log(`✅ Payment Completed: ${paymentCompleted ? 'YES' : 'NO'}`);
    
    // Verify participant is confirmed
    console.log(`✅ Participant Confirmed: ${isConfirmed ? 'YES' : 'NO'}`);
    
    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(60));
    if (correctAmount && isConfirmed) {
      if (paymentCompleted) {
        console.log('🎉 SUCCESS: Payment was successfully made and completed!');
      } else {
        console.log('⏳ PENDING: Payment exists but is not yet completed.');
        console.log(`   Status: ${openPlayPayment.status}`);
        console.log('   Action needed: Payment needs to be marked as completed.');
      }
    } else {
      console.log('❌ ISSUE: There are problems with the payment verification.');
      if (!correctAmount) {
        console.log(`   - Amount mismatch: Found ₱${openPlayPayment.amount}, expected ₱${poll.openPlayEvent.playerFee}`);
      }
      if (!isConfirmed) {
        console.log('   - Participant not confirmed for the event');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Load environment variables
require('dotenv').config();
verifyOpenPlayPayment();