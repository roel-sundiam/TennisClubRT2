import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import CoinTransaction from '../models/CoinTransaction';
import User from '../models/User';
import Payment from '../models/Payment';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Get user's coin balance and recent transactions
export const getCoinBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const user = await User.findById(req.user._id).select('coinBalance');
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Get recent transactions
  const recentTransactions = await (CoinTransaction as any).getUserTransactions(req.user._id, 1, 5);

  // Check for low balance warning
  const lowBalanceThreshold = parseInt(process.env.LOW_BALANCE_WARNING_THRESHOLD || '10');
  const isLowBalance = user.coinBalance < lowBalanceThreshold;

  return res.status(200).json({
    success: true,
    data: {
      balance: user.coinBalance,
      isLowBalance,
      lowBalanceThreshold,
      recentTransactions
    }
  });
});

// Get user's coin transaction history
export const getCoinTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;
  const requestedUserId = req.query.userId as string;

  let transactions;
  let total;

  if (req.user.role === 'member') {
    // Members can only see their own transactions
    transactions = await (CoinTransaction as any).getUserTransactions(req.user._id, page, limit, type);
    total = await CoinTransaction.countDocuments({ 
      userId: req.user._id, 
      ...(type && { type }) 
    });
  } else if (requestedUserId) {
    // Admin requesting specific user's transactions
    transactions = await (CoinTransaction as any).getUserTransactions(requestedUserId, page, limit, type);
    total = await CoinTransaction.countDocuments({ 
      userId: requestedUserId, 
      ...(type && { type }) 
    });
  } else {
    // Admin requesting all transactions across all users
    const filter: any = {};
    if (type) {
      filter.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    transactions = await CoinTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username fullName email')
      .populate('metadata.adminUserId', 'username fullName');
      
    total = await CoinTransaction.countDocuments(filter);
  }

  return res.status(200).json({
    success: true,
    data: transactions,
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

// Purchase coins (admin function or integration with payment gateway)
export const purchaseCoins = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { amount, paymentMethod, paymentReference } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Validate purchase amount
  if (amount <= 0 || amount > 10000) {
    return res.status(400).json({
      success: false,
      error: 'Purchase amount must be between 1 and 10,000 coins'
    });
  }

  // Calculate cost (₱1 = 1 coin for simplicity)
  const costInPHP = amount;

  try {
    // Create coin transaction
    const transaction = await (CoinTransaction as any).createTransaction(
      req.user._id,
      'purchased',
      amount,
      `Purchased ${amount} coins via ${paymentMethod} - Pending Admin Approval`,
      {
        referenceId: paymentReference,
        referenceType: 'purchase',
        metadata: {
          paymentMethod,
          costInPHP,
          conversionRate: 1,
          source: 'user_purchase',
          requiresApproval: true
        },
        status: 'pending'
      }
    );

    await transaction.populate('userId', 'username fullName');

    return res.status(201).json({
      success: true,
      data: transaction,
      message: `Coin purchase request submitted for ${amount} coins. Awaiting admin approval.`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Award coins (admin only)
export const awardCoins = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason) {
    return res.status(400).json({
      success: false,
      error: 'User ID, amount, and reason are required'
    });
  }

  if (amount <= 0 || amount > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Award amount must be between 1 and 1,000 coins'
    });
  }

  // Check if target user exists
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: 'Target user not found'
    });
  }

  try {
    const transaction = await (CoinTransaction as any).createTransaction(
      userId,
      'bonus',
      amount,
      `Admin award: ${reason}`,
      {
        referenceType: 'admin_adjustment',
        metadata: {
          adminUserId: req.user?._id,
          reason,
          source: 'admin_award'
        }
      }
    );

    await transaction.populate('userId', 'username fullName');

    return res.status(201).json({
      success: true,
      data: transaction,
      message: `Successfully awarded ${amount} coins to ${targetUser.fullName}`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Deduct coins (admin only)
export const deductCoins = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason) {
    return res.status(400).json({
      success: false,
      error: 'User ID, amount, and reason are required'
    });
  }

  if (amount <= 0 || amount > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Deduction amount must be between 1 and 1,000 coins'
    });
  }

  // Check if target user exists
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: 'Target user not found'
    });
  }

  // Check if user has sufficient balance
  if (targetUser.coinBalance < amount) {
    return res.status(400).json({
      success: false,
      error: `User only has ${targetUser.coinBalance} coins available`
    });
  }

  try {
    const transaction = await (CoinTransaction as any).createTransaction(
      userId,
      'penalty',
      amount,
      `Admin deduction: ${reason}`,
      {
        referenceType: 'admin_adjustment',
        metadata: {
          adminUserId: req.user?._id,
          reason,
          source: 'admin_penalty'
        }
      }
    );

    await transaction.populate('userId', 'username fullName');

    return res.status(201).json({
      success: true,
      data: transaction,
      message: `Successfully deducted ${amount} coins from ${targetUser.fullName}`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Use coins for payment
export const useCoinsForPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentId } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Find the payment
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  // Check if user owns this payment or is admin
  if (req.user.role === 'member' && payment.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Check payment status
  if (payment.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Payment is not in pending status'
    });
  }

  // Check if user has sufficient coins
  const coinsNeeded = payment.amount;
  if (req.user.coinBalance < coinsNeeded) {
    return res.status(400).json({
      success: false,
      error: `Insufficient coins. You have ${req.user.coinBalance} coins but need ${coinsNeeded} coins.`
    });
  }

  try {
    // Create coin transaction
    const coinTransaction = await (CoinTransaction as any).createTransaction(
      req.user._id,
      'spent',
      coinsNeeded,
      `Payment for court reservation ${payment.description}`,
      {
        referenceId: paymentId,
        referenceType: 'payment',
        metadata: {
          originalAmount: payment.amount,
          conversionRate: 1,
          source: 'court_payment'
        }
      }
    );

    // Update payment status
    payment.status = 'completed';
    payment.paymentMethod = 'coins';
    payment.paymentDate = new Date();
    payment.transactionId = coinTransaction._id.toString();
    await payment.save();

    // Update reservation payment status
    const Reservation = require('../models/Reservation').default;
    const reservation = await Reservation.findById(payment.reservationId);
    if (reservation) {
      reservation.paymentStatus = 'paid';
      await reservation.save({ validateBeforeSave: false });
    }

    await coinTransaction.populate('userId', 'username fullName');

    // Emit real-time update to court usage report when coin payment is completed
    try {
      const { webSocketService } = await import('../services/websocketService');
      if (webSocketService.isInitialized()) {
        const memberName = req.user.fullName || 'Unknown Member';
        
        webSocketService.emitCourtUsageUpdate({
          type: 'court_usage_data_updated',
          data: null, // Will trigger a full refresh on the frontend
          timestamp: new Date().toISOString(),
          message: `💰 Coin payment completed: ${memberName} paid ${coinsNeeded} coins (₱${payment.amount.toFixed(2)})`
        });
        
        console.log('📡 Real-time court usage update broadcasted for coin payment completion');
      }
    } catch (error) {
      console.error('⚠️ Failed to broadcast coin payment completion update:', error);
      // Don't fail the coin payment if WebSocket broadcast fails
    }

    return res.status(200).json({
      success: true,
      data: {
        coinTransaction,
        payment,
        remainingBalance: req.user.coinBalance - coinsNeeded
      },
      message: `Successfully paid ${coinsNeeded} coins for court reservation`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get coin statistics (admin only)
export const getCoinStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;
  
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  const stats = await (CoinTransaction as any).getCoinStats(start, end);

  // Get user balance distribution
  const balanceDistribution = await User.aggregate([
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $eq: ['$coinBalance', 0] }, then: '0' },
              { case: { $lte: ['$coinBalance', 10] }, then: '1-10' },
              { case: { $lte: ['$coinBalance', 50] }, then: '11-50' },
              { case: { $lte: ['$coinBalance', 100] }, then: '51-100' },
              { case: { $lte: ['$coinBalance', 500] }, then: '101-500' },
              { case: { $gt: ['$coinBalance', 500] }, then: '500+' }
            ],
            default: 'unknown'
          }
        },
        count: { $sum: 1 },
        totalCoins: { $sum: '$coinBalance' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Get total coins in circulation
  const totalStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalCoinsInCirculation: { $sum: '$coinBalance' },
        averageBalance: { $avg: '$coinBalance' },
        usersWithCoins: {
          $sum: { $cond: [{ $gt: ['$coinBalance', 0] }, 1, 0] }
        }
      }
    }
  ]);

  return res.status(200).json({
    success: true,
    data: {
      ...stats,
      balanceDistribution,
      totalStats: totalStats[0] || {
        totalUsers: 0,
        totalCoinsInCirculation: 0,
        averageBalance: 0,
        usersWithCoins: 0
      },
      period: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString()
      }
    }
  });
});

