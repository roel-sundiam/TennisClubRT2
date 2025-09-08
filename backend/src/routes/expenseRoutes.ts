import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenseStats,
  expenseValidationRules
} from '../controllers/expenseController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/expenses
 * @desc Get all expenses with pagination and filtering
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getAllExpenses
);

/**
 * @route GET /api/expenses/categories
 * @desc Get all expense categories
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/categories',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getExpenseCategories
);

/**
 * @route GET /api/expenses/stats
 * @desc Get expense statistics
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getExpenseStats
);

/**
 * @route GET /api/expenses/:id
 * @desc Get single expense by ID
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getExpenseById
);

/**
 * @route POST /api/expenses
 * @desc Create new expense
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  expenseValidationRules,
  createExpense
);

/**
 * @route PUT /api/expenses/:id
 * @desc Update existing expense
 * @access Private (Admin/SuperAdmin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  expenseValidationRules,
  updateExpense
);

/**
 * @route DELETE /api/expenses/:id
 * @desc Delete expense
 * @access Private (Admin/SuperAdmin)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  deleteExpense
);

export default router;