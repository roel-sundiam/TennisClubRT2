import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { NotificationService, PaymentNotification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="payment-alerts-container" *ngIf="urgentNotifications.length > 0">
      <div 
        *ngFor="let notification of urgentNotifications; trackBy: trackNotification"
        class="payment-alert"
        [class]="'alert-' + notification.type">
        
        <div class="alert-icon">
          <mat-icon>{{getAlertIcon(notification.type)}}</mat-icon>
        </div>
        
        <div class="alert-content">
          <div class="alert-title">{{notification.title}}</div>
          <div class="alert-message">{{notification.message}}</div>
          <div class="alert-details" *ngIf="notification.type === 'overdue'">
            Due {{notification.daysOverdue}} day{{notification.daysOverdue !== 1 ? 's' : ''}} ago
          </div>
        </div>
        
        <div class="alert-actions">
          <button 
            mat-raised-button
            color="primary"
            (click)="payNowForNotification(notification)"
            class="action-btn">
            Pay Now
          </button>
          <button 
            mat-icon-button
            (click)="dismissAlert(notification.id)"
            class="dismiss-btn"
            title="Dismiss">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-alerts-container {
      margin-bottom: 20px;
    }

    .payment-alert {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      border-left: 4px solid;
      transition: all 0.3s ease;
    }

    .alert-overdue {
      border-left-color: #e74c3c;
      background: linear-gradient(135deg, rgba(231, 76, 60, 0.05) 0%, rgba(231, 76, 60, 0.1) 100%);
      animation: urgentPulse 3s infinite;
    }

    .alert-due_today {
      border-left-color: #f39c12;
      background: linear-gradient(135deg, rgba(243, 156, 18, 0.05) 0%, rgba(243, 156, 18, 0.1) 100%);
    }

    .alert-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
    }

    .alert-overdue .alert-icon {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .alert-due_today .alert-icon {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
    }

    .alert-content {
      flex: 1;
      min-width: 0;
    }

    .alert-title {
      font-weight: 600;
      font-size: 16px;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .alert-message {
      color: #7f8c8d;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .alert-details {
      font-size: 12px;
      font-weight: 500;
      color: #e74c3c;
    }

    .alert-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      font-size: 14px;
      font-weight: 600;
    }

    .dismiss-btn {
      color: #7f8c8d;
      
      &:hover {
        background: rgba(127, 140, 141, 0.1);
        color: #2c3e50;
      }
    }

    @keyframes urgentPulse {
      0% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
      50% { box-shadow: 0 4px 25px rgba(231, 76, 60, 0.3); }
      100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
    }

    .payment-alert:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 768px) {
      .payment-alert {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
        gap: 12px;
      }

      .alert-actions {
        justify-content: center;
        flex-direction: row;
      }

      .alert-content {
        order: -1;
      }

      .alert-icon {
        order: -2;
        align-self: center;
      }
    }
  `]
})
export class PaymentAlertsComponent implements OnInit, OnDestroy {
  urgentNotifications: PaymentNotification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.notificationService.notifications$.subscribe(summary => {
        this.urgentNotifications = this.notificationService.getUrgentPaymentNotifications();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'overdue':
        return 'error';
      case 'due_today':
        return 'warning';
      default:
        return 'info';
    }
  }

  viewPayments(): void {
    this.router.navigate(['/payments']);
  }

  payNowForNotification(notification: PaymentNotification): void {
    // Navigate to payments page with specific reservation pre-selected
    this.router.navigate(['/payments'], {
      queryParams: {
        tab: 'pending',
        reservationId: notification.reservationId,
        paymentId: notification.paymentId
      }
    });
  }

  dismissAlert(notificationId: string): void {
    this.notificationService.dismissNotification(notificationId);
  }

  trackNotification(index: number, notification: PaymentNotification): string {
    return notification.id;
  }
}