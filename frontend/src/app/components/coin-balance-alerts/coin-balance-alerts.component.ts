import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CoinService } from '../../services/coin.service';
import { Subscription } from 'rxjs';

interface CoinAlert {
  id: string;
  type: 'critical' | 'low' | 'empty';
  title: string;
  message: string;
  balance: number;
  dismissible: boolean;
}

@Component({
  selector: 'app-coin-balance-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="coin-alerts-container" *ngIf="activeAlerts.length > 0">
      <div 
        *ngFor="let alert of activeAlerts; trackBy: trackAlert"
        class="coin-alert"
        [class]="'alert-' + alert.type">
        
        <div class="alert-icon">
          <mat-icon>{{getAlertIcon(alert.type)}}</mat-icon>
        </div>
        
        <div class="alert-content">
          <div class="alert-title">{{alert.title}}</div>
          <div class="alert-message">{{alert.message}}</div>
          <div class="alert-balance">
            Current balance: {{alert.balance}} coin{{alert.balance !== 1 ? 's' : ''}}
          </div>
        </div>
        
        <div class="alert-actions">
          <button 
            mat-raised-button
            color="primary"
            (click)="purchaseCoins()"
            class="action-btn">
            Buy Coins
          </button>
          <button 
            *ngIf="alert.dismissible"
            mat-icon-button
            (click)="dismissAlert(alert.id)"
            class="dismiss-btn"
            title="Dismiss">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coin-alerts-container {
      margin-bottom: 20px;
    }

    .coin-alert {
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

    .alert-critical {
      border-left-color: #dc3545;
      background: linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(220, 53, 69, 0.1) 100%);
      animation: criticalPulse 2s infinite;
    }

    .alert-low {
      border-left-color: #fd7e14;
      background: linear-gradient(135deg, rgba(253, 126, 20, 0.05) 0%, rgba(253, 126, 20, 0.1) 100%);
      animation: lowPulse 3s infinite;
    }

    .alert-empty {
      border-left-color: #dc3545;
      background: linear-gradient(135deg, rgba(220, 53, 69, 0.08) 0%, rgba(220, 53, 69, 0.15) 100%);
      animation: criticalPulse 1.5s infinite;
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

    .alert-critical .alert-icon {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
    }

    .alert-low .alert-icon {
      background: rgba(253, 126, 20, 0.1);
      color: #fd7e14;
    }

    .alert-empty .alert-icon {
      background: rgba(220, 53, 69, 0.15);
      color: #dc3545;
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

    .alert-balance {
      font-size: 12px;
      font-weight: 500;
      color: #495057;
    }

    .alert-critical .alert-balance,
    .alert-empty .alert-balance {
      color: #dc3545;
    }

    .alert-low .alert-balance {
      color: #fd7e14;
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

    @keyframes criticalPulse {
      0% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
      50% { box-shadow: 0 4px 30px rgba(220, 53, 69, 0.4); }
      100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
    }

    @keyframes lowPulse {
      0% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
      50% { box-shadow: 0 4px 25px rgba(253, 126, 20, 0.3); }
      100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
    }

    .coin-alert:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 768px) {
      .coin-alert {
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
export class CoinBalanceAlertsComponent implements OnInit, OnDestroy {
  activeAlerts: CoinAlert[] = [];
  private subscriptions = new Subscription();
  private dismissedAlerts: Map<string, { timestamp: number; balance: number }> = new Map();
  private currentBalance = 0;

  // Thresholds for different alert levels
  private readonly CRITICAL_THRESHOLD = 2;
  private readonly LOW_THRESHOLD = 10;
  private readonly DISMISSAL_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(
    private authService: AuthService,
    private coinService: CoinService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load dismissed alerts from sessionStorage (clears when browser closes)
    const dismissed = sessionStorage.getItem('coin-alerts-dismissed');
    if (dismissed) {
      const dismissedData = JSON.parse(dismissed);
      this.dismissedAlerts = new Map(dismissedData);
      console.log('🔍 Loaded dismissed coin alerts:', dismissedData);
      
      // Clean up expired dismissals
      this.cleanupExpiredDismissals();
    }

    // Initialize with current balance
    this.currentBalance = this.authService.getCoinBalance();
    console.log('🪙 Initial coin balance:', this.currentBalance);
    this.updateAlerts();

    // Subscribe to coin balance changes
    this.subscriptions.add(
      this.coinService.coinBalance$.subscribe(balance => {
        if (this.currentBalance !== balance) {
          this.currentBalance = balance;
          this.updateAlerts();
        }
      })
    );

    // Subscribe to auth changes
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          const newBalance = user.coinBalance || 0;
          if (this.currentBalance !== newBalance) {
            this.currentBalance = newBalance;
            this.updateAlerts();
          }
        } else {
          this.currentBalance = 0;
          this.activeAlerts = [];
        }
      })
    );

    // Clean up any expired dismissals on startup
    this.cleanupExpiredDismissals();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private updateAlerts(): void {
    this.activeAlerts = [];
    console.log('🔄 Updating coin alerts for balance:', this.currentBalance);

    if (this.currentBalance === 0) {
      console.log('📢 Adding empty balance alert');
      this.addAlert({
        id: 'empty-balance',
        type: 'empty',
        title: '⚠️ No Coins Remaining',
        message: 'You have no coins left! Purchase coins to continue using the platform.',
        balance: this.currentBalance,
        dismissible: false
      });
    } else if (this.currentBalance <= this.CRITICAL_THRESHOLD) {
      console.log('📢 Adding critical balance alert');
      this.addAlert({
        id: 'critical-balance',
        type: 'critical',
        title: '🚨 Critical: Very Low Coin Balance',
        message: 'You\'re almost out of coins! Purchase more to avoid interruptions.',
        balance: this.currentBalance,
        dismissible: true
      });
    } else if (this.currentBalance <= this.LOW_THRESHOLD) {
      console.log('📢 Adding low balance alert');
      this.addAlert({
        id: 'low-balance',
        type: 'low',
        title: '⚡ Low Coin Balance',
        message: 'Your coin balance is running low. Consider purchasing more coins.',
        balance: this.currentBalance,
        dismissible: true
      });
    }
    
    console.log('✅ Final active alerts:', this.activeAlerts.length);
  }

  private addAlert(alert: CoinAlert): void {
    // Don't show dismissed alerts (unless they're not dismissible or conditions changed)
    if (!alert.dismissible) {
      // Always show non-dismissible alerts
      this.activeAlerts.push(alert);
    } else {
      const dismissal = this.dismissedAlerts.get(alert.id);
      const now = Date.now();
      
      if (!dismissal) {
        // Not dismissed, show the alert
        this.activeAlerts.push(alert);
      } else if (now - dismissal.timestamp > this.DISMISSAL_DURATION) {
        // Dismissal expired (30 minutes), show again
        console.log('⏰ Alert dismissal expired, showing again:', alert.id);
        this.dismissedAlerts.delete(alert.id);
        this.saveDismissedAlerts();
        this.activeAlerts.push(alert);
      } else if (dismissal.balance > this.currentBalance) {
        // Balance got worse since dismissal, show alert again
        console.log('📉 Balance got worse since dismissal, showing alert:', alert.id);
        this.dismissedAlerts.delete(alert.id);
        this.saveDismissedAlerts();
        this.activeAlerts.push(alert);
      }
      // Otherwise, keep it dismissed
    }
  }


  getAlertIcon(type: string): string {
    switch (type) {
      case 'critical':
        return 'error';
      case 'empty':
        return 'block';
      case 'low':
        return 'warning';
      default:
        return 'info';
    }
  }

  purchaseCoins(): void {
    this.router.navigate(['/coins/purchase']);
  }

  dismissAlert(alertId: string): void {
    const now = Date.now();
    this.dismissedAlerts.set(alertId, { 
      timestamp: now, 
      balance: this.currentBalance 
    });
    this.saveDismissedAlerts();
    this.activeAlerts = this.activeAlerts.filter(alert => alert.id !== alertId);
    console.log(`⏸️ Dismissed alert ${alertId} for 30 minutes`);
  }

  private saveDismissedAlerts(): void {
    const dismissedArray = Array.from(this.dismissedAlerts.entries());
    sessionStorage.setItem('coin-alerts-dismissed', JSON.stringify(dismissedArray));
  }

  private cleanupExpiredDismissals(): void {
    const now = Date.now();
    let hasExpired = false;
    
    for (const [alertId, dismissal] of this.dismissedAlerts.entries()) {
      if (now - dismissal.timestamp > this.DISMISSAL_DURATION) {
        this.dismissedAlerts.delete(alertId);
        hasExpired = true;
        console.log('🧹 Cleaned up expired dismissal:', alertId);
      }
    }
    
    if (hasExpired) {
      this.saveDismissedAlerts();
    }
  }

  trackAlert(index: number, alert: CoinAlert): string {
    return alert.id;
  }

  // Method to manually clear dismissed alerts for testing
  clearAllDismissedAlerts(): void {
    this.dismissedAlerts.clear();
    sessionStorage.removeItem('coin-alerts-dismissed');
    console.log('🗑️ Manually cleared all dismissed coin alerts');
    this.updateAlerts();
  }
}