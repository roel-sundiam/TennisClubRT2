import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

interface PlayerPayment {
  playerName: string;
  amount: number;
  userId?: string;
}

/**
 * @route POST /api/manual-court-usage
 * @desc Create manual court usage record and generate pending payments
 * @access Private (Superadmin only)
 */
export const createManualCourtUsage = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }

  const { date, startTime, endTime, players, description } = req.body;

  console.log('🏸 Creating manual court usage:', {
    date,
    startTime,
    endTime,
    playerCount: players?.length,
    createdBy: req.user?.username
  });

  console.log('🏸 Raw request body:', JSON.stringify(req.body, null, 2));

  // Validate players array
  if (!players || !Array.isArray(players) || players.length === 0) {
    res.status(400).json({
      success: false,
      error: 'At least one player is required'
    });
    return;
  }

  // Validate each player entry
  for (const player of players) {
    if (!player.playerName || typeof player.playerName !== 'string' || player.playerName.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'All players must have a valid name'
      });
      return;
    }

    if (!player.amount || typeof player.amount !== 'number' || player.amount <= 0) {
      res.status(400).json({
        success: false,
        error: `Invalid amount for player ${player.playerName}`
      });
      return;
    }
  }

  // Get all player names for metadata
  const playerNames = players.map((p: PlayerPayment) => p.playerName);
  const courtUsageDate = new Date(date);

  // Set due date to 1 day after court usage date
  // This ensures payments for past court usage are immediately marked as overdue
  const dueDate = new Date(courtUsageDate);
  dueDate.setDate(dueDate.getDate() + 1);

  // Try to find user IDs for players (match by full name)
  const allUsers = await User.find({
    isActive: true,
    isApproved: true
  }).select('fullName username _id').lean();

  const createdPayments = [];

  // Create individual payment for each player
  for (const player of players) {
    const playerName = player.playerName.trim();

    // Try to find matching user
    let userId: string | undefined;
    const matchedUser = allUsers.find(u =>
      u.fullName.toLowerCase().trim() === playerName.toLowerCase()
    );

    if (matchedUser) {
      userId = matchedUser._id.toString();
      console.log(`✅ Matched player "${playerName}" to user ${matchedUser.username}`);
    } else {
      console.log(`⚠️ No user found for player "${playerName}" - creating payment without userId`);
      // For non-members, we'll need to create a payment without userId
      // This will require modifying the Payment model to allow optional userId for manual payments
      res.status(400).json({
        success: false,
        error: `Player "${playerName}" not found in member database. Please ensure all players are registered members.`
      });
      return;
    }

    // Create payment for this player
    const payment = new Payment({
      userId: userId,
      amount: player.amount,
      currency: 'PHP',
      paymentMethod: 'cash',
      status: 'pending',
      dueDate: dueDate,
      description: description || `Court usage fee - ${courtUsageDate.toLocaleDateString()} (${startTime}:00 - ${endTime}:00)`,
      metadata: {
        isManualPayment: true,
        playerNames: playerNames,
        courtUsageDate: courtUsageDate,
        timeSlot: startTime, // Store startTime as timeSlot for compatibility
        startTime: startTime,
        endTime: endTime,
        createdBy: req.user?.username,
        createdById: req.user?._id.toString()
      }
    });

    await payment.save();
    createdPayments.push({
      paymentId: (payment._id as any).toString(),
      playerName: playerName,
      userId: userId,
      amount: payment.amount,
      status: payment.status
    });

    console.log(`💰 Created pending payment for ${playerName}: ₱${player.amount}`);
    console.log(`💰 Payment metadata saved:`, {
      startTime: payment.metadata?.startTime,
      endTime: payment.metadata?.endTime,
      timeSlot: payment.metadata?.timeSlot
    });
  }

  console.log(`✅ Manual court usage recorded successfully - ${createdPayments.length} payments created`);

  res.status(201).json({
    success: true,
    message: `Successfully created ${createdPayments.length} pending payment(s)`,
    data: {
      date: courtUsageDate,
      startTime: startTime,
      endTime: endTime,
      totalPlayers: createdPayments.length,
      totalAmount: players.reduce((sum: number, p: PlayerPayment) => sum + p.amount, 0),
      payments: createdPayments,
      createdBy: req.user?.username,
      createdAt: new Date()
    }
  });
});

/**
 * @route GET /api/manual-court-usage
 * @desc Get manual court usage history
 * @access Private (Superadmin only)
 */
export const getManualCourtUsageHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('📊 Fetching manual court usage history');

  // Find all payments that are marked as manual payments
  const manualPayments = await Payment.find({
    'metadata.isManualPayment': true
  })
    .populate('userId', 'fullName username email')
    .sort({ createdAt: -1 })
    .lean();

  // Group payments by court usage session (same date, time slot, and createdAt)
  const sessionsMap = new Map<string, any>();

  for (const payment of manualPayments) {
    const sessionKey = `${payment.metadata?.courtUsageDate?.toISOString()}_${payment.metadata?.timeSlot}_${payment.createdAt.toISOString()}`;

    if (!sessionsMap.has(sessionKey)) {
      sessionsMap.set(sessionKey, {
        date: payment.metadata?.courtUsageDate,
        timeSlot: payment.metadata?.timeSlot,
        players: [],
        totalAmount: 0,
        createdBy: (payment.metadata as any)?.createdBy,
        createdAt: payment.createdAt,
        description: payment.description
      });
    }

    const session = sessionsMap.get(sessionKey);
    session.players.push({
      playerName: (payment.userId as any)?.fullName || 'Unknown',
      amount: payment.amount,
      status: payment.status,
      paymentId: (payment._id as any).toString()
    });
    session.totalAmount += payment.amount;
  }

  const sessions = Array.from(sessionsMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  console.log(`📊 Found ${sessions.length} manual court usage sessions`);

  res.json({
    success: true,
    data: {
      sessions: sessions,
      totalSessions: sessions.length
    }
  });
});

// Validation rules
export const createManualCourtUsageValidation = [
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('startTime')
    .isInt({ min: 5, max: 23 })
    .withMessage('Start time must be between 5 (5 AM) and 23 (11 PM)'),
  body('endTime')
    .isInt({ min: 6, max: 24 })
    .withMessage('End time must be between 6 (6 AM) and 24 (12 AM)'),
  body('players')
    .isArray({ min: 1 })
    .withMessage('At least one player is required'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];
