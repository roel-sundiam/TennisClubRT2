import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Reservation from '../models/Reservation';
import User from '../models/User';
import CoinTransaction from '../models/CoinTransaction';
import CreditTransaction from '../models/CreditTransaction';
import Poll from '../models/Poll';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { CreateReservationRequest, UpdateReservationRequest, CompleteReservationRequest } from '../types';
import weatherService from '../services/weatherService';
import coinService from '../services/coinService';
import SeedingService from '../services/seedingService';

// Helper function for string similarity calculation (Levenshtein distance)
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  const distance = matrix[str2.length]?.[str1.length] ?? maxLength;
  return (maxLength - distance) / maxLength;
}

// Get all reservations with filtering and pagination
export const getReservations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build filter query
  const filter: any = {};
  
  if (req.query.userId) {
    filter.userId = req.query.userId;
  }
  
  if (req.query.date) {
    const queryDate = new Date(req.query.date as string);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    filter.date = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }
  
  if (req.query.dateFrom && req.query.dateTo) {
    const fromDate = new Date(req.query.dateFrom as string);
    const toDate = new Date(req.query.dateTo as string);
    toDate.setHours(23, 59, 59, 999);
    
    filter.date = {
      $gte: fromDate,
      $lte: toDate
    };
  }
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  // If not admin/superadmin, only show own reservations unless explicitly requesting all
  if (req.user?.role === 'member' && req.query.showAll !== 'true') {
    filter.userId = req.user._id.toString();
  }

  console.log('🔍 Reservation Filter Debug:');
  console.log('- User role:', req.user?.role);
  console.log('- showAll query:', req.query.showAll);
  console.log('- Final filter:', JSON.stringify(filter));
  console.log('- Will show all users?', req.user?.role !== 'member' || req.query.showAll === 'true');

  const total = await Reservation.countDocuments(filter);
  const reservations = await Reservation.find(filter)
    .populate('userId', 'username fullName email')
    .sort({ date: -1, timeSlot: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: reservations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});

// Get reservations for a specific date
export const getReservationsForDate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { date } = req.params;
  
  if (!date) {
    res.status(400).json({
      success: false,
      error: 'Date parameter is required'
    });
    return;
  }

  const queryDate = new Date(date);
  const reservations = await (Reservation as any).getReservationsForDate(queryDate);

  // Check for Open Play blocked slots
  const openPlayEvents = await Poll.find({
    'metadata.category': 'open_play',
    status: { $in: ['active', 'closed'] },
    'openPlayEvent.eventDate': {
      $gte: new Date(queryDate.getTime()),
      $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  const blockedSlots = new Set();
  openPlayEvents.forEach(event => {
    if (event.openPlayEvent?.blockedTimeSlots && Array.isArray(event.openPlayEvent.blockedTimeSlots)) {
      event.openPlayEvent.blockedTimeSlots.forEach(slot => blockedSlots.add(slot));
    }
  });

  // Generate time slots availability with weather data and Open Play blocking
  const timeSlots = [];
  for (let hour = 5; hour <= 22; hour++) {
    const existingReservation = reservations.find((r: any) => 
      hour >= r.timeSlot && hour < (r.endTimeSlot || r.timeSlot + (r.duration || 1))
    );
    const isBlockedByOpenPlay = blockedSlots.has(hour);
    const openPlayEvent = isBlockedByOpenPlay ? 
      openPlayEvents.find(event => event.openPlayEvent?.blockedTimeSlots && Array.isArray(event.openPlayEvent.blockedTimeSlots) && event.openPlayEvent.blockedTimeSlots.includes(hour)) : null;
    
    // Get weather forecast for this time slot
    let weather = null;
    let weatherSuitability = null;
    try {
      weather = await weatherService.getWeatherForDateTime(queryDate, hour);
      if (weather) {
        weatherSuitability = weatherService.isWeatherSuitableForTennis(weather);
      }
    } catch (error) {
      console.warn(`Failed to fetch weather for ${date} ${hour}:00:`, error);
    }
    
    timeSlots.push({
      hour,
      timeDisplay: `${hour}:00 - ${hour + 1}:00`,
      available: (!existingReservation || existingReservation.status === 'cancelled') && !isBlockedByOpenPlay,
      reservation: existingReservation || null,
      blockedByOpenPlay: isBlockedByOpenPlay,
      openPlayEvent: openPlayEvent ? {
        id: openPlayEvent._id,
        title: openPlayEvent.title,
        startTime: openPlayEvent.openPlayEvent?.startTime,
        endTime: openPlayEvent.openPlayEvent?.endTime
      } : null,
      weather,
      weatherSuitability
    });
  }

  res.status(200).json({
    success: true,
    data: {
      date: queryDate.toISOString().split('T')[0],
      timeSlots,
      reservations
    }
  });
});

// Get single reservation
export const getReservation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const reservation = await Reservation.findById(id).populate('userId', 'username fullName email');
  
  if (!reservation) {
    res.status(404).json({
      success: false,
      error: 'Reservation not found'
    });
    return;
  }

  // Check access permissions
  // Extract the actual user ID from the populated userId field
  const reservationUserId = (reservation.userId as any)?._id || reservation.userId;
  
  if (req.user?.role === 'member' && reservationUserId?.toString() !== req.user?._id?.toString()) {
    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: reservation
  });
});

