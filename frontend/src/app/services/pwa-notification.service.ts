import { Injectable } from '@angular/core';
import { SwPush, SwUpdate } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { OpenPlayNotificationModalComponent } from '../components/open-play-notification-modal/open-play-notification-modal.component';
import { ModalManagerService } from './modal-manager.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PWANotificationService {
  private VAPID_PUBLIC_KEY = ''; // Will be fetched from backend
  private openPlayClickSubject = new Subject<any>();
  
  // Observable for other services to subscribe to notification clicks
  public openPlayNotificationClicked$ = this.openPlayClickSubject.asObservable();
  
  constructor(
    private swPush: SwPush,
    private swUpdate: SwUpdate,
    private http: HttpClient,
    private dialog: MatDialog,
    private modalManagerService: ModalManagerService
  ) {
    this.fetchVapidKey();
  }

  /**
   * Fetch VAPID public key from backend
   */
  private async fetchVapidKey(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{success: boolean, data: {publicKey: string}}>(`${environment.apiUrl}/notifications/vapid-key`)
      );
      
      if (response.success) {
        this.VAPID_PUBLIC_KEY = response.data.publicKey;
        console.log('✅ VAPID public key fetched successfully');
      }
    } catch (error) {
      console.error('❌ Failed to fetch VAPID key:', error);
      // Fallback to hardcoded key for development
      this.VAPID_PUBLIC_KEY = 'BJbkAXA92DdoDfGnxAt8ExE5rGeQpeIvd1bzGoGjSv0_j3KUkrxkAfufqr1SXnUHfzbuUSgUDKz8DBT2tU_nLuY';
    }
  }

  /**
   * Check if push notifications are supported
   */
  isPushNotificationSupported(): boolean {
    return this.swPush.isEnabled && 'Notification' in window;
  }

  /**
   * Request permission for notifications
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isPushNotificationSupported()) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get current notification permission status
   */
  getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.isPushNotificationSupported()) {
      console.log('Push notifications not supported');
      return null;
    }

    const hasPermission = await this.requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return null;
    }

    try {
      if (!this.VAPID_PUBLIC_KEY) {
        console.log('VAPID key not available, fetching...');
        await this.fetchVapidKey();
      }

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      });
      
      // Send subscription to backend
      if (subscription) {
        await this.sendSubscriptionToBackend(subscription);
      }
      
      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.toJSON().keys?.p256dh || '',
          auth: subscription.toJSON().keys?.auth || ''
        }
      };

      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/notifications/subscribe`, subscriptionData)
      );

      console.log('✅ Subscription sent to backend successfully');
    } catch (error) {
      console.error('❌ Failed to send subscription to backend:', error);
    }
  }

  /**
   * Show local notification for Open Play events
   */
  showOpenPlayNotification(title: string, body: string, data?: any): void {
    if (this.getNotificationPermission() !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Check if app is in focus (don't show notification if user is actively using app)
    if (document.visibilityState === 'visible') {
      console.log('App is in focus, WebSocket will handle this');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'open-play-notification',
        requireInteraction: true,
        silent: false,
        data: data || {}
      });

      notification.onclick = () => {
        console.log('🎾 PWA notification clicked, focusing window and preparing modal');
        window.focus();
        
        // Store notification data for showing modal when app becomes visible
        if (data) {
          localStorage.setItem('pendingOpenPlayNotification', JSON.stringify({
            ...data,
            notificationTitle: title,
            notificationBody: body,
            timestamp: new Date().toISOString()
          }));
        }
        
        // Emit event for subscribers
        this.openPlayClickSubject.next(data);
        
        if (data?.url) {
          window.location.href = data.url;
        } else {
          window.location.href = '/dashboard';
        }
        notification.close();
      };

      // Auto close after 15 seconds (longer for open play events)
      setTimeout(() => {
        notification.close();
      }, 15000);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Handle service worker push events
   */
  listenForPushNotifications(): void {
    if (!this.isPushNotificationSupported()) {
      return;
    }

    this.swPush.messages.subscribe(
      (message: any) => {
        console.log('Received push message:', message);
        
        if (message.notification) {
          this.showOpenPlayNotification(
            message.notification.title,
            message.notification.body,
            message.notification.data
          );
        }
      },
      (error) => {
        console.error('Error receiving push message:', error);
      }
    );

    // Handle notification click events
    this.swPush.notificationClicks.subscribe(
      ({ action, notification }) => {
        console.log('Notification clicked:', action, notification);
        
        switch (action) {
          case 'view':
            window.focus();
            if (notification.data?.url) {
              window.location.href = notification.data.url;
            } else {
              window.location.href = '/polls';
            }
            break;
          case 'dismiss':
          default:
            // Just close the notification
            break;
        }
      },
      (error) => {
        console.error('Error handling notification click:', error);
      }
    );
  }

  /**
   * Check if app is installed as PWA
   */
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Show install prompt for PWA
   */
  showInstallPrompt(): void {
    // This would typically be triggered by beforeinstallprompt event
    console.log('PWA install prompt would be shown here');
  }

  /**
   * Initialize PWA notification service
   */
  init(): void {
    if (this.isPushNotificationSupported()) {
      this.listenForPushNotifications();
      
      // Auto-request permission if PWA is installed and permission is default
      if (this.isPWAInstalled() && this.getNotificationPermission() === 'default') {
        this.requestNotificationPermission();
      }
    }
  }

  /**
   * Create and show notification for Open Play events
   */
  notifyOpenPlayEvent(
    eventTitle: string,
    eventMessage: string,
    eventDate: Date,
    startTime: number,
    endTime: number
  ): void {
    const title = `🎾 ${eventTitle}`;
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = `${startTime}:00-${endTime}:00`;
    const body = `${eventMessage}\n📅 ${dateStr} at ${timeStr}`;
    
    this.showOpenPlayNotification(title, body, {
      url: '/polls',
      eventDate: eventDate.toISOString(),
      startTime,
      endTime
    });
  }

  /**
   * Check for pending open play notifications and show modal
   */
  checkAndShowPendingNotification(): void {
    const pendingData = localStorage.getItem('pendingOpenPlayNotification');
    if (pendingData) {
      try {
        const notificationData = JSON.parse(pendingData);
        console.log('🎾 Found pending open play notification:', notificationData);
        
        // Clear the pending notification
        localStorage.removeItem('pendingOpenPlayNotification');
        
        // Create modal notification format
        const modalNotification = {
          id: 'pwa-' + Date.now(),
          type: 'open_play_new' as const,
          title: 'New Open Play Event!',
          message: notificationData.notificationBody || 'Vote to join the Open Play event!',
          eventDate: new Date(notificationData.eventDate),
          startTime: notificationData.startTime || 0,
          endTime: notificationData.endTime || 0,
          confirmedPlayers: 0,
          maxPlayers: 12,
          pollId: notificationData.pollId || '',
          hasVoted: false
        };

        // Show modal with small delay to ensure app is fully loaded
        setTimeout(() => {
          const dialogRef = this.modalManagerService.showOpenPlayModal(
            { notifications: [modalNotification] },
            { panelClass: ['open-play-modal', 'pwa-triggered'] }
          );

          // Handle modal result if modal was actually opened
          if (dialogRef) {
            dialogRef.afterClosed().subscribe(result => {
              console.log('🎾 PWA-triggered modal closed with result:', result);
              if (result === 'navigate-polls') {
                window.location.href = '/polls';
              }
            });
          }
        }, 500);

      } catch (error) {
        console.error('Error parsing pending notification data:', error);
        localStorage.removeItem('pendingOpenPlayNotification');
      }
    }
  }
}