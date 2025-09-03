import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreditService, CreditBalance, CreditTransaction } from '../../services/credit.service';

@Component({
  selector: 'app-credit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule
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
                  <mat-icon>account_balance</mat-icon>
                  Credit Management
                </h1>
                <p class="page-subtitle">Manage your prepaid credits and view transaction history</p>
              </div>
            </div>
            <div class="credit-balance-section" *ngIf="creditBalance">
              <div class="balance-display">
                <div class="balance-amount">₱{{creditBalance.balance | number:'1.2-2'}}</div>
                <div class="balance-label">Available Credits</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Balance Overview -->
        <div class="balance-overview-card" *ngIf="creditBalance">
          <div class="card-header">
            <div class="header-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="header-text">
              <h2 class="card-title">Your Credit Balance</h2>
              <p class="card-subtitle">Prepaid credits for seamless bookings</p>
            </div>
          </div>
          <div class="card-content">
            <div class="balance-details">
              <div class="main-balance">
                <span class="balance-amount">₱{{creditBalance.balance | number:'1.2-2'}}</span>
                <span class="balance-label">Credits Available</span>
              </div>
              
              <div class="balance-status" [class.pending-transactions]="creditBalance.pendingTransactions > 0">
                <mat-icon>{{creditBalance.pendingTransactions > 0 ? 'schedule' : 'check_circle'}}</mat-icon>
                <span>{{creditBalance.pendingTransactions > 0 ? creditBalance.pendingTransactions + ' Pending' : 'All Settled'}}</span>
              </div>
            </div>

            <div class="balance-info">
              <p class="info-text">
                <mat-icon>info</mat-icon>
                Credits are automatically deducted when you make reservations or join open play events. 
                No need to manually process payments!
              </p>
            </div>
          </div>
        </div>

        <!-- Credit Stats -->
        <div class="stats-section" *ngIf="creditStats">
          <h2 class="section-title">
            <mat-icon>bar_chart</mat-icon>
            Credit Statistics
          </h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <mat-icon>add_circle</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">₱{{creditStats.totalDeposits | number:'1.2-2'}}</div>
                <div class="stat-label">Total Deposited</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <mat-icon>remove_circle</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">₱{{creditStats.totalUsed | number:'1.2-2'}}</div>
                <div class="stat-label">Total Used</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <mat-icon>refresh</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">₱{{creditStats.totalRefunds | number:'1.2-2'}}</div>
                <div class="stat-label">Total Refunded</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <mat-icon>receipt</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{creditStats.transactionCount}}</div>
                <div class="stat-label">Transactions</div>
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
          <div class="actions-grid">
            <button mat-raised-button color="primary" (click)="topUpCredits()" class="action-button">
              <mat-icon>add</mat-icon>
              Add Credits
            </button>
            <button mat-raised-button (click)="viewTransactionHistory()" class="action-button">
              <mat-icon>history</mat-icon>
              Transaction History
            </button>
            <button mat-raised-button (click)="goToReservations()" class="action-button">
              <mat-icon>sports_tennis</mat-icon>
              Make Reservation
            </button>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="transactions-section" *ngIf="recentTransactions.length > 0">
          <h2 class="section-title">
            <mat-icon>history</mat-icon>
            Recent Activity
          </h2>
          <div class="transaction-list">
            <div class="transaction-item" *ngFor="let transaction of recentTransactions">
              <div class="transaction-icon">
                <mat-icon [class]="'type-' + transaction.type">
                  {{getTransactionIcon(transaction.type)}}
                </mat-icon>
              </div>
              <div class="transaction-details">
                <div class="transaction-description">{{transaction.description}}</div>
                <div class="transaction-date">{{transaction.createdAt | date:'MMM d, h:mm a'}}</div>
                <div class="transaction-status" *ngIf="transaction.refundReason" class="refund-reason">
                  {{getRefundReasonText(transaction.refundReason)}}
                </div>
              </div>
              <div class="transaction-amount" [class]="getAmountClass(transaction.type)">
                {{getAmountPrefix(transaction.type)}}₱{{transaction.amount | number:'1.2-2'}}
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-container" *ngIf="loading">
          <mat-spinner></mat-spinner>
          <p>Loading credit information...</p>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading && !creditBalance">
          <mat-icon class="empty-icon">account_balance</mat-icon>
          <h3>Credit Dashboard</h3>
          <p>Your credit information will appear here once loaded.</p>
          <button mat-raised-button color="primary" (click)="loadCreditData()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: 'Roboto', sans-serif;
    }

    .page-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .back-button {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      width: 48px;
      height: 48px;
    }

    .title-info {
      color: white;
    }

    .page-title {
      margin: 0;
      font-size: 2.2rem;
      font-weight: 300;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-title mat-icon {
      font-size: 2.2rem;
      width: 2.2rem;
      height: 2.2rem;
    }

    .page-subtitle {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .credit-balance-section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      color: white;
      text-align: center;
      min-width: 200px;
    }

    .balance-display .balance-amount {
      font-size: 2.5rem;
      font-weight: 600;
      display: block;
      line-height: 1;
    }

    .balance-display .balance-label {
      font-size: 0.95rem;
      opacity: 0.9;
      margin-top: 4px;
      display: block;
    }

    .balance-overview-card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .card-title {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 500;
      color: #333;
    }

    .card-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 1rem;
    }

    .balance-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .main-balance {
      text-align: left;
    }

    .main-balance .balance-amount {
      font-size: 3rem;
      font-weight: 600;
      color: #667eea;
      display: block;
      line-height: 1;
    }

    .main-balance .balance-label {
      font-size: 1rem;
      color: #666;
      margin-top: 4px;
      display: block;
    }

    .balance-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      background: #e8f5e8;
      color: #2e7d32;
      font-weight: 500;
    }

    .balance-status.pending-transactions {
      background: #fff3e0;
      color: #f57c00;
    }

    .balance-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
    }

    .info-text {
      margin: 0;
      color: #555;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.5;
    }

    .info-text mat-icon {
      color: #667eea;
      margin-top: 2px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stats-section, .actions-section, .transactions-section {
      margin-bottom: 30px;
    }

    .section-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 400;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .stat-icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      margin-top: 4px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .action-button {
      height: 56px;
      font-size: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .transaction-list {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .transaction-item:last-child {
      border-bottom: none;
    }

    .transaction-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .transaction-icon.type-deposit {
      background: #4caf50;
    }

    .transaction-icon.type-deduction {
      background: #f44336;
    }

    .transaction-icon.type-refund {
      background: #2196f3;
    }

    .transaction-icon.type-adjustment {
      background: #ff9800;
    }

    .transaction-details {
      flex: 1;
    }

    .transaction-description {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .transaction-date {
      font-size: 0.9rem;
      color: #666;
    }

    .refund-reason {
      font-size: 0.85rem;
      color: #2196f3;
      font-style: italic;
    }

    .transaction-amount {
      font-size: 1.1rem;
      font-weight: 600;
      text-align: right;
    }

    .transaction-amount.positive {
      color: #4caf50;
    }

    .transaction-amount.negative {
      color: #f44336;
    }

    .loading-container {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }

    .loading-container p {
      margin-top: 16px;
      font-size: 1.1rem;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }

    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 20px;
      opacity: 0.7;
    }

    .empty-state h3 {
      font-size: 1.8rem;
      margin-bottom: 12px;
      font-weight: 400;
    }

    .empty-state p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }
      
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }
      
      .title-section {
        align-items: flex-start;
        gap: 12px;
      }
      
      .page-title {
        font-size: 1.8rem;
      }
      
      .balance-details {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CreditDashboardComponent implements OnInit {
  creditBalance: CreditBalance | null = null;
  creditStats: any = null;
  recentTransactions: CreditTransaction[] = [];
  loading = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private creditService: CreditService
  ) {}

  ngOnInit(): void {
    this.loadCreditData();
  }

  async loadCreditData(): Promise<void> {
    this.loading = true;
    try {
      // Load credit balance and stats in parallel
      const [balance, stats, transactions] = await Promise.all([
        this.creditService.getCreditBalance().toPromise(),
        this.creditService.getCreditStats().toPromise(),
        this.creditService.getCreditTransactions(1, 5).toPromise()
      ]);

      this.creditBalance = balance.data;
      this.creditStats = stats.data;
      this.recentTransactions = transactions.data.transactions || [];
    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  topUpCredits(): void {
    this.router.navigate(['/credit-topup']);
  }

  viewTransactionHistory(): void {
    this.router.navigate(['/credit-history']);
  }

  goToReservations(): void {
    this.router.navigate(['/reservations']);
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'deposit': return 'add_circle';
      case 'deduction': return 'remove_circle';
      case 'refund': return 'refresh';
      case 'adjustment': return 'tune';
      default: return 'account_balance';
    }
  }

  getAmountClass(type: string): string {
    return ['deposit', 'refund'].includes(type) ? 'positive' : 'negative';
  }

  getAmountPrefix(type: string): string {
    return ['deposit', 'refund'].includes(type) ? '+' : '-';
  }

  getRefundReasonText(reason?: string): string {
    if (!reason) return '';
    
    switch (reason) {
      case 'reservation_cancelled': return 'Reservation cancelled';
      case 'open_play_cancelled': return 'Open play cancelled';
      case 'admin_refund': return 'Admin refund';
      case 'partial_refund': return 'Partial refund';
      default: return reason;
    }
  }
}