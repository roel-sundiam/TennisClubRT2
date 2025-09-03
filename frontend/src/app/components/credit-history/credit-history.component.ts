import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreditService, CreditTransaction } from '../../services/credit.service';

@Component({
  selector: 'app-credit-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="page-container">
      <div class="page-content">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <button mat-icon-button (click)="goBack()" class="back-button">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="title-info">
              <h1 class="page-title">
                <mat-icon>history</mat-icon>
                Transaction History
              </h1>
              <p class="page-subtitle">View your complete credit transaction history</p>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-card">
          <h3>Filter Transactions</h3>
          <div class="filters-content">
            <mat-form-field appearance="outline">
              <mat-label>Transaction Type</mat-label>
              <mat-select [value]="selectedType" (selectionChange)="onTypeFilter($event.value)">
                <mat-option value="">All Types</mat-option>
                <mat-option value="deposit">Deposits</mat-option>
                <mat-option value="deduction">Deductions</mat-option>
                <mat-option value="refund">Refunds</mat-option>
                <mat-option value="adjustment">Adjustments</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Transaction List -->
        <div class="transactions-card" *ngIf="!loading">
          <h3>
            Transaction History 
            <span class="total-count">({{totalTransactions}} total)</span>
          </h3>
          
          <div class="transaction-list" *ngIf="transactions.length > 0">
            <div class="transaction-item" *ngFor="let transaction of transactions; trackBy: trackTransaction">
              <div class="transaction-header">
                <div class="transaction-type">
                  <div class="type-icon" [class]="'type-' + transaction.type">
                    <mat-icon>{{getTransactionIcon(transaction.type)}}</mat-icon>
                  </div>
                  <div class="type-info">
                    <div class="transaction-title">{{transaction.description}}</div>
                    <div class="transaction-date">{{transaction.createdAt | date:'MMM d, yyyy h:mm a'}}</div>
                  </div>
                </div>
                <div class="transaction-amount" [class]="getAmountClass(transaction.type)">
                  {{getAmountPrefix(transaction.type)}}₱{{transaction.amount | number:'1.2-2'}}
                </div>
              </div>
              
              <div class="transaction-details" *ngIf="hasTransactionDetails(transaction)">
                <div class="balance-info">
                  <span>Balance: ₱{{transaction.balanceBefore | number:'1.2-2'}} → ₱{{transaction.balanceAfter | number:'1.2-2'}}</span>
                </div>
                
                <div class="metadata" *ngIf="transaction.metadata">
                  <div class="metadata-item" *ngIf="transaction.metadata.paymentMethod">
                    <strong>Payment Method:</strong> {{getPaymentMethodText(transaction.metadata.paymentMethod)}}
                  </div>
                  <div class="metadata-item" *ngIf="transaction.metadata.reservationDate && transaction.metadata.timeSlot">
                    <strong>Reservation:</strong> {{transaction.metadata.reservationDate | date:'MMM d, yyyy'}} at {{transaction.metadata.timeSlot}}:00
                  </div>
                  <div class="metadata-item" *ngIf="transaction.metadata.eventTitle">
                    <strong>Event:</strong> {{transaction.metadata.eventTitle}}
                  </div>
                  <div class="metadata-item" *ngIf="transaction.referenceId">
                    <strong>Reference:</strong> {{transaction.referenceId}}
                  </div>
                </div>

                <div class="refund-info" *ngIf="transaction.refundReason">
                  <mat-icon>info</mat-icon>
                  <span>{{getRefundReasonText(transaction.refundReason)}}</span>
                </div>
                
                <div class="status-info" *ngIf="transaction.status && transaction.status !== 'completed'">
                  <div class="status-badge" [class]="'status-' + transaction.status">
                    {{transaction.status | titlecase}}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="transactions.length === 0">
            <mat-icon class="empty-icon">history</mat-icon>
            <h4>No Transactions Found</h4>
            <p>{{selectedType ? 'No transactions of this type found.' : 'You haven\'t made any transactions yet.'}}</p>
            <button mat-raised-button color="primary" (click)="clearFilters()" *ngIf="selectedType">
              View All Transactions
            </button>
          </div>

          <!-- Pagination -->
          <mat-paginator 
            *ngIf="totalTransactions > 0"
            [length]="totalTransactions"
            [pageSize]="pageSize"
            [pageIndex]="currentPage - 1"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </div>

        <!-- Loading State -->
        <div class="loading-container" *ngIf="loading">
          <mat-spinner></mat-spinner>
          <p>Loading transaction history...</p>
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
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .header-content {
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

    .filters-card, .transactions-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .filters-card h3, .transactions-card h3 {
      margin: 0 0 16px 0;
      font-size: 1.4rem;
      font-weight: 500;
      color: #333;
    }

    .total-count {
      font-size: 1rem;
      font-weight: 400;
      color: #666;
    }

    .filters-content {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filters-content mat-form-field {
      min-width: 200px;
    }

    .transaction-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .transaction-item {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .transaction-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-color: #667eea;
    }

    .transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .transaction-type {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .type-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .type-icon.type-deposit {
      background: #4caf50;
    }

    .type-icon.type-deduction {
      background: #f44336;
    }

    .type-icon.type-refund {
      background: #2196f3;
    }

    .type-icon.type-adjustment {
      background: #ff9800;
    }

    .transaction-title {
      font-weight: 500;
      color: #333;
      font-size: 1rem;
      margin-bottom: 4px;
    }

    .transaction-date {
      font-size: 0.9rem;
      color: #666;
    }

    .transaction-amount {
      font-size: 1.2rem;
      font-weight: 600;
      text-align: right;
      flex-shrink: 0;
    }

    .transaction-amount.positive {
      color: #4caf50;
    }

    .transaction-amount.negative {
      color: #f44336;
    }

    .transaction-details {
      border-top: 1px solid #f0f0f0;
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .balance-info {
      font-size: 0.9rem;
      color: #666;
      font-family: 'Roboto Mono', monospace;
    }

    .metadata {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .metadata-item {
      font-size: 0.9rem;
      color: #555;
    }

    .metadata-item strong {
      color: #333;
    }

    .refund-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #2196f3;
      font-style: italic;
    }

    .refund-info mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-info {
      text-align: right;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.status-pending {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-badge.status-failed {
      background: #ffebee;
      color: #c62828;
    }

    .status-badge.status-reversed {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .empty-state h4 {
      font-size: 1.5rem;
      margin-bottom: 12px;
      color: #333;
    }

    .empty-state p {
      font-size: 1rem;
      margin-bottom: 24px;
    }

    .loading-container {
      text-align: center;
      padding: 60px 20px;
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .loading-container p {
      margin-top: 16px;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 12px;
      }
      
      .transaction-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .transaction-amount {
        text-align: left;
        font-size: 1.1rem;
      }
      
      .metadata {
        font-size: 0.85rem;
      }
    }
  `]
})
export class CreditHistoryComponent implements OnInit {
  transactions: CreditTransaction[] = [];
  loading = true;
  selectedType = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalTransactions = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private creditService: CreditService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.creditService.getCreditTransactions(this.currentPage, this.pageSize, this.selectedType).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transactions = response.data.transactions;
          this.totalTransactions = response.data.pagination.total;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loading = false;
      }
    });
  }

  onTypeFilter(type: string): void {
    this.selectedType = type;
    this.currentPage = 1; // Reset to first page
    this.loadTransactions();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadTransactions();
  }

  clearFilters(): void {
    this.selectedType = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  goBack(): void {
    this.router.navigate(['/coins']);
  }

  trackTransaction(index: number, transaction: CreditTransaction): string {
    return transaction._id;
  }

  hasTransactionDetails(transaction: CreditTransaction): boolean {
    return !!(transaction.metadata || transaction.refundReason || transaction.referenceId || 
             (transaction.status && transaction.status !== 'completed'));
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

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'gcash': return 'GCash';
      default: return method;
    }
  }

  getRefundReasonText(reason: string): string {
    switch (reason) {
      case 'reservation_cancelled': return 'Reservation cancelled - credits refunded';
      case 'open_play_cancelled': return 'Open play cancelled - credits refunded';
      case 'admin_refund': return 'Admin refund processed';
      case 'partial_refund': return 'Partial refund processed';
      default: return reason;
    }
  }
}