// Reverse a coin transaction (admin only)
export const reverseTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: 'Reason for reversal is required'
    });
  }

  try {
    const reverseTransaction = await (CoinTransaction as any).reverseTransaction(
      id, 
      reason, 
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      data: reverseTransaction,
      message: 'Transaction reversed successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get coin purchase report with statistics (Admin only)
export const getCoinPurchaseReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: any = { type: 'purchased' };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Get aggregate statistics
    const statsAggregation = await CoinTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalCoins: { $sum: '$amount' },
          totalCostPHP: {
            $sum: {
              $ifNull: ['$metadata.costInPHP', '$amount']
            }
          },
          statusBreakdown: {
            $push: {
              status: '$status',
              amount: '$amount',
              costInPHP: { $ifNull: ['$metadata.costInPHP', '$amount'] }
            }
          },
          paymentMethodBreakdown: {
            $push: {
              paymentMethod: '$metadata.paymentMethod',
              amount: '$amount',
              costInPHP: { $ifNull: ['$metadata.costInPHP', '$amount'] }
            }
          }
        }
      }
    ]);

    // Group by status
    const statusBreakdown = await CoinTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCoins: { $sum: '$amount' },
          totalCostPHP: {
            $sum: {
              $ifNull: ['$metadata.costInPHP', '$amount']
            }
          }
        }
      }
    ]);

    // Group by payment method
    const paymentMethodBreakdown = await CoinTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$metadata.paymentMethod',
          count: { $sum: 1 },
          totalCoins: { $sum: '$amount' },
          totalCostPHP: {
            $sum: {
              $ifNull: ['$metadata.costInPHP', '$amount']
            }
          }
        }
      }
    ]);

    // Get paginated purchases
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const purchases = await CoinTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'username fullName email');

    const total = await CoinTransaction.countDocuments(filter);

    // Prepare statistics
    const stats = statsAggregation[0] || {
      totalPurchases: 0,
      totalCoins: 0,
      totalCostPHP: 0
    };

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchases: stats.totalPurchases || 0,
          totalCoins: stats.totalCoins || 0,
          totalCostPHP: stats.totalCostPHP || 0
        },
        statusBreakdown: statusBreakdown.map(item => ({
          status: item._id || 'unknown',
          count: item.count,
          totalCoins: item.totalCoins,
          totalCostPHP: item.totalCostPHP
        })),
        paymentMethodBreakdown: paymentMethodBreakdown
          .filter(item => item._id) // Filter out null payment methods
          .map(item => ({
            paymentMethod: item._id,
            count: item.count,
            totalCoins: item.totalCoins,
            totalCostPHP: item.totalCostPHP
          })),
        purchases
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      filters: {
        startDate,
        endDate,
        status
      },
      message: `Found ${total} coin purchase records`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Validation rules
