import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get VAPID public key for client push subscription
 */
export const getVapidPublicKey = async (req: Request, res: Response) => {
  try {
    const publicKey = NotificationService.getVapidPublicKey();
    
    res.json({
      success: true,
      data: {
        publicKey
      }
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VAPID public key'
    });
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.user!.id;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    const subscription = await NotificationService.saveSubscription(userId, {
      endpoint,
      keys
    });

    console.log('📱 User subscribed to push notifications:', {
      userId,
      endpoint: endpoint.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      data: {
        id: subscription._id
      }
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications'
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    await NotificationService.removeSubscription(endpoint);

    console.log('📱 User unsubscribed from push notifications:', {
      endpoint: endpoint.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications'
    });
  }
};

/**
 * Send test notification (admin only)
 */
export const sendTestNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, body, targetUserId } = req.body;
    const adminUser = req.user!;

    // Only admins can send test notifications
    if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const userId = targetUserId || adminUser.id;

    await NotificationService.sendToUser(userId, {
      title: title || '🎾 Test Notification',
      body: body || 'This is a test notification from Tennis Club RT2',
      url: '/dashboard'
    });

    console.log('🧪 Test notification sent by admin:', {
      adminId: adminUser.id,
      targetUserId: userId,
      title
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
};

/**
 * Send open play event notification (admin only)
 */
export const sendOpenPlayNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, date, startTime, endTime } = req.body;
    const adminUser = req.user!;

    // Only admins can send open play notifications
    if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    if (!title || !description || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, date, startTime, endTime'
      });
    }

    await NotificationService.sendOpenPlayNotification({
      title,
      description,
      date: new Date(date),
      startTime,
      endTime
    });

    console.log('📢 Open play notification sent by admin:', {
      adminId: adminUser.id,
      title,
      date: new Date(date).toISOString()
    });

    res.json({
      success: true,
      message: 'Open play notification sent to all members'
    });
  } catch (error) {
    console.error('Error sending open play notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send open play notification'
    });
  }
};

/**
 * Send payment reminder notification (admin only)
 */
export const sendPaymentReminder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, amount, description, dueDate } = req.body;
    const adminUser = req.user!;

    // Only admins can send payment reminders
    if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    if (!userId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, amount, description'
      });
    }

    await NotificationService.sendPaymentReminder(userId, {
      amount,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    console.log('💰 Payment reminder sent by admin:', {
      adminId: adminUser.id,
      targetUserId: userId,
      amount,
      description
    });

    res.json({
      success: true,
      message: 'Payment reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminder'
    });
  }
};

/**
 * Clean up inactive push subscriptions (admin only)
 */
export const cleanupSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user!;

    // Only admins can cleanup subscriptions
    if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    await NotificationService.cleanupInactiveSubscriptions();

    console.log('🧹 Push subscriptions cleanup performed by admin:', adminUser.id);

    res.json({
      success: true,
      message: 'Inactive subscriptions cleaned up successfully'
    });
  } catch (error) {
    console.error('Error cleaning up subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup subscriptions'
    });
  }
};