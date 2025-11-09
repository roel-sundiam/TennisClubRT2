import { Router, Request, Response, NextFunction } from 'express';
import {
  getCoinBalance,
  getCoinTransactions,
  purchaseCoins,
  awardCoins,
  deductCoins,
  useCoinsForPayment,
  getCoinStats,
  reverseTransaction,
  recordPageVisit,
  getPendingPurchases,
  approveCoinPurchase,
  rejectCoinPurchase,
  getCoinPurchaseReport,
  purchaseCoinsValidation,
  awardCoinsValidation,
  deductCoinsValidation,
  useCoinsValidation,
  pageVisitValidation
} from '../controllers/coinController';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }
  next();
};

/**
 * @route GET /api/coins/balance
 * @desc Get user's coin balance and recent transactions
 * @access Private
 */
router.get('/balance', authenticateToken, getCoinBalance);

/**
 * @route GET /api/coins/transactions
 * @desc Get user's coin transaction history
 * @access Private
 */
router.get('/transactions', authenticateToken, getCoinTransactions);

/**
 * @route POST /api/coins/purchase
 * @desc Purchase coins
 * @access Private
 */
router.post(
  '/purchase',
  authenticateToken,
  purchaseCoinsValidation,
  handleValidationErrors,
  purchaseCoins
);

/**
 * @route POST /api/coins/award
 * @desc Award coins to a user (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/award',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  awardCoinsValidation,
  handleValidationErrors,
  awardCoins
);

/**
 * @route POST /api/coins/deduct
 * @desc Deduct coins from a user (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/deduct',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  deductCoinsValidation,
  handleValidationErrors,
  deductCoins
);

/**
 * @route POST /api/coins/use-for-payment
 * @desc Use coins to pay for a reservation
 * @access Private
 */
router.post(
  '/use-for-payment',
  authenticateToken,
  useCoinsValidation,
  handleValidationErrors,
  useCoinsForPayment
);

/**
 * @route GET /api/coins/stats
 * @desc Get coin system statistics
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getCoinStats
);

/**
 * @route POST /api/coins/page-visit
 * @desc Record a page visit and deduct coins
 * @access Private
 */
router.post(
  '/page-visit',
  authenticateToken,
  pageVisitValidation,
  handleValidationErrors,
  recordPageVisit
);

/**
 * @route PUT /api/coins/transactions/:id/reverse
 * @desc Reverse a coin transaction (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.put(
  '/transactions/:id/reverse',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  reverseTransaction
);

/**
 * @route GET /api/coins/purchases/pending
 * @desc Get pending coin purchases for admin approval
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/purchases/pending',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getPendingPurchases
);

/**
 * @route GET /api/coins/purchases/report
 * @desc Get coin purchase report with statistics
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/purchases/report',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getCoinPurchaseReport
);

/**
 * @route POST /api/coins/purchases/:transactionId/approve
 * @desc Approve a pending coin purchase
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/purchases/:transactionId/approve',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  approveCoinPurchase
);

/**
 * @route POST /api/coins/purchases/:transactionId/reject
 * @desc Reject a pending coin purchase
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/purchases/:transactionId/reject',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  rejectCoinPurchase
);

export default router;