// Create new reservation
export const createReservation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { date, timeSlot, players, duration = 1, tournamentTier = '100', totalFee }: CreateReservationRequest = req.body;

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  // Validate date is not in the past
  const reservationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (reservationDate < today) {
    res.status(400).json({
      success: false,
      error: 'Cannot make reservations for past dates'
    });
    return;
  }

  // Validate time slot
  if (timeSlot < 5 || timeSlot > 22) {
    res.status(400).json({
      success: false,
      error: 'Court operates from 5:00 AM to 10:00 PM'
    });
    return;
  }

  // Validate duration
  if (duration < 1 || duration > 4) {
    res.status(400).json({
      success: false,
      error: 'Duration must be between 1 and 4 hours'
    });
    return;
  }

  // Validate that reservation doesn't extend beyond court hours
  const endTimeSlot = timeSlot + duration;
  if (endTimeSlot > 23) {
    res.status(400).json({
      success: false,
      error: `Booking extends beyond court hours. Court closes at 10 PM (22:00). Duration: ${duration} hours from ${timeSlot}:00 would end at ${endTimeSlot}:00.`
    });
    return;
  }

  // Check if slot range is available (supports multi-hour)
  const isAvailable = await (Reservation as any).isSlotRangeAvailable(reservationDate, timeSlot, endTimeSlot);
  if (!isAvailable) {
    const conflictMessage = duration > 1 
      ? `One or more time slots in the range ${timeSlot}:00-${endTimeSlot}:00 are already reserved`
      : 'Time slot is already reserved';
    res.status(400).json({
      success: false,
      error: conflictMessage
    });
    return;
  }

  // Check if slot is blocked by Open Play event
  const openPlayEvent = await Poll.findOne({
    'metadata.category': 'open_play',
    status: { $in: ['active', 'closed'] },
    'openPlayEvent.eventDate': {
      $gte: new Date(reservationDate.getTime()),
      $lt: new Date(reservationDate.getTime() + 24 * 60 * 60 * 1000)
    },
    'openPlayEvent.blockedTimeSlots': timeSlot
  });

  if (openPlayEvent) {
    res.status(400).json({
      success: false,
      error: `Time slot is blocked by Open Play event: ${openPlayEvent.title}`,
      details: {
        openPlayEvent: {
          id: openPlayEvent._id,
          title: openPlayEvent.title,
          startTime: openPlayEvent.openPlayEvent?.startTime,
          endTime: openPlayEvent.openPlayEvent?.endTime
        }
      }
    });
    return;
  }

  // Validate players
  if (!players || players.length === 0) {
    res.status(400).json({
      success: false,
      error: 'At least one player is required'
    });
    return;
  }

  if (players.length > 4) {
    res.status(400).json({
      success: false,
      error: 'Maximum 4 players allowed'
    });
    return;
  }

  // Check if user has paid membership fees
  if (!req.user.membershipFeesPaid && req.user.role === 'member') {
    res.status(400).json({
      success: false,
      error: 'Membership fees must be paid before making reservations'
    });
    return;
  }

  // Get weather forecast for the reservation time
  let weatherForecast = null;
  try {
    const weather = await weatherService.getWeatherForDateTime(reservationDate, timeSlot);
    if (weather) {
      weatherForecast = {
        temperature: weather.temperature,
        description: weather.description,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        icon: weather.icon,
        rainChance: weather.rainChance,
        timestamp: weather.timestamp
      };
    }
  } catch (error) {
    console.warn('Failed to fetch weather for reservation:', error);
  }

  // Get user with current balances
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Check if user has enough coins (5 coins per hour) - still required for reservation
  const coinsRequired = 5;
  if (user.coinBalance < coinsRequired) {
    res.status(400).json({
      success: false,
      error: `Insufficient coins. You have ${user.coinBalance} coins but need ${coinsRequired} coins to book a court.`
    });
    return;
  }

  // Deduct coins for the reservation
  try {
    await (CoinTransaction as any).createTransaction(
      req.user._id,
      'spent',
      coinsRequired,
      `Court booking for ${reservationDate.toISOString().split('T')[0]} at ${timeSlot}:00`,
      {
        referenceType: 'reservation',
        metadata: {
          source: 'court_booking',
          reason: 'Court reservation fee',
          date: reservationDate.toISOString().split('T')[0],
          timeSlot: timeSlot
        }
      }
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to process coin payment. Please try again.'
    });
    return;
  }

  // Use totalFee from frontend if provided, otherwise calculate fallback
  const trimmedPlayers = players.map(p => p.trim());
  let finalTotalFee = totalFee || 0;
  
  if (!finalTotalFee) {
    // Fallback calculation if frontend doesn't provide totalFee
    const peakHours = (process.env.PEAK_HOURS || '5,18,19,21').split(',').map(h => parseInt(h));
    const peakHourFee = parseInt(process.env.PEAK_HOUR_FEE || '100');
    const offPeakFeePerMember = parseInt(process.env.OFF_PEAK_FEE_PER_MEMBER || '20');
    
    if (peakHours.includes(timeSlot)) {
      finalTotalFee = peakHourFee * duration;
    } else {
      finalTotalFee = trimmedPlayers.length * offPeakFeePerMember * duration;
    }
    console.log(`⚠️  Using fallback calculation: ₱${finalTotalFee}`);
  } else {
    console.log(`✅ Using frontend calculated fee: ₱${finalTotalFee}`);
  }

  // Check for credit auto-deduction
  let paymentStatus = 'pending';
  let creditUsed = false;
  let creditTransactionId = null;

  // Auto-deduct from credits if user has sufficient balance
  if (user.creditBalance >= finalTotalFee) {
    try {
      console.log(`💳 Auto-deducting ₱${finalTotalFee} from ${user.fullName}'s credit balance (₱${user.creditBalance})`);
      
      const creditTransaction = await (CreditTransaction as any).createTransaction(
        req.user._id,
        'deduction',
        finalTotalFee,
        `Court reservation fee for ${reservationDate.toISOString().split('T')[0]} at ${timeSlot}:00`,
        {
          referenceType: 'reservation',
          metadata: {
            source: 'court_reservation',
            reason: 'Court reservation payment',
            reservationDate: reservationDate,
            timeSlot: timeSlot
          }
        }
      );

      paymentStatus = 'paid';
      creditUsed = true;
      creditTransactionId = creditTransaction._id;
      
      console.log(`✅ Successfully deducted ₱${finalTotalFee} from credits. New balance: ₱${user.creditBalance - finalTotalFee}`);
    } catch (error) {
      console.error('Failed to auto-deduct credits:', error);
      // Continue with normal flow - payment will be pending
      paymentStatus = 'pending';
    }
  }

  // Create reservation
  const reservation = new Reservation({
    userId: req.user._id,
    date: reservationDate,
    timeSlot,
    duration,
    players: trimmedPlayers,
    status: 'pending',
    paymentStatus,
    tournamentTier,
    totalFee: finalTotalFee,
    weatherForecast
  });

  await reservation.save();
  await reservation.populate('userId', 'username fullName email');

  // Update the reservation with credit transaction reference if credit was used
  if (creditUsed && creditTransactionId) {
    reservation.set('metadata.creditTransactionId', creditTransactionId);
    await reservation.save();
  }

  const message = creditUsed 
    ? `Reservation created successfully. ₱${finalTotalFee} automatically deducted from your credit balance. ${coinsRequired} coins deducted.`
    : `Reservation created successfully. Payment of ₱${finalTotalFee} is pending. ${coinsRequired} coins deducted.`;

  res.status(201).json({
    success: true,
    data: {
      ...reservation.toJSON(),
      creditUsed,
      creditBalance: user.creditBalance - (creditUsed ? finalTotalFee : 0)
    },
    message
  });
});

