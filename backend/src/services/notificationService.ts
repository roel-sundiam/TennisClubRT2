import webpush from 'web-push';
import { PushSubscription, IPushSubscription } from '../models/PushSubscription';
import User from '../models/User';
import { Types } from 'mongoose';

// Initialize web-push with VAPID keys
// In production, these should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key-here';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key-here';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:your-email@tennisclub.com';

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: any;
}

export class NotificationService {
  /**
   * Save push subscription for a user
   */
  static async saveSubscription(
    userId: string, 
    subscriptionData: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    }
  ): Promise<IPushSubscription> {
    try {
      // Remove any existing subscriptions for this endpoint
      await PushSubscription.deleteMany({ endpoint: subscriptionData.endpoint });

      // Create new subscription
      const subscription = new PushSubscription({
        userId: new Types.ObjectId(userId),
        endpoint: subscriptionData.endpoint,
        keys: {
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth
        },
        isActive: true
      });

      await subscription.save();
      console.log('💾 Push subscription saved for user:', userId);
      return subscription;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription
   */
  static async removeSubscription(endpoint: string): Promise<void> {
    try {
      await PushSubscription.deleteMany({ endpoint });
      console.log('🗑️ Push subscription removed:', endpoint);
    } catch (error) {
      console.error('Error removing push subscription:', error);
      throw error;
    }
  }

  /**
   * Send notification to a specific user
   */
  static async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const subscriptions = await PushSubscription.find({
        userId: new Types.ObjectId(userId),
        isActive: true
      });

      if (subscriptions.length === 0) {
        console.log('📵 No active subscriptions for user:', userId);
        return;
      }

      const notificationPayload = JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-192x192.png',
          tag: payload.tag || 'tennis-club',
          requireInteraction: true,
          data: {
            url: payload.url || '/dashboard',
            ...payload.data
          }
        }
      });

      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          }, notificationPayload);

          console.log('✅ Notification sent successfully to:', userId);
        } catch (error: any) {
          console.error('❌ Failed to send notification:', error);
          
          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await PushSubscription.findByIdAndUpdate(
              subscription._id,
              { isActive: false }
            );
            console.log('🚫 Marked subscription as inactive:', subscription.endpoint);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    payload: NotificationPayload
  ): Promise<void> {
    const promises = userIds.map(userId => this.sendToUser(userId, payload));
    await Promise.allSettled(promises);
  }

  /**
   * Send notification to all users with a specific role
   */
  static async sendToRole(
    role: 'member' | 'admin' | 'superadmin',
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const users = await User.find({ 
        role, 
        isApproved: true 
      }, '_id');

      const userIds = users.map((user: any) => user._id.toString());
      await this.sendToUsers(userIds, payload);

      console.log(`📢 Notification sent to ${userIds.length} ${role}s:`, payload.title);
    } catch (error) {
      console.error('Error sending notification to role:', error);
      throw error;
    }
  }

  /**
   * Send reservation reminder notifications
   */
  static async sendReservationReminder(
    userId: string,
    reservationDetails: {
      date: Date;
      timeSlot: number;
      courtName?: string;
      totalFee?: number;
    }
  ): Promise<void> {
    const dateStr = reservationDetails.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    const timeStr = `${reservationDetails.timeSlot}:00-${reservationDetails.timeSlot + 1}:00`;

    await this.sendToUser(userId, {
      title: '🎾 Court Reservation Reminder',
      body: `Your court is reserved for ${dateStr} at ${timeStr}`,
      url: '/my-reservations',
      tag: 'reservation-reminder',
      data: {
        type: 'reservation_reminder',
        reservationDate: reservationDetails.date.toISOString(),
        timeSlot: reservationDetails.timeSlot
      }
    });
  }

  /**
   * Send payment reminder notifications
   */
  static async sendPaymentReminder(
    userId: string,
    paymentDetails: {
      amount: number;
      description: string;
      dueDate?: Date;
    }
  ): Promise<void> {
    const dueDateStr = paymentDetails.dueDate?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    await this.sendToUser(userId, {
      title: '💰 Payment Reminder',
      body: `Payment due: ₱${paymentDetails.amount} - ${paymentDetails.description}${dueDateStr ? ` (Due ${dueDateStr})` : ''}`,
      url: '/payments',
      tag: 'payment-reminder',
      data: {
        type: 'payment_reminder',
        amount: paymentDetails.amount,
        description: paymentDetails.description
      }
    });
  }

  /**
   * Send open play event notifications
   */
  static async sendOpenPlayNotification(
    eventDetails: {
      title: string;
      description: string;
      date: Date;
      startTime: number;
      endTime: number;
    }
  ): Promise<void> {
    const dateStr = eventDetails.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    const timeStr = `${eventDetails.startTime}:00-${eventDetails.endTime}:00`;

    await this.sendToRole('member', {
      title: `🎾 ${eventDetails.title}`,
      body: `${eventDetails.description}\n📅 ${dateStr} at ${timeStr}`,
      url: '/polls',
      tag: 'open-play-event',
      data: {
        type: 'open_play_event',
        eventDate: eventDetails.date.toISOString(),
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime
      }
    });
  }

  /**
   * Get VAPID public key for client subscription
   */
  static getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Clean up inactive subscriptions
   */
  static async cleanupInactiveSubscriptions(): Promise<void> {
    try {
      const result = await PushSubscription.deleteMany({ isActive: false });
      console.log(`🧹 Cleaned up ${result.deletedCount} inactive push subscriptions`);
    } catch (error) {
      console.error('Error cleaning up inactive subscriptions:', error);
    }
  }
}