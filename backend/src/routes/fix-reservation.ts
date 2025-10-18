import { Router } from 'express';
import Reservation from '../models/Reservation';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Admin endpoint to fix a specific reservation's duration fields
router.post('/fix/:reservationId', requireAdmin, async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    console.log('📋 Before fix:', {
      id: reservation._id,
      timeSlot: reservation.timeSlot,
      duration: reservation.duration,
      endTimeSlot: reservation.endTimeSlot,
      totalFee: reservation.totalFee
    });

    // Set duration to 2 and endTimeSlot to 19 (7PM) for this specific case
    reservation.duration = 2;
    reservation.endTimeSlot = 19;
    reservation.isMultiHour = true;

    await reservation.save({ validateBeforeSave: false });

    console.log('✅ After fix:', {
      id: reservation._id,
      timeSlot: reservation.timeSlot,
      duration: reservation.duration,
      endTimeSlot: reservation.endTimeSlot,
      totalFee: reservation.totalFee
    });

    res.json({
      success: true,
      message: 'Reservation fixed successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Error fixing reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix reservation'
    });
  }
});

export default router;
