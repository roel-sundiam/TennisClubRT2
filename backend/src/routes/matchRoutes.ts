import { Router } from 'express';
import { 
  recordMatchResult, 
  getOpenPlayMatches,
  recordMatchResultValidation,
  getOpenPlayMatchesValidation
} from '../controllers/matchController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any): void => {
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
 * @route GET /api/matches/open-play/:pollId
 * @desc Get matches for an Open Play event
 * @access Private
 */
router.get('/open-play/:pollId', 
  authenticateToken,
  getOpenPlayMatchesValidation,
  handleValidationErrors,
  getOpenPlayMatches
);

/**
 * @route POST /api/matches/open-play/:pollId/:matchNumber/result
 * @desc Record match result and award seeding points
 * @access Admin only
 */
router.post('/open-play/:pollId/:matchNumber/result',
  authenticateToken,
  requireAdmin,
  recordMatchResultValidation,
  handleValidationErrors,
  recordMatchResult
);

export default router;