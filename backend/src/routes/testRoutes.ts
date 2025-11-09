/**
 * Test Routes for E2E Testing
 * Provides endpoints for test data management
 * IMPORTANT: Only available when NODE_ENV=test
 */

import express from 'express';
import { seedTestData, cleanupTestData, testHealthCheck } from '../controllers/testController';

const router = express.Router();

// Middleware to ensure test environment
const ensureTestEnvironment = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({
      success: false,
      message: 'Test endpoints only available in test environment'
    });
  }
  next();
};

// Apply middleware to all routes
router.use(ensureTestEnvironment);

/**
 * POST /api/test/seed
 * Seed test database with initial data
 */
router.post('/seed', seedTestData);

/**
 * DELETE /api/test/cleanup
 * Clean up test database (remove test data)
 */
router.delete('/cleanup', cleanupTestData);

/**
 * GET /api/test/health
 * Health check for test environment
 */
router.get('/health', testHealthCheck);

export default router;
