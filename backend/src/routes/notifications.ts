import { Router } from 'express';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification,
  sendOpenPlayNotification,
  sendPaymentReminder,
  cleanupSubscriptions
} from '../controllers/notificationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/notifications/vapid-key
 * Get VAPID public key for push subscription
 */
router.get('/vapid-key', getVapidPublicKey);

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 * Requires authentication
 */
router.post('/subscribe', authenticateToken, subscribe);

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', unsubscribe);

/**
 * POST /api/notifications/test
 * Send test notification (admin only)
 * Requires admin privileges
 */
router.post('/test', authenticateToken, requireAdmin, sendTestNotification);

/**
 * POST /api/notifications/open-play
 * Send open play event notification to all members (admin only)
 * Requires admin privileges
 */
router.post('/open-play', authenticateToken, requireAdmin, sendOpenPlayNotification);

/**
 * POST /api/notifications/payment-reminder
 * Send payment reminder to specific user (admin only)
 * Requires admin privileges
 */
router.post('/payment-reminder', authenticateToken, requireAdmin, sendPaymentReminder);

/**
 * POST /api/notifications/cleanup
 * Clean up inactive push subscriptions (admin only)
 * Requires admin privileges
 */
router.post('/cleanup', authenticateToken, requireAdmin, cleanupSubscriptions);

export default router;