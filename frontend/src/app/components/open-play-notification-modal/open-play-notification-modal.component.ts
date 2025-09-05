import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { OpenPlayNotification } from '../../services/notification.service';
import { ModalManagerService } from '../../services/modal-manager.service';

export interface OpenPlayModalData {
  notifications: OpenPlayNotification[];
}

@Component({
  selector: 'app-open-play-notification-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="open-play-modal">
      <!-- Mobile swipe indicator -->
      <div class="swipe-indicator" *ngIf="isMobileDevice()">
        <div class="swipe-line"></div>
      </div>
      
      <div mat-dialog-title class="modal-header">
        <div class="header-content">
          <mat-icon class="header-icon">groups</mat-icon>
          <div class="header-text">
            <h2>Open Play Events</h2>
            <span class="subtitle">{{getModalSubtitle()}}</span>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="modal-content">
        <div *ngFor="let notification of data.notifications" class="notification-item">
          <mat-card class="notification-card" [ngClass]="getNotificationClass(notification.type)">
            <mat-card-header>
              <mat-icon mat-card-avatar [class]="getIconClass(notification.type)">
                {{getIconName(notification.type)}}
              </mat-icon>
              <mat-card-title>{{notification.title}}</mat-card-title>
              <mat-card-subtitle>{{notification.message}}</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <div class="event-details">
                <div class="detail-item">
                  <mat-icon>event</mat-icon>
                  <span>{{formatEventDate(notification.eventDate)}}</span>
                </div>
                <div class="detail-item">
                  <mat-icon>schedule</mat-icon>
                  <span>{{formatEventTime(notification.startTime, notification.endTime)}}</span>
                </div>
                <div class="detail-item">
                  <mat-icon>people</mat-icon>
                  <span>{{notification.confirmedPlayers}}/{{notification.maxPlayers}} players</span>
                </div>
              </div>
              
              <div *ngIf="notification.hasVoted" class="vote-status">
                <mat-icon [class]="notification.userVote === 'Yes' ? 'vote-yes' : 'vote-no'">
                  {{notification.userVote === 'Yes' ? 'check_circle' : 'cancel'}}
                </mat-icon>
                <span>You voted: <strong>{{notification.userVote}}</strong></span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div mat-dialog-actions class="modal-actions">
        <button mat-button mat-dialog-close class="secondary-button">
          <mat-icon>close</mat-icon>
          Dismiss
        </button>
        <button mat-raised-button color="primary" (click)="viewPolls()">
          <mat-icon>how_to_vote</mat-icon>
          View & Vote
        </button>
      </div>
    </div>
  `,
  styleUrl: './open-play-notification-modal.component.scss'
})
export class OpenPlayNotificationModalComponent {
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  
  constructor(
    public dialogRef: MatDialogRef<OpenPlayNotificationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OpenPlayModalData,
    private router: Router,
    private modalManagerService: ModalManagerService
  ) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartY = event.touches[0].clientY;
      this.touchStartTime = Date.now();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
      const touchEndY = event.changedTouches[0].clientY;
      const touchDuration = Date.now() - this.touchStartTime;
      const touchDistance = this.touchStartY - touchEndY;
      
      // Close modal on swipe up gesture (mobile pattern)
      if (touchDistance > 100 && touchDuration < 300 && this.isMobileDevice()) {
        this.dialogRef.close();
      }
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Adjust modal on orientation change
    if (this.isMobileDevice()) {
      this.dialogRef.updateSize(window.innerWidth > window.innerHeight ? '90vw' : '95vw');
    }
  }

  getModalSubtitle(): string {
    const count = this.data.notifications.length;
    if (count === 1) {
      return 'You have 1 Open Play notification';
    }
    return `You have ${count} Open Play notifications`;
  }

  getNotificationClass(type: string): string {
    const classes: Record<string, string> = {
      'open_play_new': 'new-event',
      'open_play_reminder': 'reminder',
      'open_play_closed': 'closed',
      'matches_ready': 'matches-ready'
    };
    return classes[type] || 'default';
  }

  getIconClass(type: string): string {
    const classes: Record<string, string> = {
      'open_play_new': 'icon-new',
      'open_play_reminder': 'icon-reminder',
      'open_play_closed': 'icon-closed',
      'matches_ready': 'icon-matches'
    };
    return classes[type] || 'icon-default';
  }

  getIconName(type: string): string {
    const icons: Record<string, string> = {
      'open_play_new': 'notification_important',
      'open_play_reminder': 'access_time',
      'open_play_closed': 'event_available',
      'matches_ready': 'sports_tennis'
    };
    return icons[type] || 'info';
  }

  formatEventDate(eventDate: Date): string {
    const date = new Date(eventDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatEventTime(startTime: number, endTime: number): string {
    const formatHour = (hour: number) => {
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    };
    
    return `${formatHour(startTime)} - ${formatHour(endTime)}`;
  }

  viewPolls(): void {
    console.log('🗳️ Modal: View & Vote button clicked');
    
    // Ensure all Open Play modals are closed
    this.modalManagerService.closeOpenPlayModal();
    
    // Navigate directly using router for more reliable navigation
    this.router.navigate(['/polls']).then(success => {
      if (success) {
        console.log('🗳️ Modal: Successfully navigated to polls');
      } else {
        console.error('🗳️ Modal: Navigation to polls failed');
        // Fallback to window location
        window.location.href = '/polls';
      }
    });
  }

  isMobileDevice(): boolean {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}