const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const reservationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: Number, required: true },
  players: [{ type: String }],
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'pending' },
  totalFee: { type: Number, default: 0 }
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
  reservationId: { type: String, ref: 'Reservation' },
  userId: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'completed' },
  referenceNumber: { type: String },
  description: { type: String, required: true },
  notes: { type: String },
  paymentDate: { type: Date }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  fullName: { type: String, required: true }
});

const Reservation = mongoose.model('Reservation', reservationSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const User = mongoose.model('User', userSchema);

async function autoFixPendingPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-club-rt2');
    console.log('✅ Connected to MongoDB');
    
    const user = await User.findOne({ username: 'RoelSundiam' });
    if (!user) {
      console.log('❌ User RoelSundiam not found');
      return;
    }
    
    console.log('🔧 Auto-fixing pending payment issues for', user.fullName);
    
    // Find all reservations with pending payment status
    const pendingReservations = await Reservation.find({
      userId: user._id.toString(),
      paymentStatus: 'pending'
    }).sort({ date: 1, timeSlot: 1 });
    
    console.log(`\\n📅 Found ${pendingReservations.length} reservations with pending payments:`);
    
    const fixedPayments = [];
    
    for (const reservation of pendingReservations) {
      console.log(`\\n🎯 Processing ${reservation.timeSlot}:00-${reservation.timeSlot + 1}:00 on ${reservation.date.toDateString()}`);
      console.log(`   Players: ${reservation.players.join(', ')}`);
      console.log(`   Fee: ₱${reservation.totalFee}`);
      
      // Look for a recent large payment that could be split
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Find potential payments to split (₱180 payments within last day)
      const potentialPayments = await Payment.find({
        userId: user._id.toString(),
        amount: { $gte: 150 }, // Look for payments ₱150 or more (could be multi-hour)
        status: 'completed',
        createdAt: { $gte: yesterday }
      }).sort({ createdAt: -1 });
      
      console.log(`   Found ${potentialPayments.length} recent large payments to check`);
      
      // Look for same-day reservations that might be part of the same booking
      const sameDay = new Date(reservation.date);
      const startOfDay = new Date(sameDay);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(sameDay);
      endOfDay.setHours(23, 59, 59, 999);
      
      const sameDayReservations = await Reservation.find({
        userId: user._id.toString(),
        date: { $gte: startOfDay, $lte: endOfDay },
        players: reservation.players, // Same players
        totalFee: reservation.totalFee // Same fee (indicating same type of booking)
      }).sort({ timeSlot: 1 });
      
      console.log(`   Found ${sameDayReservations.length} reservations on same day with same players/fee`);
      
      // If there are multiple reservations with same players/fee on same day, this is likely a multi-hour booking
      if (sameDayReservations.length > 1) {
        const paidReservation = sameDayReservations.find(r => r.paymentStatus === 'paid');
        
        if (paidReservation) {
          console.log(`   ✅ Found paid reservation at ${paidReservation.timeSlot}:00 - this appears to be a multi-hour booking`);
          
          // Find the payment for the paid reservation
          const existingPayment = await Payment.findOne({
            reservationId: paidReservation._id.toString(),
            status: 'completed'
          });
          
          if (existingPayment && existingPayment.amount > reservation.totalFee) {
            console.log(`   💰 Found overpayment: ₱${existingPayment.amount} for ₱${reservation.totalFee} slot`);
            console.log(`   🔧 Splitting payment...`);
            
            // Calculate how much to allocate to this reservation
            const allocationAmount = reservation.totalFee;
            
            // Update the existing payment
            const newAmount = existingPayment.amount - allocationAmount;
            existingPayment.amount = newAmount;
            existingPayment.description = existingPayment.description.replace(
              `${paidReservation.timeSlot}:00-${paidReservation.timeSlot + 1}:00`,
              `${paidReservation.timeSlot}:00-${paidReservation.timeSlot + 1}:00 (Part of multi-hour booking)`
            );
            existingPayment.notes = (existingPayment.notes || '') + ` Payment split for multi-hour booking.`;
            await existingPayment.save();
            
            // Create new payment for this reservation
            const newPayment = new Payment({
              reservationId: reservation._id.toString(),
              userId: user._id.toString(),
              amount: allocationAmount,
              paymentMethod: existingPayment.paymentMethod,
              status: 'completed',
              referenceNumber: existingPayment.referenceNumber + '-AUTO' + reservation.timeSlot,
              description: `Court reservation payment for ${reservation.date.toDateString()} ${reservation.timeSlot}:00-${reservation.timeSlot + 1}:00 (Multi-hour booking part)`,
              notes: 'Auto-created from split payment for multi-hour booking. Original payment was allocated across multiple time slots.',
              paymentDate: new Date()
            });
            
            await newPayment.save();
            
            // Update reservation payment status
            reservation.paymentStatus = 'paid';
            await reservation.save();
            
            fixedPayments.push({
              reservation: `${reservation.timeSlot}:00-${reservation.timeSlot + 1}:00`,
              amount: allocationAmount,
              reference: newPayment.referenceNumber
            });
            
            console.log(`   ✅ Created payment: ${newPayment.referenceNumber} for ₱${allocationAmount}`);
            console.log(`   ✅ Updated reservation to paid status`);
          }
        }
      } else {
        console.log(`   ⚠️  Single reservation - may need manual handling`);
      }
    }
    
    console.log(`\\n📊 Auto-fix Summary:`);
    console.log(`   Fixed ${fixedPayments.length} pending payments:`);
    
    for (const fix of fixedPayments) {
      console.log(`   ✅ ${fix.reservation}: ₱${fix.amount} (${fix.reference})`);
    }
    
    // Final verification
    const remainingPending = await Reservation.find({
      userId: user._id.toString(),
      paymentStatus: 'pending'
    });
    
    console.log(`\\n🎯 Final Status:`);
    console.log(`   Remaining pending reservations: ${remainingPending.length}`);
    
    if (remainingPending.length === 0) {
      console.log('   🎉 ALL PAYMENT ISSUES RESOLVED!');
    } else {
      console.log('   ⚠️  Some reservations still pending:');
      for (const res of remainingPending) {
        console.log(`   - ${res.timeSlot}:00-${res.timeSlot + 1}:00 on ${res.date.toDateString()}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\\n✅ Disconnected from MongoDB');
  }
}

autoFixPendingPayments();