// Update reservation
export const updateReservation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { date, timeSlot, players }: UpdateReservationRequest = req.body;

  const reservation = await Reservation.findById(id);
  
  if (!reservation) {
    res.status(404).json({
      success: false,
      error: 'Reservation not found'
    });
    return;
  }

  // Check access permissions
  if (req.user?.role === 'member' && reservation.userId.toString() !== req.user._id.toString()) {
    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
    return;
  }

  // Cannot edit past reservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (reservation.date < today) {
    res.status(400).json({
      success: false,
      error: 'Cannot edit past reservations'
    });
    return;
  }

  // Cannot edit cancelled or completed reservations
  if (reservation.status === 'cancelled' || reservation.status === 'completed') {
    res.status(400).json({
      success: false,
      error: 'Cannot edit cancelled or completed reservations'
    });
    return;
  }

  // If changing date or time slot, validate availability
  if (date || timeSlot) {
    const newDate = date ? new Date(date) : reservation.date;
    const newTimeSlot = timeSlot || reservation.timeSlot;

    // Validate new date is not in the past
    if (newDate < today) {
      res.status(400).json({
        success: false,
        error: 'Cannot reschedule to a past date'
      });
      return;
    }

    // Validate time slot
    if (newTimeSlot < 5 || newTimeSlot > 22) {
      res.status(400).json({
        success: false,
        error: 'Court operates from 5:00 AM to 10:00 PM'
      });
      return;
    }

    // Check if new slot is available (excluding current reservation)
    const isAvailable = await (Reservation as any).isSlotAvailable(newDate, newTimeSlot, id);
    if (!isAvailable) {
      res.status(400).json({
        success: false,
        error: 'New time slot is already reserved'
      });
      return;
    }

    reservation.date = newDate;
    reservation.timeSlot = newTimeSlot;
  }

  // Update players if provided
  if (players) {
    if (players.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one player is required'
      });
      return;
    }

    if (players.length > 4) {
      res.status(400).json({
        success: false,
        error: 'Maximum 4 players allowed'
      });
      return;
    }

    reservation.players = players.map(p => p.trim());
  }

  await reservation.save();
  await reservation.populate('userId', 'username fullName email');

  res.status(200).json({
    success: true,
    data: reservation,
    message: 'Reservation updated successfully'
  });
});