export const purchaseCoinsValidation = [
  body('amount')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Amount must be between 1 and 10,000 coins'),
  body('paymentMethod')
    .isIn(['cash', 'bank_transfer', 'gcash'])
    .withMessage('Invalid payment method'),
  body('paymentReference')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment reference must be 1-100 characters')
];

export const awardCoinsValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('amount')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Amount must be between 1 and 1,000 coins'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be 5-200 characters')
];

export const deductCoinsValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('amount')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Amount must be between 1 and 1,000 coins'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be 5-200 characters')
];

export const useCoinsValidation = [
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isMongoId()
    .withMessage('Invalid payment ID')
];

// Record page visit and deduct coins
export const recordPageVisit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { route, coinCost, description } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!route || coinCost === undefined || coinCost < 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid page visit data'
    });
  }

  // Skip if no coins required
  if (coinCost === 0) {
    return res.status(200).json({
      success: true,
      data: {
        coinsDeducted: 0,
        remainingBalance: req.user.coinBalance,
        route,
        timestamp: new Date().toISOString()
      },
      message: 'Page visit recorded (no coins required)'
    });
  }

  // Check if user has sufficient coins
  if (req.user.coinBalance < coinCost) {
    return res.status(400).json({
      success: false,
      error: `Insufficient coins. You have ${req.user.coinBalance} coins but need ${coinCost} coins.`,
      data: {
        coinsDeducted: 0,
        remainingBalance: req.user.coinBalance,
        route,
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    // Create coin transaction for page visit
    const transaction = await (CoinTransaction as any).createTransaction(
      req.user._id,
      'spent',
      coinCost,
      description || `Page visit: ${route}`,
      {
        referenceType: 'page_visit',
        metadata: {
          route,
          timestamp: new Date().toISOString(),
          source: 'page_navigation'
        }
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        coinsDeducted: coinCost,
        remainingBalance: transaction.balanceAfter,
        route,
        timestamp: new Date().toISOString()
      },
      message: `Page visit recorded. ${coinCost} coins deducted.`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export const pageVisitValidation = [
  body('route')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Route must be 1-100 characters'),
  body('coinCost')
    .isInt({ min: 0, max: 100 })
    .withMessage('Coin cost must be between 0 and 100'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

// Get pending coin purchases (Admin only)
export const getPendingPurchases = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pendingPurchases = await CoinTransaction.find({
      type: 'purchased',
      status: 'pending'
    })
    .populate('userId', 'username fullName email')
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: pendingPurchases,
      message: `Found ${pendingPurchases.length} pending coin purchases`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Approve coin purchase (Admin only)
export const approveCoinPurchase = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { approvalNote } = req.body;

    // Find the pending transaction
    const transaction = await CoinTransaction.findOne({
      _id: transactionId,
      type: 'purchased',
      status: 'pending'
    }).populate('userId', 'username fullName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Pending coin purchase not found'
      });
    }

    // Update transaction status and approve
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      approvedBy: req.user?._id?.toString(),
      approvalNote: approvalNote || 'Approved by admin',
      approvedAt: new Date().toISOString()
    } as any;

    // Update user's coin balance
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.coinBalance += transaction.amount;
    await user.save();
    await transaction.save();

    return res.status(200).json({
      success: true,
      data: transaction,
      message: `Successfully approved coin purchase of ${transaction.amount} coins for ${user.fullName}`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Reject coin purchase (Admin only)
export const rejectCoinPurchase = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { rejectionReason } = req.body;

    // Find the pending transaction
    const transaction = await CoinTransaction.findOne({
      _id: transactionId,
      type: 'purchased',
      status: 'pending'
    }).populate('userId', 'username fullName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Pending coin purchase not found'
      });
    }

    // Update transaction status to failed
    transaction.status = 'failed';
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      rejectedBy: req.user?._id?.toString(),
      rejectionReason: rejectionReason || 'Rejected by admin',
      rejectedAt: new Date().toISOString()
    } as any;

    await transaction.save();

    return res.status(200).json({
      success: true,
      data: transaction,
      message: `Rejected coin purchase request of ${transaction.amount} coins for ${(transaction.userId as any).fullName}`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});