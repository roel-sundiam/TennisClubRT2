import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { CoinService, CoinTransaction, CoinStats, AdminCoinAction } from '../../services/coin.service';
import { AuthService } from '../../services/auth.service';
import { MemberService, Member } from '../../services/member.service';

interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  coinBalance: number;
}

@Component({
  selector: 'app-admin-coin-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule
  ],
  template: `
    <div class="admin-coin-container">
      <div class="header-section">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Coin Management</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Refresh Data
          </button>
        </div>
      </div>

      <mat-tab-group class="main-tabs" [(selectedIndex)]="selectedTab">
        <!-- Pending Approvals Tab -->
        <mat-tab label="Pending Approvals">
          <div class="tab-content">
            <mat-card class="pending-approvals-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>pending_actions</mat-icon>
                <mat-card-title>Coin Purchase Approvals</mat-card-title>
                <mat-card-subtitle>
                  {{pendingPurchases.length}} pending requests
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div *ngIf="pendingPurchases.length === 0" class="empty-state">
                  <mat-icon class="empty-icon">check_circle</mat-icon>
                  <h3>All caught up!</h3>
                  <p>No pending coin purchase requests</p>
                </div>

                <div *ngIf="pendingPurchases.length > 0" class="pending-list">
                  <div class="pending-item" *ngFor="let purchase of pendingPurchases">
                    <div class="purchase-header">
                      <div class="user-info">
                        <strong>{{getUserName(purchase.userId)}}</strong>
                        <small>{{getUserEmail(purchase.userId)}}</small>
                      </div>
                      <div class="amount-info">
                        <span class="amount">{{purchase.amount}} coins</span>
                        <small>{{purchase.createdAt | date:'short'}}</small>
                      </div>
                    </div>
                    
                    <div class="purchase-details">
                      <p><strong>Payment Method:</strong> {{purchase.metadata?.paymentMethod | titlecase}}</p>
                      <p><strong>Reference:</strong> {{purchase.referenceId || 'N/A'}}</p>
                      <p><strong>Cost:</strong> ₱{{purchase.metadata?.costInPHP}}</p>
                      <p class="description">{{purchase.description}}</p>
                    </div>

                    <div class="approval-actions">
                      <button 
                        mat-raised-button 
                        color="primary"
                        (click)="approvePurchase(purchase._id, purchase.amount, getUserName(purchase.userId))"
                        [disabled]="isProcessingApproval">
                        <mat-icon>check</mat-icon>
                        Approve
                      </button>
                      <button 
                        mat-raised-button 
                        color="warn"
                        (click)="rejectPurchase(purchase._id, purchase.amount, getUserName(purchase.userId))"
                        [disabled]="isProcessingApproval">
                        <mat-icon>close</mat-icon>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Statistics Tab -->
        <mat-tab label="Statistics">
          <div class="tab-content">
            <div class="stats-grid" *ngIf="coinStats">
              <mat-card class="stat-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>account_balance_wallet</mat-icon>
                  <mat-card-title>Total Coins</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="stat-value">{{coinStats.totalStats.totalCoinsInCirculation | number}}</div>
                  <div class="stat-label">In Circulation</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>people</mat-icon>
                  <mat-card-title>Active Users</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="stat-value">{{coinStats.totalStats.usersWithCoins | number}}</div>
                  <div class="stat-label">With Coins</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>trending_up</mat-icon>
                  <mat-card-title>Average Balance</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="stat-value">{{coinStats.totalStats.averageBalance | number:'1.0-0'}}</div>
                  <div class="stat-label">Coins per User</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>receipt</mat-icon>
                  <mat-card-title>Total Transactions</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="stat-value">{{coinStats.totalTransactions | number}}</div>
                  <div class="stat-label">All Time</div>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card class="balance-distribution-card" *ngIf="coinStats">
              <mat-card-header>
                <mat-icon mat-card-avatar>bar_chart</mat-icon>
                <mat-card-title>Balance Distribution</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="distribution-grid">
                  <div class="distribution-item" *ngFor="let item of coinStats.balanceDistribution">
                    <div class="range-label">{{item._id}} coins</div>
                    <div class="range-stats">
                      <span class="user-count">{{item.count}} users</span>
                      <span class="total-coins">{{item.totalCoins}} total coins</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Award Coins Tab -->
        <mat-tab label="Award Coins">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>card_giftcard</mat-icon>
                <mat-card-title>Award Coins to User</mat-card-title>
                <mat-card-subtitle>Give bonus coins to members</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="awardForm" class="coin-form">
                  <!-- User Selection -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Select User</mat-label>
                    <mat-select formControlName="userId">
                      <mat-option *ngFor="let user of users" [value]="user._id">
                        {{user.fullName}} (@{{user.username}}) - {{user.coinBalance}} coins
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="awardForm.get('userId')?.hasError('required')">
                      Please select a user
                    </mat-error>
                  </mat-form-field>

                  <!-- Amount Input -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Coins to Award</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      formControlName="amount"
                      placeholder="Enter amount"
                      min="1"
                      max="1000">
                    <mat-icon matSuffix>monetization_on</mat-icon>
                    <mat-hint>Maximum: 1,000 coins per transaction</mat-hint>
                    <mat-error *ngIf="awardForm.get('amount')?.hasError('required')">
                      Amount is required
                    </mat-error>
                    <mat-error *ngIf="awardForm.get('amount')?.hasError('min')">
                      Minimum amount is 1 coin
                    </mat-error>
                    <mat-error *ngIf="awardForm.get('amount')?.hasError('max')">
                      Maximum amount is 1,000 coins
                    </mat-error>
                  </mat-form-field>

                  <!-- Reason Input -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Reason for Award</mat-label>
                    <textarea 
                      matInput 
                      formControlName="reason"
                      placeholder="Explain why you're awarding these coins..."
                      rows="3">
                    </textarea>
                    <mat-hint>This will be visible to the user</mat-hint>
                    <mat-error *ngIf="awardForm.get('reason')?.hasError('required')">
                      Reason is required
                    </mat-error>
                    <mat-error *ngIf="awardForm.get('reason')?.hasError('minlength')">
                      Reason must be at least 5 characters
                    </mat-error>
                  </mat-form-field>
                </form>
              </mat-card-content>
              <mat-card-actions>
                <button 
                  mat-raised-button 
                  color="primary"
                  (click)="awardCoins()"
                  [disabled]="awardForm.invalid || isAwarding">
                  <mat-spinner diameter="20" *ngIf="isAwarding"></mat-spinner>
                  <mat-icon *ngIf="!isAwarding">card_giftcard</mat-icon>
                  {{isAwarding ? 'Awarding...' : 'Award Coins'}}
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Deduct Coins Tab -->
        <mat-tab label="Deduct Coins">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>remove_circle</mat-icon>
                <mat-card-title>Deduct Coins from User</mat-card-title>
                <mat-card-subtitle>Remove coins for penalties or adjustments</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="deductForm" class="coin-form">
                  <!-- User Selection -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Select User</mat-label>
                    <mat-select formControlName="userId">
                      <mat-option *ngFor="let user of users" [value]="user._id">
                        {{user.fullName}} (@{{user.username}}) - {{user.coinBalance}} coins
                      </mat-option>
                    </mat-select>
                    <mat-error *ngIf="deductForm.get('userId')?.hasError('required')">
                      Please select a user
                    </mat-error>
                  </mat-form-field>

                  <!-- Amount Input -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Coins to Deduct</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      formControlName="amount"
                      placeholder="Enter amount"
                      min="1"
                      max="1000">
                    <mat-icon matSuffix>monetization_on</mat-icon>
                    <mat-hint>Maximum: 1,000 coins per transaction</mat-hint>
                    <mat-error *ngIf="deductForm.get('amount')?.hasError('required')">
                      Amount is required
                    </mat-error>
                    <mat-error *ngIf="deductForm.get('amount')?.hasError('min')">
                      Minimum amount is 1 coin
                    </mat-error>
                    <mat-error *ngIf="deductForm.get('amount')?.hasError('max')">
                      Maximum amount is 1,000 coins
                    </mat-error>
                  </mat-form-field>

                  <!-- Reason Input -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Reason for Deduction</mat-label>
                    <textarea 
                      matInput 
                      formControlName="reason"
                      placeholder="Explain why you're deducting these coins..."
                      rows="3">
                    </textarea>
                    <mat-hint>This will be visible to the user</mat-hint>
                    <mat-error *ngIf="deductForm.get('reason')?.hasError('required')">
                      Reason is required
                    </mat-error>
                    <mat-error *ngIf="deductForm.get('reason')?.hasError('minlength')">
                      Reason must be at least 5 characters
                    </mat-error>
                  </mat-form-field>
                </form>
              </mat-card-content>
              <mat-card-actions>
                <button 
                  mat-raised-button 
                  color="warn"
                  (click)="deductCoins()"
                  [disabled]="deductForm.invalid || isDeducting">
                  <mat-spinner diameter="20" *ngIf="isDeducting"></mat-spinner>
                  <mat-icon *ngIf="!isDeducting">remove_circle</mat-icon>
                  {{isDeducting ? 'Deducting...' : 'Deduct Coins'}}
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Recent Transactions Tab -->
        <mat-tab label="Recent Transactions">
          <div class="tab-content">
            <mat-card class="transactions-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>history</mat-icon>
                <mat-card-title>Recent Coin Transactions</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="recentTransactions" class="transactions-table">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let transaction">
                        {{transaction.createdAt | date:'short'}}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="user">
                      <th mat-header-cell *matHeaderCellDef>User</th>
                      <td mat-cell *matCellDef="let transaction">
                        <div class="user-info">
                          <strong>{{transaction.userId?.fullName || 'Unknown'}}</strong>
                          <small>@{{transaction.userId?.username || 'unknown'}}</small>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let transaction">
                        <mat-chip [class]="'type-' + transaction.type">
                          {{transaction.type | titlecase}}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span [class]="transaction.type === 'spent' || transaction.type === 'penalty' ? 'negative' : 'positive'">
                          {{transaction.type === 'spent' || transaction.type === 'penalty' ? '-' : '+'}}{{transaction.amount}}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="balance">
                      <th mat-header-cell *matHeaderCellDef>Balance After</th>
                      <td mat-cell *matCellDef="let transaction">
                        {{transaction.balanceAfter}}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="description">
                      <th mat-header-cell *matHeaderCellDef>Description</th>
                      <td mat-cell *matCellDef="let transaction">
                        {{transaction.description}}
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="transactionColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: transactionColumns;"></tr>
                  </table>
                </div>

                <mat-paginator
                  [length]="transactionTotal"
                  [pageSize]="transactionPageSize"
                  [pageIndex]="transactionPage"
                  [pageSizeOptions]="[10, 25, 50, 100]"
                  (page)="onTransactionPageChange($event)"
                  showFirstLastButtons>
                </mat-paginator>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Member Balance Report Tab -->
        <mat-tab label="Member Balances">
          <div class="tab-content">
            <mat-card class="member-balances-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>account_balance_wallet</mat-icon>
                <mat-card-title>Member Coin Balance Report</mat-card-title>
                <mat-card-subtitle>View all members' current coin balances</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="members" class="member-balance-table">
                    <ng-container matColumnDef="fullName">
                      <th mat-header-cell *matHeaderCellDef>Full Name</th>
                      <td mat-cell *matCellDef="let member">
                        <strong>{{member.fullName}}</strong>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="username">
                      <th mat-header-cell *matHeaderCellDef>Username</th>
                      <td mat-cell *matCellDef="let member">
                        @{{member.username}}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="email">
                      <th mat-header-cell *matHeaderCellDef>Email</th>
                      <td mat-cell *matCellDef="let member">
                        <small>{{member.email}}</small>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="coinBalance">
                      <th mat-header-cell *matHeaderCellDef>Coin Balance</th>
                      <td mat-cell *matCellDef="let member">
                        <div class="balance-cell">
                          <mat-icon class="coin-icon">monetization_on</mat-icon>
                          <span class="balance-amount" [class.low-balance]="member.coinBalance < 50">
                            {{member.coinBalance | number}}
                          </span>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="role">
                      <th mat-header-cell *matHeaderCellDef>Role</th>
                      <td mat-cell *matCellDef="let member">
                        <mat-chip [class]="'role-' + member.role">
                          {{member.role | titlecase}}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="memberColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: memberColumns;"></tr>
                  </table>
                </div>

                <mat-paginator
                  [length]="memberTotal"
                  [pageSize]="memberPageSize"
                  [pageIndex]="memberPage"
                  [pageSizeOptions]="[25, 50, 100]"
                  (page)="onMemberPageChange($event)"
                  showFirstLastButtons>
                </mat-paginator>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-coin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
    }

    .header-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .header-section h1 {
      flex: 1;
      margin: 0;
    }

    .main-tabs {
      min-height: 600px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
    }

    .balance-distribution-card {
      margin-top: 20px;
    }

    .distribution-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .distribution-item {
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .range-label {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .range-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-count {
      color: #667eea;
      font-size: 0.9em;
    }

    .total-coins {
      color: #666;
      font-size: 0.85em;
    }

    .form-card {
      max-width: 600px;
    }

    .coin-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    .transactions-card, .member-balances-card {
      width: 100%;
    }

    .table-container {
      overflow-x: auto;
    }

    .transactions-table, .member-balance-table {
      width: 100%;
      min-width: 800px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-info small {
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

    .positive {
      color: #4caf50;
      font-weight: 600;
    }

    .negative {
      color: #f44336;
      font-weight: 600;
    }

    .pending-approvals-card {
      width: 100%;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 72px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: #333;
    }

    .pending-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .pending-item {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      background: #fafafa;
      transition: all 0.3s ease;
    }

    .pending-item:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #667eea;
    }

    .purchase-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }

    .purchase-header .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .purchase-header .user-info strong {
      font-size: 1.1em;
      color: #333;
    }

    .purchase-header .user-info small {
      color: #666;
      font-size: 0.9em;
    }

    .amount-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .amount {
      font-size: 1.2em;
      font-weight: 600;
      color: #667eea;
    }

    .purchase-details {
      margin-bottom: 20px;
    }

    .purchase-details p {
      margin: 8px 0;
      font-size: 0.95em;
    }

    .purchase-details .description {
      background: #f0f0f0;
      padding: 12px;
      border-radius: 6px;
      font-style: italic;
      color: #555;
    }

    .approval-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .approval-actions button {
      min-width: 120px;
    }

    .balance-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .coin-icon {
      color: #667eea;
      font-size: 18px;
    }

    .balance-amount {
      font-weight: 600;
      font-size: 1.1em;
    }

    .balance-amount.low-balance {
      color: #f44336;
    }

    .role-member {
      background: #4caf50;
      color: white;
    }

    .role-admin {
      background: #ff9800;
      color: white;
    }

    .role-superadmin {
      background: #9c27b0;
      color: white;
    }

    @media (max-width: 768px) {
      .admin-coin-container {
        padding: 16px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .distribution-grid {
        grid-template-columns: 1fr;
      }

      .purchase-header {
        flex-direction: column;
        gap: 12px;
      }

      .amount-info {
        align-items: flex-start;
      }

      .approval-actions {
        flex-direction: column;
      }

      .approval-actions button {
        width: 100%;
      }
    }
  `]
})
export class AdminCoinManagementComponent implements OnInit {
  selectedTab = 0;
  