// Cancel reservation
export const cancelReservation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  console.log(`🗑️  Attempting to cancel reservation: ${id}`);

  const reservation = await Reservation.findById(id);
  
  if (!reservation) {
    console.log(`❌ Reservation not found: ${id}`);
    res.status(404).json({
      success: false,
      error: 'Reservation not found'
    });
    return;
  }

  console.log(`📅 Reservation details:`, {
    id: reservation._id,
    date: reservation.date,
    status: reservation.status,
    userId: reservation.userId,
    requestUserId: req.user?._id
  });

  // Check access permissions
  if (req.user?.role === 'member' && reservation.userId.toString() !== req.user._id.toString()) {
    console.log(`🚫 Access denied - User ${req.user._id} trying to cancel reservation owned by ${reservation.userId}`);
    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
    return;
  }

  // Allow cancellation for today and future dates only
  // For same-day reservations, allow cancellation up to 1 hour before the time slot
  const now = new Date();
  const currentHour = now.getHours();
  const reservationDateTime = new Date(reservation.date);
  const reservationHour = reservation.timeSlot;
  
  // Check if the reservation is for today
  const isToday = reservationDateTime.toDateString() === now.toDateString();
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`📅 Date/time validation:`, {
    now: now.toISOString(),
    reservationDate: reservationDateTime.toISOString(),
    reservationHour,
    currentHour,
    isToday,
    todayStart: todayStart.toISOString(),
    isPastDate: reservationDateTime < todayStart
  });
  
  // If reservation is in the past (before today), don't allow cancellation
  if (reservationDateTime < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    console.log(`❌ Cannot cancel past reservation (before today)`);
    res.status(400).json({
      success: false,
      error: 'Cannot cancel past reservations'
    });
    return;
  }
  
  // If reservation is for today but the time slot has already started, allow cancellation anyway
  // (Business rule: Allow cancellation for weather/emergency even if time has passed)
  if (isToday && currentHour >= reservationHour) {
    console.log(`⚠️  Same-day cancellation for ongoing/past time slot - allowing for emergency/weather reasons`);
  }

  // Cannot cancel already cancelled or completed reservations
  if (reservation.status === 'cancelled' || reservation.status === 'completed') {
    console.log(`❌ Cannot cancel - reservation status is: ${reservation.status}`);
    res.status(400).json({
      success: false,
      error: 'Reservation is already cancelled or completed'
    });
    return;
  }

  // Refund the 5 coins that were deducted when creating the reservation
  const coinsToRefund = 5;
  const { reason } = req.body;
  
  try {
    await (CoinTransaction as any).createTransaction(
      reservation.userId,
      'refunded',
      coinsToRefund,
      `Refund for cancelled reservation on ${reservation.date.toISOString().split('T')[0]} at ${reservation.timeSlot}:00`,
      {
        referenceType: 'reservation_cancellation',
        referenceId: reservation._id?.toString() || '',
        metadata: {
          source: 'court_cancellation',
          reason: reason || 'Reservation cancelled',
          originalDate: reservation.date.toISOString().split('T')[0],
          originalTimeSlot: reservation.timeSlot
        }
      }
    );
  } catch (error) {
    console.warn('Failed to refund coins for cancelled reservation:', error);
    // Continue with cancellation even if coin refund fails
  }

  // Auto-refund credits if the reservation was paid with credits
  let creditRefundAmount = 0;
  if (reservation.paymentStatus === 'paid') {
    // Check if there's a related credit transaction for this reservation
    const creditTransaction = await CreditTransaction.findOne({
      userId: reservation.userId,
      referenceType: 'reservation',
      type: 'deduction',
      'metadata.reservationDate': reservation.date,
      'metadata.timeSlot': reservation.timeSlot,
      status: 'completed'
    });

    if (creditTransaction) {
      creditRefundAmount = creditTransaction.amount;
      try {
        console.log(`💳 Auto-refunding ₱${creditRefundAmount} credits for cancelled reservation`);
        
        await (CreditTransaction as any).refundReservation(
          reservation.userId.toString(),
          (reservation._id as any).toString(),
          creditRefundAmount,
          'reservation_cancelled'
        );

        console.log(`✅ Successfully refunded ₱${creditRefundAmount} to user's credit balance`);
      } catch (error) {
        console.error('Failed to auto-refund credits for cancelled reservation:', error);
        // Continue with cancellation even if credit refund fails
      }
    }
  }

  reservation.status = 'cancelled';
  await reservation.save();
  await reservation.populate('userId', 'username fullName email');

  const message = creditRefundAmount > 0 
    ? `Reservation cancelled successfully. ${coinsToRefund} coins and ₱${creditRefundAmount} credits refunded.`
    : `Reservation cancelled successfully. ${coinsToRefund} coins refunded.`;

  res.status(200).json({
    success: true,
    data: {
      ...reservation.toJSON(),
      creditRefunded: creditRefundAmount
    },
    message
  });
});

