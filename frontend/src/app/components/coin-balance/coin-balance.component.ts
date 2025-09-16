import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CoinService } from '../../services/coin.service';

@Component({
  selector: 'app-coin-balance',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="coin-balance-container" [class.clickable]="clickable" [class.loading]="isLoading" (click)="onClick()">
      <!-- Loading spinner -->
      <mat-spinner
        *ngIf="isLoading"
        class="loading-spinner"
        diameter="20"
        strokeWidth="3"
        [matTooltip]="'Loading coin balance...'"
        matTooltipPosition="below">
      </mat-spinner>

      <!-- Coin icon (hidden when loading) -->
      <mat-icon
        *ngIf="!isLoading"
        class="coin-icon"
        [class.low-balance]="isLowBalance"
        [matTooltip]="tooltipText"
        matTooltipPosition="below">
        monetization_on
      </mat-icon>

      <div class="balance-info">
        <span class="balance-amount" [class.low-balance]="isLowBalance" [class.loading]="isLoading">
          {{isLoading ? '...' : coinBalance}}
        </span>
        <span class="balance-label">{{isLoading ? 'Loading' : 'Coins'}}</span>
      </div>

      <!-- Low balance warning badge (hidden when loading) -->
      <mat-icon
        *ngIf="!isLoading && isLowBalance && showLowBalanceWarning"
        class="warning-icon"
        matTooltip="Low coin balance! Click to purchase more coins."
        matTooltipPosition="below">
        warning
      </mat-icon>
    </div>
  `,
  styles: [`
    .coin-balance-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      min-width: 100px;
      position: relative;
    }

    .coin-balance-container.clickable {
      cursor: pointer;
    }

    .coin-balance-container.clickable:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .coin-icon {
      color: #ffd700;
      font-size: 24px;
      width: 24px;
      height: 24px;
      transition: color 0.3s ease;
    }

    .coin-icon.low-balance {
      color: #ff6b6b;
      animation: pulse 2s infinite;
    }

    .balance-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .balance-amount {
      font-size: 18px;
      font-weight: 600;
      color: white;
      line-height: 1;
      transition: color 0.3s ease;
    }

    .balance-amount.low-balance {
      color: #ff6b6b;
    }

    .balance-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1;
      margin-top: 2px;
    }

    .warning-icon {
      color: #ff6b6b;
      font-size: 20px;
      width: 20px;
      height: 20px;
      animation: pulse 2s infinite;
      position: absolute;
      top: -5px;
      right: -5px;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    /* Compact mode for smaller displays */
    .coin-balance-container.compact {
      padding: 4px 8px;
      min-width: 80px;
    }

    .coin-balance-container.compact .coin-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .coin-balance-container.compact .balance-amount {
      font-size: 16px;
    }

    .coin-balance-container.compact .balance-label {
      font-size: 11px;
    }

    /* Loading states */
    .coin-balance-container.loading {
      opacity: 0.8;
    }

    .loading-spinner {
      color: #ffd700;
    }

    .balance-amount.loading {
      color: rgba(255, 255, 255, 0.7);
      font-style: italic;
    }

    /* Smooth transitions */
    .balance-amount, .balance-label {
      transition: all 0.3s ease;
    }
  `]
})
export class CoinBalanceComponent implements OnInit, OnDestroy {
  @Input() clickable = true;
  @Input() compact = false;
  @Input() showLowBalanceWarning = true;
  @Input() lowBalanceThreshold = 10;

  coinBalance = 0;
  isLowBalance = false;
  isLoading = true;
  tooltipText = '';

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private coinService: CoinService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to auth loading state
    this.subscriptions.add(
      this.authService.isLoading$.subscribe(isLoading => {
        this.isLoading = isLoading;
        if (!isLoading) {
          // Loading completed, initialize balance
          this.coinBalance = this.authService.getCoinBalance();
          this.updateBalanceStatus();
        }
      })
    );

    // Subscribe to coin balance changes
    this.subscriptions.add(
      this.coinService.coinBalance$.subscribe(balance => {
        if (!this.isLoading && this.coinBalance !== balance) { // Only update if not loading and balance actually changed
          this.coinBalance = balance;
          this.updateBalanceStatus();
          // Update auth service with new balance (without triggering circular update)
          this.authService.updateCoinBalance(balance);
        }
      })
    );

    // Subscribe to user changes (login/logout)
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (!this.isLoading) {
          if (user) {
            const newBalance = user.coinBalance || 0;
            if (this.coinBalance !== newBalance) { // Only update if balance actually changed
              this.coinBalance = newBalance;
              this.updateBalanceStatus();
              // Sync with coin service (without triggering circular update)
              this.coinService.updateBalance(this.coinBalance);
            }
          } else {
            this.coinBalance = 0;
            this.isLowBalance = false;
            this.tooltipText = 'Please log in to view coin balance';
          }
        }
      })
    );

    // Refresh balance from server (only when not loading)
    if (!this.isLoading) {
      this.refreshBalance();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private updateBalanceStatus(): void {
    this.isLowBalance = this.coinBalance < this.lowBalanceThreshold;
    
    if (this.isLowBalance && this.coinBalance > 0) {
      this.tooltipText = `Low balance! You have ${this.coinBalance} coins remaining. Click to purchase more.`;
    } else if (this.coinBalance === 0) {
      this.tooltipText = 'No coins remaining! Click to purchase coins.';
    } else {
      this.tooltipText = `You have ${this.coinBalance} coins. Click to manage your coins.`;
    }
  }

  private refreshBalance(): void {
    if (this.authService.isAuthenticated()) {
      this.coinService.refreshBalance();
    }
  }

  onClick(): void {
    if (this.clickable) {
      // Navigate to coin management page
      if (this.isLowBalance || this.coinBalance === 0) {
        // Go directly to purchase coins if balance is low
        this.router.navigate(['/coins/purchase']);
      } else {
        // Go to coin management dashboard
        this.router.navigate(['/coins']);
      }
    }
  }
}