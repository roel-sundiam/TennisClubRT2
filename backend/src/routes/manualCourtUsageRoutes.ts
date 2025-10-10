import { Router } from 'express';
import {
  createManualCourtUsage,
  getManualCourtUsageHistory,
  createManualCourtUsageValidation
} from '../controllers/manualCourtUsageController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/manual-court-usage
 * @desc Create manual court usage record and generate pending payments
 * @access Private (Superadmin only)
 */
router.post(
  '/',
  authenticateToken,
  requireSuperAdmin,
  createManualCourtUsageValidation,
  createManualCourtUsage
);

/**
 * @route GET /api/manual-court-usage
 * @desc Get manual court usage history
 * @access Private (Superadmin only)
 */
router.get(
  '/',
  authenticateToken,
  requireSuperAdmin,
  getManualCourtUsageHistory
);

export default router;
