import { Router } from 'express';
import {
  getPolls,
  getActivePolls,
  getPoll,
  createPoll,
  updatePoll,
  activatePoll,
  closePoll,
  vote,
  getPollStats,
  createOpenPlay,
  generateMatches,
  updateMatchOrder,
  getOpenPlayEvents,
  createPollValidation,
  voteValidation,
  createOpenPlayValidation,
  addAdminVote,
  removeAdminVote,
  removePlayerFromFutureMatches
} from '../controllers/pollController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validationResult } from 'express-validator';

const router = Router();

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
 * @route GET /api/polls/test
 * @desc Test route to verify polls routes are working
 * @access Public
 */
router.get('/test', (req, res) => {
  console.log('🧪 Poll test route called');
  res.json({
    success: true,
    message: 'Poll routes are working!',
    timestamp: new Date().toISOString(),
    note: 'This route should be PUBLIC - no authentication required'
  });
});

/**
 * @route GET /api/polls/health
 * @desc Health check for poll routes
 * @access Public
 */
router.get('/health', (req, res) => {
  console.log('🧪 Poll health route called');
  res.json({
    success: true,
    message: 'Poll routes health check OK',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/polls/active
 * @desc Get active polls for current user
 * @access Private
 */
router.get('/active', authenticateToken, getActivePolls);

/**
 * @route GET /api/polls/stats
 * @desc Get poll statistics (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  getPollStats
);

/**
 * @route GET /api/polls/open-play
 * @desc Get all Open Play events
 * @access Private
 */
router.get('/open-play', authenticateToken, getOpenPlayEvents);

/**
 * @route POST /api/polls/open-play
 * @desc Create new Open Play event (superadmin only)
 * @access Private (SuperAdmin)
 */
router.post(
  '/open-play',
  authenticateToken,
  requireRole(['superadmin']),
  createOpenPlayValidation,
  handleValidationErrors,
  createOpenPlay
);

/**
 * @route GET /api/polls
 * @desc Get all polls with filtering and pagination
 * @access Private
 */
router.get('/', authenticateToken, getPolls);

/**
 * @route POST /api/polls
 * @desc Create new poll (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  createPollValidation,
  handleValidationErrors,
  createPoll
);

/**
 * @route GET /api/polls/:id
 * @desc Get single poll with results
 * @access Private
 */
router.get('/:id', authenticateToken, getPoll);

/**
 * @route PUT /api/polls/:id
 * @desc Update poll (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  updatePoll
);

/**
 * @route POST /api/polls/:id/activate
 * @desc Activate poll (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/:id/activate',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  activatePoll
);

/**
 * @route POST /api/polls/:id/close
 * @desc Close poll (admin only)
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/:id/close',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  closePoll
);

/**
 * @route POST /api/polls/:id/vote
 * @desc Vote on poll
 * @access Private
 */
router.post(
  '/:id/vote',
  authenticateToken,
  voteValidation,
  handleValidationErrors,
  vote
);

/**
 * @route POST /api/polls/:id/generate-matches
 * @desc Generate random doubles matches for Open Play event (superadmin only)
 * @access Private (SuperAdmin)
 */
router.post(
  '/:id/generate-matches',
  authenticateToken,
  requireRole(['superadmin']),
  generateMatches
);

/**
 * @route PUT /api/polls/:id/matches-order
 * @desc Update match order for Open Play event (superadmin only)
 * @access Private (SuperAdmin)
 */
router.put(
  '/:id/matches-order',
  authenticateToken,
  requireRole(['superadmin']),
  updateMatchOrder
);

/**
 * @route POST /api/polls/:id/admin-vote
 * @desc Add vote as admin (admin/superadmin only)
 * @access Private (Admin/SuperAdmin)
 */
router.post(
  '/:id/admin-vote',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  addAdminVote
);

/**
 * @route DELETE /api/polls/:id/admin-vote
 * @desc Remove vote as admin (admin/superadmin only)
 * @access Private (Admin/SuperAdmin)
 */
router.delete(
  '/:id/admin-vote',
  authenticateToken,
  requireRole(['admin', 'superadmin']),
  removeAdminVote
);

/**
 * @route POST /api/polls/:id/remove-player
 * @desc Remove player from future matches and regenerate incomplete matches (superadmin only)
 * @access Private (SuperAdmin)
 */
router.post(
  '/:id/remove-player',
  authenticateToken,
  requireRole(['superadmin']),
  removePlayerFromFutureMatches
);

export default router;