  // Forms
  awardForm: FormGroup;
  deductForm: FormGroup;
  
  // Data
  coinStats: CoinStats | null = null;
  users: User[] = [];
  members: Member[] = [];
  recentTransactions: CoinTransaction[] = [];
  pendingPurchases: CoinTransaction[] = [];
  
  // Loading states
  isAwarding = false;
  isDeducting = false;
  isLoading = true;
  isProcessingApproval = false;
  
  // Pagination
  transactionColumns = ['date', 'user', 'type', 'amount', 'balance', 'description'];
  transactionPage = 0;
  transactionPageSize = 10;
  transactionTotal = 0;

  // Member Balance Report Pagination
  memberColumns = ['fullName', 'username', 'email', 'coinBalance', 'role'];
  memberPage = 0;
  memberPageSize = 25;
  memberTotal = 0;

  constructor(
    private fb: FormBuilder,
    private coinService: CoinService,
    private authService: AuthService,
    private memberService: MemberService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Initialize forms
    this.awardForm = this.fb.group({
      userId: ['', Validators.required],
      amount: [50, [Validators.required, Validators.min(1), Validators.max(1000)]],
      reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]]
    });

    this.deductForm = this.fb.group({
      userId: ['', Validators.required],
      amount: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
      reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    console.log('Admin coin management component initialized');
    console.log('Current user role:', this.authService.currentUser?.role);
    console.log('Is admin?', this.authService.isAdmin());
    
    // Check admin access
    if (!this.authService.isAdmin()) {
      console.log('Not admin, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadInitialData();
  }

  private loadInitialData(): void {
    console.log('Loading initial data...');
    this.isLoading = true;
    
    // Load all data in parallel
    Promise.all([
      this.loadCoinStats(),
      this.loadUsers(),
      this.loadMembers(),
      this.loadRecentTransactions(),
      this.loadPendingPurchases()
    ]).finally(() => {
      console.log('All initial data loaded');
      console.log('Final users array:', this.users);
      this.isLoading = false;
    });
  }

  private loadCoinStats(): Promise<void> {
    return new Promise((resolve) => {
      this.coinService.getCoinStats().subscribe({
        next: (response) => {
          if (response.success) {
            this.coinStats = response.data;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading coin stats:', error);
          resolve();
        }
      });
    });
  }

  private loadUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.memberService.getMembers({ limit: 100, includeAll: true }).subscribe({
        next: (response) => {
          if (response.success) {
            this.users = response.data.map(member => ({
              _id: member._id,
              username: member.username,
              fullName: member.fullName,
              email: member.email,
              coinBalance: member.coinBalance
            }));
            console.log('Loaded users for dropdowns:', this.users.length, 'users');
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          resolve();
        }
      });
    });
  }

  private loadMembers(): Promise<void> {
    return new Promise((resolve) => {
      this.memberService.getMembers({ 
        page: this.memberPage + 1, 
        limit: this.memberPageSize,
        includeAll: true
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.members = response.data.sort((a, b) => b.coinBalance - a.coinBalance);
            this.memberTotal = response.pagination.total;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading members:', error);
          resolve();
        }
      });
    });
  }

  private loadRecentTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.coinService.getCoinTransactions(this.transactionPage + 1, this.transactionPageSize).subscribe({
        next: (response) => {
          if (response.success) {
            this.recentTransactions = response.data;
            this.transactionTotal = response.pagination.total;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          resolve();
        }
      });
    });
  }

  private loadPendingPurchases(): Promise<void> {
    return new Promise((resolve) => {
      this.coinService.getPendingPurchases().subscribe({
        next: (response) => {
          if (response.success) {
            this.pendingPurchases = response.data;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading pending purchases:', error);
          resolve();
        }
      });
    });
  }

  awardCoins(): void {
    if (this.awardForm.valid && !this.isAwarding) {
      this.isAwarding = true;
      
      const request: AdminCoinAction = {
        userId: this.awardForm.get('userId')?.value,
        amount: this.awardForm.get('amount')?.value,
        reason: this.awardForm.get('reason')?.value
      };

      this.coinService.awardCoins(request).subscribe({
        next: (response) => {
          this.isAwarding = false;
          if (response.success) {
            this.snackBar.open(response.message, 'OK', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.awardForm.reset();
            this.refreshData();
          }
        },
        error: (error) => {
          this.isAwarding = false;
          const errorMessage = error.error?.error || 'Failed to award coins';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  deductCoins(): void {
    if (this.deductForm.valid && !this.isDeducting) {
      this.isDeducting = true;
      
      const request: AdminCoinAction = {
        userId: this.deductForm.get('userId')?.value,
        amount: this.deductForm.get('amount')?.value,
        reason: this.deductForm.get('reason')?.value
      };

      this.coinService.deductCoins(request).subscribe({
        next: (response) => {
          this.isDeducting = false;
          if (response.success) {
            this.snackBar.open(response.message, 'OK', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.deductForm.reset();
            this.refreshData();
          }
        },
        error: (error) => {
          this.isDeducting = false;
          const errorMessage = error.error?.error || 'Failed to deduct coins';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onTransactionPageChange(event: PageEvent): void {
    this.transactionPage = event.pageIndex;
    this.transactionPageSize = event.pageSize;
    this.loadRecentTransactions();
  }

  onMemberPageChange(event: PageEvent): void {
    this.memberPage = event.pageIndex;
    this.memberPageSize = event.pageSize;
    this.loadMembers();
  }

  refreshData(): void {
    this.loadInitialData();
  }

  approvePurchase(transactionId: string, amount: number, userName: string): void {
    if (this.isProcessingApproval) return;

    this.isProcessingApproval = true;
    this.coinService.approveCoinPurchase(transactionId, 'Approved by admin').subscribe({
      next: (response) => {
        this.isProcessingApproval = false;
        if (response.success) {
          this.snackBar.open(`Approved ${amount} coins for ${userName}`, 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadPendingPurchases();
          this.refreshData();
        }
      },
      error: (error) => {
        this.isProcessingApproval = false;
        const errorMessage = error.error?.error || 'Failed to approve coin purchase';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rejectPurchase(transactionId: string, amount: number, userName: string): void {
    if (this.isProcessingApproval) return;

    this.isProcessingApproval = true;
    this.coinService.rejectCoinPurchase(transactionId, 'Rejected by admin').subscribe({
      next: (response) => {
        this.isProcessingApproval = false;
        if (response.success) {
          this.snackBar.open(`Rejected ${amount} coins request from ${userName}`, 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadPendingPurchases();
        }
      },
      error: (error) => {
        this.isProcessingApproval = false;
        const errorMessage = error.error?.error || 'Failed to reject coin purchase';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getUserName(userId: string | { _id: string; username: string; fullName: string; email: string }): string {
    if (typeof userId === 'string') {
      return 'Unknown User';
    }
    return userId.fullName || userId.username || 'Unknown User';
  }

  getUserEmail(userId: string | { _id: string; username: string; fullName: string; email: string }): string {
    if (typeof userId === 'string') {
      return 'unknown@email.com';
    }
    return userId.email || 'unknown@email.com';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}