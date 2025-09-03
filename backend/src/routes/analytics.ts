import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { PageView, UserActivity, SessionInfo } from '../models/Analytics';
import { PageViewData, UserActivityData, SessionData } from '../types';

const router = express.Router();

// Helper function to parse user agent
const parseUserAgent = (userAgent: string) => {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);
  
  let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';

  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return { deviceType, browser, os };
};

// Test route (no auth required)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Analytics routes are working!' });
});

// Track page view
router.post('/pageview', async (req, res) => {
  try {
    const { userId, sessionId, page, path, referrer, duration } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    const pageViewData: PageViewData = {
      userId,
      sessionId,
      page,
      path,
      referrer,
      userAgent,
      ipAddress,
      duration,
      deviceType,
      browser,
      os
    };

    const pageView = new PageView(pageViewData);
    await pageView.save();

    // Update session info
    await SessionInfo.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { pageViews: 1 },
        $set: { endTime: new Date() }
      },
      { upsert: false }
    );

    console.log('📊 Page view tracked:', page);
    res.json({
      success: true,
      message: 'Page view tracked successfully'
    });
  } catch (error: any) {
    console.error('❌ Error tracking page view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page view',
      error: error.message
    });
  }
});

// Track user activity
router.post('/activity', async (req, res) => {
  try {
    const { userId, sessionId, action, component, details } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    if (!userId || !sessionId || !action || !component) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, sessionId, action, component'
      });
    }

    const activityData: UserActivityData = {
      userId,
      sessionId,
      action,
      component,
      details,
      userAgent,
      ipAddress
    };

    const activity = new UserActivity(activityData);
    await activity.save();

    // Update session info
    await SessionInfo.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { actions: 1 },
        $set: { endTime: new Date() }
      },
      { upsert: false }
    );

    console.log('📊 User activity tracked:', action, component);
    res.json({
      success: true,
      message: 'User activity tracked successfully'
    });
  } catch (error: any) {
    console.error('❌ Error tracking user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track user activity',
      error: error.message
    });
  }
});

// Start session
router.post('/session/start', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    const sessionData: SessionData = {
      sessionId,
      userId,
      startTime: new Date(),
      ipAddress,
      userAgent,
      deviceInfo: {
        type: deviceType,
        browser,
        os
      }
    };

    const session = new SessionInfo(sessionData);
    await session.save();

    console.log('📊 Session started:', sessionId);
    res.json({
      success: true,
      message: 'Session started successfully',
      data: { sessionId }
    });
  } catch (error: any) {
    console.error('❌ Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session',
      error: error.message
    });
  }
});

// End session
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await SessionInfo.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();

    await SessionInfo.updateOne(
      { sessionId },
      { 
        endTime,
        duration
      }
    );

    console.log('📊 Session ended:', sessionId);
    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error: any) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
      error: error.message
    });
  }
});

// Get analytics dashboard data (Admin only)
router.get('/dashboard', (req, res, next) => {
  console.log('📊 Analytics dashboard route HIT - before auth middleware');
  next();
}, authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Analytics dashboard route called - USER AUTHENTICATED');
    const { dateFrom, dateTo, period = '7d' } = req.query;
    
    let fromDate: Date;
    let toDate: Date = new Date();
    
    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom as string);
      toDate = new Date(dateTo as string);
    } else {
      // Default periods
      const now = new Date();
      switch (period) {
        case '1d':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Get basic counts first
    const pageViewCount = await PageView.countDocuments({
      timestamp: { $gte: fromDate, $lte: toDate }
    });

    const userActivityCount = await UserActivity.countDocuments({
      timestamp: { $gte: fromDate, $lte: toDate }
    });

    const sessionCount = await SessionInfo.countDocuments({
      startTime: { $gte: fromDate, $lte: toDate }
    });

    // Get simple aggregated data
    const popularPages = await PageView.aggregate([
      { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          page: '$_id',
          views: 1,
          uniqueUsers: '$views', // Simplified for now
          avgDuration: { $round: ['$avgDuration', 0] },
          lastVisit: new Date(),
          _id: 0
        }
      }
    ]);

    const userActivity = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          action: '$_id',
          count: 1,
          uniqueUsers: '$count', // Simplified for now
          _id: 0
        }
      }
    ]);

    // Device and browser breakdown
    const deviceStats = await PageView.aggregate([
      { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const browserStats = await PageView.aggregate([
      { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const deviceBreakdown: Record<string, number> = {};
    deviceStats.forEach(stat => {
      deviceBreakdown[stat._id] = stat.count;
    });

    const browserBreakdown: Record<string, number> = {};
    browserStats.forEach(stat => {
      browserBreakdown[stat._id] = stat.count;
    });

    // Calculate average session duration
    const avgSessionDuration = await SessionInfo.aggregate([
      { $match: { startTime: { $gte: fromDate, $lte: toDate }, duration: { $exists: true } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);

    const analyticsData = {
      pageViews: {
        totalViews: pageViewCount,
        uniqueUsers: Math.ceil(pageViewCount * 0.7), // Estimate
        uniqueSessions: sessionCount,
        avgDuration: 45000 // Default for now
      },
      popularPages: popularPages || [],
      userActivity: userActivity || [],
      engagement: {
        totalSessions: sessionCount,
        avgDuration: avgSessionDuration[0]?.avgDuration || 45000,
        avgPageViews: sessionCount > 0 ? Math.round((pageViewCount / sessionCount) * 10) / 10 : 0,
        avgActions: sessionCount > 0 ? Math.round((userActivityCount / sessionCount) * 10) / 10 : 0,
        bounceRate: 25 // Estimate for now
      },
      deviceBreakdown,
      browserBreakdown,
      dateRange: {
        from: fromDate,
        to: toDate
      }
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error: any) {
    console.error('❌ Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
});

// Get user activity history (Admin only)
router.get('/activity-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Activity history requested');
    const { 
      page = 1, 
      limit = 25, 
      userId, 
      action, 
      component,
      dateFrom,
      dateTo
    } = req.query;

    const matchConditions: any = {};
    
    if (userId) matchConditions.userId = userId;
    if (action) matchConditions.action = action;
    if (component) matchConditions.component = component;
    
    if (dateFrom || dateTo) {
      matchConditions.timestamp = {};
      if (dateFrom) matchConditions.timestamp.$gte = new Date(dateFrom as string);
      if (dateTo) matchConditions.timestamp.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const activities = await UserActivity
      .find(matchConditions)
      .populate('userId', 'fullName username')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await UserActivity.countDocuments(matchConditions);

    res.json({
      success: true,
      data: activities,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasNext: skip + Number(limit) < totalCount,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity history',
      error: error.message
    });
  }
});

export default router;