import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { CoinService, CoinBalance } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { CoinBalanceComponent } from '../coin-balance/coin-balance.component';
import { LowBalanceWarningComponent } from '../low-balance-warning/low-balance-warning.component';

@Component({
  selector: 'app-coin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    CoinBalanceComponent,
    LowBalanceWarningComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-content">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="title-section">
              <button mat-icon-button (click)="goBack()" class="back-button">
                <mat-icon>arrow_back</mat-icon>
              </button>
              <div class="title-info">
                <h1 class="page-title">
                  <mat-icon>account_balance_wallet</mat-icon>
                  Coin Management
                </h1>
                <p class="page-subtitle">Manage your coins and view transaction history</p>
              </div>
            </div>
            <div class="coin-balance-section">
              <app-coin-balance [compact]="false" [clickable]="false"></app-coin-balance>
            </div>
          </div>
        </div>

        <!-- Balance Overview -->
        <div class="balance-overview-card" *ngIf="coinBalance">
          <div class="card-header">
            <div class="header-icon">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="header-text">
              <h2 class="card-title">Your Coin Balance</h2>
              <p class="card-subtitle">Current status and recent activity</p>
            </div>
          </div>
          <div class="card-content">
          <div class="balance-details">
            <div class="main-balance">
              <span class="balance-amount">{{coinBalance.balance}}</span>
              <span class="balance-label">Coins Available</span>
            </div>
            
            <div class="balance-status" [class.low-balance]="coinBalance.isLowBalance">
              <mat-icon>{{coinBalance.isLowBalance ? 'warning' : 'check_circle'}}</mat-icon>
              <span>{{coinBalance.isLowBalance ? 'Low Balance!' : 'Good Balance'}}</span>
            </div>
          </div>

          <div class="recent-activity" *ngIf="coinBalance.recentTransactions.length > 0">
            <h4>Recent Activity</h4>
            <div class="transaction-list">
              <div class="transaction-item" *ngFor="let transaction of coinBalance.recentTransactions">
                <div class="transaction-icon">
                  <mat-icon [class]="'type-' + transaction.type">
                    {{getTransactionIcon(transaction.type)}}
                  </mat-icon>
                </div>
                <div class="transaction-details">
                  <div class="transaction-description">{{transaction.description}}</div>
                  <div class="transaction-date">{{transaction.createdAt | date:'MMM d, h:mm a'}}</div>
                </div>
                <div class="transaction-amount" [class]="getAmountClass(transaction.type)">
                  {{getAmountPrefix(transaction.type)}}{{transaction.amount}}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <h2 class="section-title">
            <mat-icon>flash_on</mat-icon>
            Quick Actions
          </h2>
          
          <div class="action-grid">
            <!-- Purchase Coins -->
            <div class="action-card" (click)="navigateTo('/coins/purchase')">
              <div class="card-header">
                <div class="header-icon purchase-icon">
                  <mat-icon>add_shopping_cart</mat-icon>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Purchase Coins</h3>
                  <p class="card-subtitle">Buy coins with external payment</p>
                </div>
              </div>
              <div class="card-content">
                <div class="action-description">
                  <p>Request coins at ₱1.00 per coin. Payment processed externally, coins added after admin verification.</p>
                </div>
              </div>
              <div class="card-actions">
                <button mat-raised-button class="action-btn primary">
                  <mat-icon>shopping_cart</mat-icon>
                  Purchase Coins
                </button>
              </div>
            </div>

            <!-- Transaction History -->
            <div class="action-card" (click)="navigateTo('/coins/history')">
              <div class="card-header">
                <div class="header-icon history-icon">
                  <mat-icon>history</mat-icon>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Transaction History</h3>
                  <p class="card-subtitle">View all your coin transactions</p>
                </div>
              </div>
              <div class="card-content">
                <div class="action-description">
                  <p>Review your complete coin transaction history with detailed filters and summaries.</p>
                </div>
              </div>
              <div class="card-actions">
                <button mat-raised-button class="action-btn secondary">
                  <mat-icon>list</mat-icon>
                  View History
                </button>
              </div>
            </div>

            <!-- Usage Analytics -->
            <div class="action-card" (click)="navigateTo('/coins/analytics')">
              <div class="card-header">
                <div class="header-icon analytics-icon">
                  <mat-icon>analytics</mat-icon>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Usage Analytics</h3>
                  <p class="card-subtitle">Track your coin spending patterns</p>
                </div>
              </div>
              <div class="card-content">
                <div class="action-description">
                  <p>Analyze your coin usage patterns and optimize your spending for better value.</p>
                </div>
              </div>
              <div class="card-actions">
                <button mat-raised-button class="action-btn secondary">
                  <mat-icon>trending_up</mat-icon>
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Actions (if admin) -->
        <div class="admin-section" *ngIf="isAdmin">
          <h2 class="section-title admin-title">
            <mat-icon>admin_panel_settings</mat-icon>
            Admin Actions
          </h2>
          
          <div class="admin-grid">
            <!-- Coin Management -->
            <div class="action-card admin-card" (click)="navigateTo('/admin/coins')">
              <div class="card-header">
                <div class="header-icon admin-icon">
                  <mat-icon>settings</mat-icon>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Coin Management</h3>
                  <p class="card-subtitle">Award, deduct, and manage user coins</p>
                </div>
              </div>
              <div class="card-actions">
                <button mat-raised-button class="action-btn admin">
                  <mat-icon>admin_panel_settings</mat-icon>
                  Manage Coins
                </button>
              </div>
            </div>

            <!-- System Statistics -->
            <div class="action-card admin-card" (click)="navigateTo('/admin/coin-stats')">
              <div class="card-header">
                <div class="header-icon admin-icon">
                  <mat-icon>bar_chart</mat-icon>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Coin Statistics</h3>
                  <p class="card-subtitle">System-wide coin analytics</p>
                </div>
              </div>
              <div class="card-actions">
                <button mat-raised-button class="action-btn admin">
                  <mat-icon>bar_chart</mat-icon>
                  View Stats
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Balance Warning -->
        <app-low-balance-warning></app-low-balance-warning>
      </div>
    </div>
  `,
  styleUrl: './coin-dashboard.component.scss'
})
export class CoinDashboardComponent implements OnInit {
  coinBalance: CoinBalance | null = null;
  isAdmin = false;
  isLoading = false;

  constructor(
    private coinService: CoinService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadCoinBalance();
  }

  private loadCoinBalance(): void {
    this.isLoading = true;
    this.coinService.getCoinBalance().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.coinBalance = response.data;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading coin balance:', error);
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getTransactionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'earned': 'trending_up',
      'spent': 'trending_down',
      'purchased': 'shopping_cart',
      'bonus': 'card_giftcard',
      'penalty': 'warning',
      'refunded': 'undo'
    };
    return icons[type] || 'help';
  }

  getAmountClass(type: string): string {
    return ['spent', 'penalty'].includes(type) ? 'negative' : 'positive';
  }

  getAmountPrefix(type: string): string {
    return ['spent', 'penalty'].includes(type) ? '-' : '+';
  }
}