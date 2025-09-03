import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { CoinService, CoinTransaction } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { CoinBalanceComponent } from '../coin-balance/coin-balance.component';

@Component({
  selector: 'app-coin-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatTooltipModule,
    CoinBalanceComponent
  ],
  template: `
    <div class="history-container">
      <div class="header-section">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Coin Transaction History</h1>
        <app-coin-balance [compact]="true" [clickable]="true"></app-coin-balance>
      </div>

      <!-- Summary Cards -->
      <div class="summary-section" *ngIf="transactionSummary">
        <mat-card class="summary-card earned">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>trending_up</mat-icon>
              <div class="summary-info">
                <div class="summary-value">+{{transactionSummary.totalEarned}}</div>
                <div class="summary-label">Total Earned</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card spent">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>trending_down</mat-icon>
              <div class="summary-info">
                <div class="summary-value">-{{transactionSummary.totalSpent}}</div>
                <div class="summary-label">Total Spent</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card balance">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon>account_balance_wallet</mat-icon>
              <div class="summary-info">
                <div class="summary-value">{{currentUser?.coinBalance || 0}}</div>
                <div class="summary-label">Current Balance</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>filter_list</mat-icon>
          <mat-card-title>Filter Transactions</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <mat-form-field appearance="outline">
              <mat-label>Transaction Type</mat-label>
              <mat-select formControlName="type" (selectionChange)="applyFilters()">
                <mat-option value="">All Types</mat-option>
                <mat-option value="earned">Earned</mat-option>
                <mat-option value="spent">Spent</mat-option>
                <mat-option value="purchased">Purchased</mat-option>
                <mat-option value="bonus">Bonus</mat-option>
                <mat-option value="penalty">Penalty</mat-option>
                <mat-option value="refunded">Refunded</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>From Date</mat-label>
              <input matInput [matDatepicker]="fromPicker" formControlName="fromDate" (dateChange)="applyFilters()">
              <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>To Date</mat-label>
              <input matInput [matDatepicker]="toPicker" formControlName="toDate" (dateChange)="applyFilters()">
              <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>

            <div class="filter-actions">
              <button mat-raised-button color="primary" (click)="applyFilters()">
                <mat-icon>search</mat-icon>
                Apply Filters
              </button>
              <button mat-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Transactions Table -->
      <mat-card class="transactions-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Transaction History</mat-card-title>
          <mat-card-subtitle>
            {{pagination.total}} transactions found
            <span *ngIf="hasActiveFilters()" class="filter-indicator">(filtered)</span>
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="table-container" *ngIf="!isLoading; else loadingTemplate">
            <table mat-table [dataSource]="transactions" class="transactions-table">
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                <td mat-cell *matCellDef="let transaction">
                  <div class="date-cell">
                    <div class="date">{{transaction.createdAt | date:'MMM d, yyyy'}}</div>
                    <div class="time">{{transaction.createdAt | date:'h:mm a'}}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let transaction">
                  <mat-chip [class]="'type-' + transaction.type" [matTooltip]="getTypeDescription(transaction.type)">
                    <mat-icon>{{getTypeIcon(transaction.type)}}</mat-icon>
                    {{transaction.type | titlecase}}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Description Column -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let transaction">
                  <div class="description-cell">
                    <div class="main-description">{{transaction.description}}</div>
                    <div class="metadata" *ngIf="transaction.metadata">
                      <span *ngIf="transaction.metadata.source" class="source">
                        Source: {{transaction.metadata.source | titlecase}}
                      </span>
                      <span *ngIf="transaction.metadata.route" class="route">
                        Page: {{transaction.metadata.route}}
                      </span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let transaction">
                  <div class="amount-cell">
                    <span [class]="getAmountClass(transaction.type)">
                      {{getAmountPrefix(transaction.type)}}{{transaction.amount}}
                    </span>
                    <mat-icon class="coin-icon">monetization_on</mat-icon>
                  </div>
                </td>
              </ng-container>

              <!-- Balance Column -->
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Balance After</th>
                <td mat-cell *matCellDef="let transaction">
                  <div class="balance-cell">
                    <div class="balance-after">{{transaction.balanceAfter}}</div>
                    <div class="balance-change">
                      ({{transaction.balanceBefore}} → {{transaction.balanceAfter}})
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Reference Column -->
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Reference</th>
                <td mat-cell *matCellDef="let transaction">
                  <div class="reference-cell" *ngIf="transaction.referenceId || transaction.referenceType">
                    <div class="reference-type" *ngIf="transaction.referenceType">
                      {{transaction.referenceType | titlecase}}
                    </div>
                    <div class="reference-id" *ngIf="transaction.referenceId">
                      {{transaction.referenceId}}
                    </div>
                  </div>
                  <span *ngIf="!transaction.referenceId && !transaction.referenceType" class="no-reference">
                    —
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  [class]="'transaction-row type-' + row.type"></tr>
            </table>

            <div class="no-transactions" *ngIf="transactions.length === 0">
              <mat-icon>history</mat-icon>
              <h3>No transactions found</h3>
              <p>{{hasActiveFilters() ? 'Try adjusting your filters' : 'You haven\'t made any coin transactions yet'}}</p>
            </div>
          </div>

          <ng-template #loadingTemplate>
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Loading transactions...</p>
            </div>
          </ng-template>

          <mat-paginator
            *ngIf="transactions.length > 0"
            [length]="pagination.total"
            [pageSize]="pagination.limit"
            [pageIndex]="pagination.page - 1"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .header-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      color: white;
    }

    .back-button {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .header-section h1 {
      flex: 1;
      margin: 0;
      font-size: 28px;
      font-weight: 300;
    }

    .summary-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      animation: slideInUp 0.5s ease-out;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-content mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .summary-card.earned mat-icon {
      color: #4caf50;
    }

    .summary-card.spent mat-icon {
      color: #f44336;
    }

    .summary-card.balance mat-icon {
      color: #2196f3;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 600;
      line-height: 1;
    }

    .summary-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .summary-card.earned .summary-value {
      color: #4caf50;
    }

    .summary-card.spent .summary-value {
      color: #f44336;
    }

    .summary-card.balance .summary-value {
      color: #2196f3;
    }

    .filters-card {
      margin-bottom: 20px;
      animation: slideInUp 0.6s ease-out;
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: start;
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      grid-column: 1 / -1;
    }

    .filter-indicator {
      color: #667eea;
      font-weight: 600;
    }

    .transactions-card {
      animation: slideInUp 0.7s ease-out;
    }

    .table-container {
      overflow-x: auto;
    }

    .transactions-table {
      width: 100%;
      min-width: 800px;
    }

    .date-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .date {
      font-weight: 500;
    }

    .time {
      font-size: 12px;
      color: #666;
    }

    .type-earned, .type-bonus, .type-purchased, .type-refunded {
      background: #4caf50;
      color: white;
    }

    .type-spent, .type-penalty {
      background: #f44336;
      color: white;
    }

    .type-earned mat-icon, .type-bonus mat-icon, .type-purchased mat-icon, .type-refunded mat-icon {
      color: white;
    }

    .type-spent mat-icon, .type-penalty mat-icon {
      color: white;
    }

    .description-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .main-description {
      font-weight: 500;
    }

    .metadata {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
      color: #666;
    }

    .amount-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .amount-positive {
      color: #4caf50;
      font-weight: 600;
    }

    .amount-negative {
      color: #f44336;
      font-weight: 600;
    }

    .coin-icon {
      color: #ffd700;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .balance-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .balance-after {
      font-weight: 600;
      color: #333;
    }

    .balance-change {
      font-size: 12px;
      color: #666;
    }

    .reference-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .reference-type {
      font-size: 12px;
      color: #667eea;
      font-weight: 500;
    }

    .reference-id {
      font-size: 11px;
      color: #666;
      font-family: monospace;
    }

    .no-reference {
      color: #999;
    }

    .transaction-row {
      transition: background-color 0.2s ease;
    }

    .transaction-row:hover {
      background-color: #f5f5f5;
    }

    .transaction-row.type-earned {
      border-left: 4px solid #4caf50;
    }

    .transaction-row.type-spent {
      border-left: 4px solid #f44336;
    }

    .transaction-row.type-purchased {
      border-left: 4px solid #2196f3;
    }

    .transaction-row.type-bonus {
      border-left: 4px solid #ff9800;
    }

    .transaction-row.type-penalty {
      border-left: 4px solid #e91e63;
    }

    .transaction-row.type-refunded {
      border-left: 4px solid #9c27b0;
    }

    .no-transactions {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-transactions mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
      color: #666;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .history-container {
        padding: 16px;
      }
      
      .header-section h1 {
        font-size: 24px;
      }
      
      .summary-section {
        grid-template-columns: 1fr;
      }
      
      .filters-form {
        grid-template-columns: 1fr;
      }
      
      .filter-actions {
        flex-direction: column;
      }
      
      .filter-actions button {
        width: 100%;
      }
    }
  `]
})
export class CoinHistoryComponent implements OnInit {
  filterForm: FormGroup;
  transactions: CoinTransaction[] = [];
  displayedColumns = ['date', 'type', 'description', 'amount', 'balance', 'reference'];
  
  pagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  };

  transactionSummary = {
    totalEarned: 0,
    totalSpent: 0,
    totalTransactions: 0
  };

  currentUser: any = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private coinService: CoinService,
    private authService: AuthService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      type: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadTransactions();
    this.calculateSummary();
  }

  private loadTransactions(): void {
    this.isLoading = true;
    
    const type = this.filterForm.get('type')?.value || undefined;
    
    this.coinService.getCoinTransactions(this.pagination.page, this.pagination.limit, type).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.transactions = response.data;
          this.pagination = {
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages
          };
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading transactions:', error);
      }
    });
  }

  private calculateSummary(): void {
    // Load all transactions to calculate summary
    this.coinService.getCoinTransactions(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          const allTransactions = response.data;
          this.transactionSummary = {
            totalEarned: allTransactions
              .filter(t => ['earned', 'bonus', 'purchased', 'refunded'].includes(t.type))
              .reduce((sum, t) => sum + t.amount, 0),
            totalSpent: allTransactions
              .filter(t => ['spent', 'penalty'].includes(t.type))
              .reduce((sum, t) => sum + t.amount, 0),
            totalTransactions: allTransactions.length
          };
        }
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pagination.page = event.pageIndex + 1;
    this.pagination.limit = event.pageSize;
    this.loadTransactions();
  }

  applyFilters(): void {
    this.pagination.page = 1;
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.pagination.page = 1;
    this.loadTransactions();
  }

  hasActiveFilters(): boolean {
    const form = this.filterForm.value;
    return !!(form.type || form.fromDate || form.toDate);
  }

  getTypeIcon(type: string): string {
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

  getTypeDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'earned': 'Coins earned through activities',
      'spent': 'Coins spent on services',
      'purchased': 'Coins purchased with money',
      'bonus': 'Bonus coins from admin',
      'penalty': 'Coins deducted as penalty',
      'refunded': 'Coins refunded from purchases'
    };
    return descriptions[type] || 'Unknown transaction type';
  }

  getAmountClass(type: string): string {
    return ['spent', 'penalty'].includes(type) ? 'amount-negative' : 'amount-positive';
  }

  getAmountPrefix(type: string): string {
    return ['spent', 'penalty'].includes(type) ? '-' : '+';
  }

  goBack(): void {
    this.router.navigate(['/coins']);
  }
}