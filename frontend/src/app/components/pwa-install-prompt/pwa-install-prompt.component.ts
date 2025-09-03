import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PWANotificationService } from '../../services/pwa-notification.service';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pwa-install-container" *ngIf="showInstallPrompt && !isPWAInstalled">
      <mat-card class="install-card">
        <mat-card-header>
          <div mat-card-avatar class="install-avatar">
            <mat-icon>download</mat-icon>
          </div>
          <mat-card-title>Install Tennis Club RT2</mat-card-title>
          <mat-card-subtitle>Get the full app experience</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="install-benefits">
            <div class="benefit-item">
              <mat-icon>offline_bolt</mat-icon>
              <span>Works offline</span>
            </div>
            <div class="benefit-item">
              <mat-icon>notifications</mat-icon>
              <span>Push notifications</span>
            </div>
            <div class="benefit-item">
              <mat-icon>speed</mat-icon>
              <span>Faster loading</span>
            </div>
            <div class="benefit-item">
              <mat-icon>smartphone</mat-icon>
              <span>Native app feel</span>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button color="primary" (click)="dismiss()">
            Maybe Later
          </button>
          <button mat-raised-button color="primary" (click)="install()">
            <mat-icon>download</mat-icon>
            Install App
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <!-- Notification Permission Prompt -->
    <div class="notification-prompt-container" *ngIf="showNotificationPrompt && isPWAInstalled">
      <mat-card class="notification-card">
        <mat-card-header>
          <div mat-card-avatar class="notification-avatar">
            <mat-icon>notifications</mat-icon>
          </div>
          <mat-card-title>Enable Notifications</mat-card-title>
          <mat-card-subtitle>Stay updated on reservations and events</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p>Get notified about:</p>
          <ul>
            <li>Open Play events and tournaments</li>
            <li>Payment reminders</li>
            <li>Reservation confirmations</li>
            <li>Club announcements</li>
          </ul>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="dismissNotificationPrompt()">
            No Thanks
          </button>
          <button mat-raised-button color="primary" (click)="enableNotifications()">
            <mat-icon>notifications_active</mat-icon>
            Enable
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .pwa-install-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 320px;
      animation: slideInUp 0.3s ease-out;
    }

    .notification-prompt-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 320px;
      animation: slideInUp 0.3s ease-out;
    }

    @keyframes slideInUp {
      from {
        transform: translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .install-card, .notification-card {
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    .install-avatar, .notification-avatar {
      background: linear-gradient(135deg, #2196f3, #1976d2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .install-benefits {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    .benefit-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #2196f3;
    }

    mat-card-actions {
      padding: 16px;
      gap: 8px;
    }

    mat-card-actions button {
      border-radius: 8px;
    }

    ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 4px;
      font-size: 0.9rem;
    }

    @media (max-width: 480px) {
      .pwa-install-container,
      .notification-prompt-container {
        bottom: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .install-benefits {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PWAInstallPromptComponent implements OnInit, OnDestroy {
  showInstallPrompt = false;
  showNotificationPrompt = false;
  isPWAInstalled = false;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private promptDismissed = false;

  constructor(private pwaNotificationService: PWANotificationService) {}

  ngOnInit() {
    this.isPWAInstalled = this.pwaNotificationService.isPWAInstalled();
    
    // Check if user previously dismissed the prompt
    this.promptDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
    
    // Check if we should show notification prompt for installed PWA
    if (this.isPWAInstalled) {
      this.checkNotificationPrompt();
    }

    // Show install prompt after a delay if not dismissed and not installed
    if (!this.isPWAInstalled && !this.promptDismissed) {
      setTimeout(() => {
        this.showInstallPrompt = true;
      }, 10000); // Show after 10 seconds
    }
  }

  ngOnDestroy() {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
  }

  private handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
    // Prevent the mini-infobar from appearing
    event.preventDefault();
    
    // Store the event so it can be triggered later
    this.deferredPrompt = event;
    
    // Show our custom install prompt if not dismissed
    if (!this.promptDismissed && !this.isPWAInstalled) {
      this.showInstallPrompt = true;
    }
  }

  private checkNotificationPrompt() {
    const notificationPromptDismissed = localStorage.getItem('notification-prompt-dismissed') === 'true';
    const notificationPermission = this.pwaNotificationService.getNotificationPermission();
    
    if (!notificationPromptDismissed && notificationPermission === 'default') {
      setTimeout(() => {
        this.showNotificationPrompt = true;
      }, 5000); // Show after 5 seconds for installed PWA
    }
  }

  async install() {
    if (!this.deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    // Show the install prompt
    await this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log('PWA install outcome:', outcome);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      // After successful installation, check for notification prompt
      setTimeout(() => {
        this.isPWAInstalled = true;
        this.checkNotificationPrompt();
      }, 2000);
    }
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
    this.showInstallPrompt = false;
  }

  dismiss() {
    this.showInstallPrompt = false;
    this.promptDismissed = true;
    localStorage.setItem('pwa-install-dismissed', 'true');
  }

  async enableNotifications() {
    const granted = await this.pwaNotificationService.requestNotificationPermission();
    
    if (granted) {
      console.log('Notifications enabled successfully');
      // Subscribe to push notifications
      await this.pwaNotificationService.subscribeToPushNotifications();
    }
    
    this.dismissNotificationPrompt();
  }

  dismissNotificationPrompt() {
    this.showNotificationPrompt = false;
    localStorage.setItem('notification-prompt-dismissed', 'true');
  }
}