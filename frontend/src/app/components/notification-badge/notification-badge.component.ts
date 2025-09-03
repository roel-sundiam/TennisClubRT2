import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService, NotificationSummary } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="notification-badge-container" [class.has-notifications]="notificationCount > 0">
      <button 
        mat-icon-button
        [matBadge]="notificationCount > 0 ? notificationCount : null"
        [matBadgeColor]="getBadgeColor()"
        matBadgeSize="small"
        [matBadgeHidden]="notificationCount === 0"
        [title]="getTooltipText()"
        (click)="onBadgeClick()">
        <mat-icon [class]="getIconClass()">{{getIcon()}}</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .notification-badge-container {
      position: relative;
      display: inline-block;
    }

    .has-notifications button {
      animation: pulse 2s infinite;
    }

    .mat-icon {
      transition: all 0.3s ease;
    }

    .icon-urgent {
      color: #e74c3c;
    }

    .icon-warning {
      color: #f39c12;
    }

    .icon-normal {
      color: #7f8c8d;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    button:hover .mat-icon {
      transform: scale(1.2);
    }
  `]
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  @Input() showIcon: boolean = true;
  @Input() clickable: boolean = true;

  notificationSummary: NotificationSummary = {
    overdueCount: 0,
    dueSoonCount: 0,
    dueTodayCount: 0,
    openPlayCount: 0,
    totalCount: 0,
    notifications: []
  };

  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.notificationService.notifications$.subscribe(summary => {
        this.notificationSummary = summary;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get notificationCount(): number {
    return this.notificationSummary.totalCount;
  }

  getBadgeColor(): 'primary' | 'accent' | 'warn' {
    if (this.notificationSummary.overdueCount > 0) {
      return 'warn';
    }
    if (this.notificationSummary.dueTodayCount > 0) {
      return 'accent';
    }
    return 'primary';
  }

  getIcon(): string {
    if (this.notificationSummary.overdueCount > 0) {
      return 'warning';
    }
    if (this.notificationSummary.totalCount > 0) {
      return 'notifications';
    }
    return 'notifications_none';
  }

  getIconClass(): string {
    if (this.notificationSummary.overdueCount > 0) {
      return 'icon-urgent';
    }
    if (this.notificationSummary.dueTodayCount > 0) {
      return 'icon-warning';
    }
    return 'icon-normal';
  }

  getTooltipText(): string {
    if (this.notificationCount === 0) {
      return 'No payment notifications';
    }

    const parts = [];
    if (this.notificationSummary.overdueCount > 0) {
      parts.push(`${this.notificationSummary.overdueCount} overdue`);
    }
    if (this.notificationSummary.dueTodayCount > 0) {
      parts.push(`${this.notificationSummary.dueTodayCount} due today`);
    }
    if (this.notificationSummary.dueSoonCount > 0) {
      parts.push(`${this.notificationSummary.dueSoonCount} due soon`);
    }

    return `Payment notifications: ${parts.join(', ')}`;
  }

  onBadgeClick(): void {
    if (this.clickable) {
      // Emit event or navigate to payments page
      console.log('Notification badge clicked - navigate to payments');
      // Could emit an event or use router to navigate
      // For now, just log to console
    }
  }
}