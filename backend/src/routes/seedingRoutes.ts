import { Router, Response } from 'express';
import { requireApprovedUser, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import SeedingService from '../services/seedingService';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Get current player rankings
router.get('/rankings', 
  requireApprovedUser,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const rankings = await SeedingService.getRankings(limit);

      res.json({
        success: true,
        data: {
          rankings,
          total: rankings.length,
          limit
        }
      });
      return;
    } catch (error) {
      console.error('❌ Error getting rankings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rankings'
      });
      return;
    }
  }
);

// Get detailed stats for a specific player
router.get('/player/:userId/stats',
  requireApprovedUser,
  [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      const stats = await SeedingService.getPlayerStats(userId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Player not found or inactive'
        });
      }

      res.json({
        success: true,
        data: stats
      });
      return;
    } catch (error) {
      console.error('❌ Error getting player stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get player stats'
      });
      return;
    }
  }
);

// Get tournament statistics (available to all approved users)
router.get('/tournament-stats',
  requireApprovedUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await SeedingService.getTournamentStats();

      res.json({
        success: true,
        data: stats
      });
      return;
    } catch (error) {
      console.error('❌ Error getting tournament stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tournament stats'
      });
      return;
    }
  }
);

// Recalculate all seed points (admin only - dangerous operation)
router.post('/recalculate',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`🔄 Admin ${req.user?.username} initiated seed point recalculation`);
      
      const result = await SeedingService.recalculateAllPoints();

      res.json({
        success: true,
        message: 'Seed points recalculated successfully',
        data: result
      });
      return;
    } catch (error) {
      console.error('❌ Error recalculating seed points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recalculate seed points'
      });
      return;
    }
  }
);

// Get current user's ranking and stats
router.get('/my-stats',
  requireApprovedUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const stats = await SeedingService.getPlayerStats(userId.toString());

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Player stats not found'
        });
      }

      res.json({
        success: true,
        data: stats
      });
      return;
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get your stats'
      });
      return;
    }
  }
);

// TEST ENDPOINT: Direct point awarding (for debugging)
router.post('/test-award-points',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, points, reason } = req.body;
      
      console.log(`🧪 TEST: Awarding ${points} points to user ${userId} for: ${reason}`);
      
      await SeedingService.awardPoints(userId, points, reason || 'Test award');
      
      res.json({
        success: true,
        message: `Successfully awarded ${points} points`,
        data: { userId, points, reason }
      });
      return;
    } catch (error) {
      console.error('❌ Test point award failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to award test points',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }
);

export default router;