// Admin: Update reservation status
export const updateReservationStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    res.status(400).json({
      success: false,
      error: 'Invalid status'
    });
    return;
  }

  const reservation = await Reservation.findById(id);
  
  if (!reservation) {
    res.status(404).json({
      success: false,
      error: 'Reservation not found'
    });
    return;
  }

  reservation.status = status;
  await reservation.save();
  await reservation.populate('userId', 'username fullName email');

  res.status(200).json({
    success: true,
    data: reservation,
    message: 'Reservation status updated successfully'
  });
});

// Admin: Complete reservation with match results and award points
export const completeReservation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { matchResults }: CompleteReservationRequest = req.body;

  const reservation = await Reservation.findById(id);
  
  if (!reservation) {
    res.status(404).json({
      success: false,
      error: 'Reservation not found'
    });
    return;
  }

  if (reservation.status === 'completed') {
    res.status(400).json({
      success: false,
      error: 'Reservation is already completed'
    });
    return;
  }

  if (reservation.status === 'cancelled') {
    res.status(400).json({
      success: false,
      error: 'Cannot complete a cancelled reservation'
    });
    return;
  }

  // Update reservation status to completed
  reservation.status = 'completed';
  
  // If match results are provided, process them and award points
  if (matchResults && matchResults.length > 0) {
    try {
      await SeedingService.processMatchResults(id!, matchResults);
      console.log(`🎾 Match results processed for reservation ${id}`);
    } catch (error) {
      console.error('Error processing match results:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to process match results. Please try again.'
      });
      return;
    }
  } else {
    // Just mark as completed without processing points
    await reservation.save();
  }

  await reservation.populate('userId', 'username fullName email');

  res.status(200).json({
    success: true,
    data: reservation,
    message: matchResults && matchResults.length > 0 
      ? 'Reservation completed successfully and points awarded'
      : 'Reservation completed successfully'
  });
});

