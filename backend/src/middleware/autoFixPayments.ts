import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';

/**
 * Middleware to automatically fix multi-hour payment allocation issues
 * This handles cases where frontend creates separate reservations but payment goes to only one
 */
export const autoFixMultiHourPayments = async (userId: string): Promise<void> => {
  try {
    console.log('🔧 Auto-fixing potential multi-hour payment issues for user:', userId);
    
    // Find reservations with pending payment status from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pendingReservations = await Reservation.find({
      userId: userId,
      paymentStatus: 'pending',
      createdAt: { $gte: yesterday }
    }).sort({ date: 1, timeSlot: 1 });
    
    if (pendingReservations.length === 0) {
      console.log('✅ No pending reservations found for auto-fix');
      return;
    }
    
    console.log(`🔍 Found ${pendingReservations.length} pending reservations to check`);
    
    for (const reservation of pendingReservations) {
      console.log(`📅 Checking ${reservation.timeSlot}:00-${reservation.timeSlot + 1}:00 on ${reservation.date.toDateString()}`);
      
      // Look for same-day reservations with same players that might be part of multi-hour booking
      const startOfDay = new Date(reservation.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(reservation.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const sameDayReservations = await Reservation.find({
        userId: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
        players: reservation.players, // Same players indicates same booking session
        totalFee: reservation.totalFee, // Same fee structure
        _id: { $ne: reservation._id } // Exclude current reservation
      });
      
      // If there's a paid reservation with same players/fee on same day, likely multi-hour booking
      const paidReservation = sameDayReservations.find(r => r.paymentStatus === 'paid');
      
      if (paidReservation) {
        console.log(`💰 Found potential multi-hour booking - paid reservation at ${paidReservation.timeSlot}:00`);
        
        // Find the payment for the paid reservation
        const existingPayment = await Payment.findOne({
          reservationId: (paidReservation._id as any).toString(),
          status: 'completed'
        });
        
        if (existingPayment && existingPayment.amount > reservation.totalFee) {
          console.log(`🔧 Splitting ₱${existingPayment.amount} payment for multi-hour booking`);
          
          // Calculate allocation
          const allocationAmount = reservation.totalFee;
          const remainingAmount = existingPayment.amount - allocationAmount;
          
          // Update existing payment amount
          existingPayment.amount = remainingAmount;
          existingPayment.description = existingPayment.description.replace(
            /(\d{1,2}):00-(\d{1,2}):00/,
            `$1:00-$2:00 (Part of multi-hour booking)`
          );
          existingPayment.notes = (existingPayment.notes || '') + ' [Auto-split for multi-hour booking]';
          await existingPayment.save();
          
          // Create new payment for pending reservation
          const newPayment = new Payment({
            reservationId: (reservation._id as any).toString(),
            userId: userId,
            amount: allocationAmount,
            paymentMethod: existingPayment.paymentMethod,
            status: 'completed',
            referenceNumber: `${existingPayment.referenceNumber}-MH${reservation.timeSlot}`,
            description: `Court reservation payment for ${reservation.date.toDateString()} ${reservation.timeSlot}:00-${reservation.timeSlot + 1}:00 (Multi-hour allocation)`,
            notes: 'Auto-created from payment split for multi-hour booking. System detected related reservations and allocated payment accordingly.',
            paymentDate: new Date(),
            dueDate: existingPayment.dueDate || reservation.date,
            currency: existingPayment.currency || 'PHP'
          });
          
          await newPayment.save();
          
          // Update reservation payment status
          reservation.paymentStatus = 'paid';
          await reservation.save({ validateBeforeSave: false });
          
          console.log(`✅ Auto-fixed: Created payment ${newPayment.referenceNumber} for ₱${allocationAmount}`);
        }
      }
    }
    
    console.log('✅ Auto-fix multi-hour payments completed');
    
  } catch (error) {
    console.error('❌ Error in auto-fix multi-hour payments:', error);
    // Don't throw - this is a background fix, shouldn't break main flow
  }
};

/**
 * Express middleware to trigger auto-fix after payment operations
 */
export const autoFixPaymentsMiddleware = async (req: any, res: any, next: any) => {
  // Store original res.json to intercept response
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Call original json method
    const result = originalJson.call(this, data);
    
    // Trigger auto-fix in background after successful payment operations
    if (data.success && req.user?._id) {
      // Don't await - run in background
      autoFixMultiHourPayments(req.user._id.toString()).catch(console.error);
    }
    
    return result;
  };
  
  next();
};