// Get user's upcoming reservations
export const getMyUpcomingReservations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservations = await Reservation.find({
    userId: req.user._id,
    date: { $gte: today },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ date: 1, timeSlot: 1 });

  res.status(200).json({
    success: true,
    data: reservations
  });
});

// Validation rules
export const createReservationValidation = [
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('timeSlot')
    .isInt({ min: 5, max: 22 })
    .withMessage('Time slot must be between 5 and 22'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Duration must be between 1 and 4 hours'),
  body('players')
    .isArray({ min: 1, max: 4 })
    .withMessage('Players must be an array with 1-4 items'),
  body('players.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Player name must be 1-50 characters long'),
  body('tournamentTier')
    .optional()
    .isIn(['100', '250', '500'])
    .withMessage('Tournament tier must be 100, 250, or 500')
];

export const updateReservationValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('timeSlot')
    .optional()
    .isInt({ min: 5, max: 22 })
    .withMessage('Time slot must be between 5 and 22'),
  body('players')
    .optional()
    .isArray({ min: 1, max: 4 })
    .withMessage('Players must be an array with 1-4 items'),
  body('players.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Player name must be 1-50 characters long')
];

export const completeReservationValidation = [
  body('matchResults')
    .optional()
    .isArray()
    .withMessage('Match results must be an array'),
  body('matchResults.*.winnerId')
    .isMongoId()
    .withMessage('Winner ID must be a valid MongoDB ObjectId'),
  body('matchResults.*.participants')
    .isArray({ min: 2 })
    .withMessage('Participants must be an array with at least 2 players'),
  body('matchResults.*.participants.*')
    .isMongoId()
    .withMessage('Participant ID must be a valid MongoDB ObjectId'),
  body('matchResults.*.score')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Score must be a string with max 50 characters')
];