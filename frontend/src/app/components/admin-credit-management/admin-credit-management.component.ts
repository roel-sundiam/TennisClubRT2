import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
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
import { CreditService, CreditTransaction, AdminCreditAction } from '../../services/credit.service';
import { AuthService } from '../../services/auth.service';
import { MemberService, Member } from '../../services/member.service';

interface UserCreditInfo {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  creditBalance: number;
  isApproved: boolean;
  role: string;
  lastTransaction?: CreditTransaction;
}

@Component({
  selector: 'app-admin-credit-management',
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
    <div class="admin-credit-container">
      <div class="header-section">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Credit Management</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Refresh Data
          </button>
        </div>
      </div>

      <mat-tab-group class="main-tabs" [(selectedIndex)]="selectedTab">
        <!-- User Credit Balances Tab -->
        <mat-tab label="User Balances">
          <div class="tab-content">
            <mat-card class="user-balances-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>account_balance</mat-icon>
                <mat-card-title>Member Credit Balances</mat-card-title>
                <mat-card-subtitle>
                  Manage and view all member credit balances
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <!-- Search Bar -->
                <div class="search-bar">
                  <mat-form-field appearance="outline" class="search-field">
                    <mat-label>Search users</mat-label>
                    <input matInput [formControl]="searchControl" placeholder="Search by name, username, or email">
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>
                </div>

                <!-- Users Table -->
                <div class="table-container">
                  <table mat-table [dataSource]="users" class="users-table">
                    <ng-container matColumnDef="user">
                      <th mat-header-cell *matHeaderCellDef>User</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="user-cell">
                          <div class="user-name">{{user.fullName}}</div>
                          <div class="user-details">{{user.username}} • {{user.email}}</div>
                          <div class="user-status">
                            <mat-chip [ngClass]="{'approved': user.isApproved, 'pending': !user.isApproved}">
                              {{user.isApproved ? 'Approved' : 'Pending'}}
                            </mat-chip>
                            <mat-chip [ngClass]="user.role">{{user.role | titlecase}}</mat-chip>
                          </div>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="balance">
                      <th mat-header-cell *matHeaderCellDef>Credit Balance</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="balance-cell">
                          <div class="balance-amount" [ngClass]="{'low-balance': user.creditBalance < 100}">
                            ₱{{user.creditBalance | number:'1.2-2'}}
                          </div>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="lastTransaction">
                      <th mat-header-cell *matHeaderCellDef>Last Transaction</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="transaction-cell" *ngIf="user.lastTransaction">
                          <div class="transaction-type" [ngClass]="user.lastTransaction.type">
                            <mat-icon>{{getTransactionIcon(user.lastTransaction.type)}}</mat-icon>
                            {{user.lastTransaction.type | titlecase}}
                          </div>
                          <div class="transaction-amount">
                            {{getAmountPrefix(user.lastTransaction.type)}}₱{{user.lastTransaction.amount | number:'1.2-2'}}
                          </div>
                          <div class="transaction-date">
                            {{user.lastTransaction.createdAt | date:'MMM d, h:mm a'}}
                          </div>
                        </div>
                        <div class="no-transactions" *ngIf="!user.lastTransaction">
                          <mat-icon>info</mat-icon>
                          No transactions
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let user">
                        <div class="action-buttons">
                          <button mat-icon-button color="primary" 
                                  (click)="adjustCredits(user, 'deposit')" 
                                  matTooltip="Add Credits">
                            <mat-icon>add_circle</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" 
                                  (click)="adjustCredits(user, 'deduction')" 
                                  matTooltip="Deduct Credits"
                                  [disabled]="user.creditBalance <= 0">
                            <mat-icon>remove_circle</mat-icon>
                          </button>
                          <button mat-icon-button 
                                  (click)="viewUserHistory(user)" 
                                  matTooltip="View History">
                            <mat-icon>history</mat-icon>
                          </button>
                        </div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>

                <!-- Pagination -->
                <mat-paginator [length]="totalUsers" 
                               [pageSize]="pageSize" 
                               [pageSizeOptions]="[10, 25, 50]"
                               (page)="onPageChange($event)"
                               showFirstLastButtons>
                </mat-paginator>

                <!-- Loading State -->
                <div class="loading-container" *ngIf="loading">
                  <mat-spinner></mat-spinner>
                  <p>Loading user credit data...</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Credit Adjustment Tab -->
        <mat-tab label="Adjust Credits">
          <div class="tab-content">
            <mat-card class="adjustment-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>tune</mat-icon>
                <mat-card-title>Credit Adjustments</mat-card-title>
                <mat-card-subtitle>Add or deduct credits from user accounts</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="adjustmentForm" (ngSubmit)="processAdjustment()">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Select User</mat-label>
                      <mat-select formControlName="userId">
                        <mat-option value="">Choose a user</mat-option>
                        <mat-option *ngFor="let user of allUsers" [value]="user._id">
                          {{user.fullName}} ({{user.username}}) - ₱{{user.creditBalance | number:'1.2-2'}}
                        </mat-option>
                      </mat-select>
                      <mat-error *ngIf="adjustmentForm.get('userId')?.hasError('required')">
                        Please select a user
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Action</mat-label>
                      <mat-select formControlName="type">
                        <mat-option value="deposit">Add Credits</mat-option>
                        <mat-option value="deduction">Deduct Credits</mat-option>
                      </mat-select>
                      <mat-error *ngIf="adjustmentForm.get('type')?.hasError('required')">
                        Please select an action
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Amount (₱)</mat-label>
                      <input matInput type="number" formControlName="amount" 
                             placeholder="0.00" min="0.01" step="0.01">
                      <mat-error *ngIf="adjustmentForm.get('amount')?.hasError('required')">
                        Amount is required
                      </mat-error>
                      <mat-error *ngIf="adjustmentForm.get('amount')?.hasError('min')">
                        Amount must be greater than 0
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Reason</mat-label>
                      <textarea matInput formControlName="reason" 
                                placeholder="Enter the reason for this credit adjustment..."
                                rows="3"></textarea>
                      <mat-error *ngIf="adjustmentForm.get('reason')?.hasError('required')">
                        Please provide a reason
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button type="button" mat-button (click)="resetForm()">Clear</button>
                    <button type="submit" mat-raised-button color="primary" 
                            [disabled]="adjustmentForm.invalid || processing">
                      <mat-icon *ngIf="!processing">
                        {{adjustmentForm.get('type')?.value === 'deposit' ? 'add_circle' : 'remove_circle'}}
                      </mat-icon>
                      <mat-spinner diameter="20" *ngIf="processing"></mat-spinner>
                      {{processing ? 'Processing...' : (adjustmentForm.get('type')?.value === 'deposit' ? 'Add Credits' : 'Deduct Credits')}}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Credit Statistics Tab -->
        <mat-tab label="Statistics">
          <div class="tab-content">
            <mat-card class="stats-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>bar_chart</mat-icon>
                <mat-card-title>Credit System Statistics</mat-card-title>
                <mat-card-subtitle>Overview of credit usage and distribution</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="stats-grid" *ngIf="creditStats">
                  <div class="stat-item">
                    <div class="stat-icon deposit">
                      <mat-icon>add_circle</mat-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">₱{{getTotalDeposits() | number:'1.2-2'}}</div>
                      <div class="stat-label">Total Credits Added</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon deduction">
                      <mat-icon>remove_circle</mat-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">₱{{getTotalUsed() | number:'1.2-2'}}</div>
                      <div class="stat-label">Total Credits Used</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon refund">
                      <mat-icon>refresh</mat-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">₱{{getTotalRefunds() | number:'1.2-2'}}</div>
                      <div class="stat-label">Total Refunds</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon balance">
                      <mat-icon>account_balance</mat-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">₱{{getTotalBalance() | number:'1.2-2'}}</div>
                      <div class="stat-label">Total Outstanding Credits</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon users">
                      <mat-icon>people</mat-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{getUsersWithCredits()}}</div>
                      <div class="stat-label">Users with Credits</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon transactions">
                      <mat-icon>receipt</mat-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{getTotalTransactions()}}</div>
                      <div class="stat-label">Total Transactions</div>
                    </div>
                  </div>
                </div>

                <div class="loading-container" *ngIf="!creditStats && loading">
                  <mat-spinner></mat-spinner>
                  <p>Loading statistics...</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-credit-container {
      padding: 20px;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .header-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header-section h1 {
      margin: 0;
      flex: 1;
      font-size: 1.8rem;
      font-weight: 500;
      color: #333;
    }

    .back-button {
      background: #f0f0f0;
      width: 48px;
      height: 48px;
    }

    .main-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .tab-content {
      padding: 24px;
    }

    .search-bar {
      margin-bottom: 20px;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
      margin-bottom: 20px;
    }

    .users-table {
      width: 100%;
      min-width: 800px;
    }

    .user-cell {
      padding: 8px 0;
    }

    .user-name {
      font-weight: 500;
      font-size: 1rem;
      color: #333;
    }

    .user-details {
      font-size: 0.85rem;
      color: #666;
      margin-top: 2px;
    }

    .user-status {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }

    .user-status mat-chip {
      font-size: 0.75rem;
      height: 24px;
    }

    .user-status mat-chip.approved {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .user-status mat-chip.pending {
      background: #fff3e0;
      color: #f57c00;
    }

    .user-status mat-chip.member {
      background: #e3f2fd;
      color: #1976d2;
    }

    .user-status mat-chip.admin {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .user-status mat-chip.superadmin {
      background: #ffebee;
      color: #c62828;
    }

    .balance-cell {
      text-align: right;
    }

    .balance-amount {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2e7d32;
    }

    .balance-amount.low-balance {
      color: #f57c00;
    }

    .transaction-cell {
      font-size: 0.9rem;
    }

    .transaction-type {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .transaction-type.deposit {
      color: #2e7d32;
    }

    .transaction-type.deduction {
      color: #d32f2f;
    }

    .transaction-type.refund {
      color: #1976d2;
    }

    .transaction-type.adjustment {
      color: #f57c00;
    }

    .transaction-amount {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .transaction-date {
      color: #666;
      font-size: 0.8rem;
    }

    .no-transactions {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #999;
      font-size: 0.9rem;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .stat-item {
      background: #fafafa;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #e0e0e0;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.deposit {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .stat-icon.deduction {
      background: linear-gradient(135deg, #f44336, #c62828);
    }

    .stat-icon.refund {
      background: linear-gradient(135deg, #2196f3, #1565c0);
    }

    .stat-icon.balance {
      background: linear-gradient(135deg, #9c27b0, #6a1b9a);
    }

    .stat-icon.users {
      background: linear-gradient(135deg, #ff9800, #e65100);
    }

    .stat-icon.transactions {
      background: linear-gradient(135deg, #607d8b, #37474f);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      margin-top: 4px;
    }

    .loading-container {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .loading-container mat-spinner {
      margin: 0 auto 16px auto;
    }

    @media (max-width: 768px) {
      .admin-credit-container {
        padding: 12px;
      }

      .header-section {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .header-section h1 {
        text-align: center;
      }

      .form-row {
        flex-direction: column;
        gap: 12px;
      }

      .half-width {
        width: 100%;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminCreditManagementComponent implements OnInit {
  selectedTab = 0;
  loading = true;
  processing = false;
  
  // User data
  users: UserCreditInfo[] = [];
  allUsers: UserCreditInfo[] = []; // All users for dropdown
  totalUsers = 0;
  pageSize = 10;
  currentPage = 0;
  
  // Statistics
  creditStats: any = null;
  
  // Form controls
  searchControl = new FormControl('');
  adjustmentForm: FormGroup;
  
  // Table columns
  displayedColumns = ['user', 'balance', 'lastTransaction', 'actions'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private creditService: CreditService,
    private authService: AuthService,
    private memberService: MemberService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.adjustmentForm = this.fb.group({
      userId: ['', Validators.required],
      type: ['deposit', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupSearchListener();
  }

  setupSearchListener(): void {
    this.searchControl.valueChanges.subscribe(value => {
      this.loadUsers(this.currentPage, this.pageSize, value || '');
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      await Promise.all([
        this.loadUsers(),
        this.loadAllUsers(),
        this.loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading admin credit data:', error);
      this.snackBar.open('Error loading data', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async loadUsers(page = 0, limit = 10, search = ''): Promise<void> {
    try {
      const response = await this.creditService.getAllUserCredits(page + 1, limit, search).toPromise();
      if (response?.success) {
        this.users = response.data.users;
        this.totalUsers = response.data.pagination.total;
        this.currentPage = page;
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async loadAllUsers(): Promise<void> {
    try {
      // Load all users for the dropdown by requesting a large limit
      const response = await this.creditService.getAllUserCredits(1, 1000).toPromise();
      if (response?.success) {
        this.allUsers = response.data.users;
      }
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  }

  async loadStatistics(): Promise<void> {
    try {
      // Note: We'll need to create an admin endpoint for overall credit stats
      // For now, we'll aggregate from user data
      this.calculateStats();
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  calculateStats(): void {
    if (this.users.length === 0) return;
    
    this.creditStats = {
      totalBalance: this.users.reduce((sum, user) => sum + user.creditBalance, 0),
      usersWithCredits: this.users.filter(user => user.creditBalance > 0).length,
      totalUsers: this.users.length
    };
  }

  onPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex, event.pageSize, this.searchControl.value || '');
  }

  adjustCredits(user: UserCreditInfo, type: 'deposit' | 'deduction'): void {
    this.adjustmentForm.patchValue({
      userId: user._id,
      type: type,
      amount: '',
      reason: ''
    });
    this.selectedTab = 1; // Switch to adjustment tab
  }

  async processAdjustment(): Promise<void> {
    if (this.adjustmentForm.invalid) return;
    
    this.processing = true;
    try {
      const formValue = this.adjustmentForm.value;
      const response = await this.creditService.adjustUserCredits(formValue).toPromise();
      
      if (response?.success) {
        this.snackBar.open(response.message, 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.resetForm();
        this.refreshData();
      }
    } catch (error: any) {
      console.error('Error adjusting credits:', error);
      this.snackBar.open(error.error?.message || 'Error processing adjustment', 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.processing = false;
    }
  }

  resetForm(): void {
    this.adjustmentForm.reset({
      userId: '',
      type: 'deposit',
      amount: '',
      reason: ''
    });
  }

  refreshData(): void {
    this.loadData();
  }

  viewUserHistory(user: UserCreditInfo): void {
    // Navigate to user-specific credit history (to be implemented)
    this.snackBar.open(`Credit history for ${user.fullName} - Feature coming soon!`, 'Close', { 
      duration: 3000 
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Helper methods for template
  getTransactionIcon(type: string): string {
    switch (type) {
      case 'deposit': return 'add_circle';
      case 'deduction': return 'remove_circle';
      case 'refund': return 'refresh';
      case 'adjustment': return 'tune';
      default: return 'account_balance';
    }
  }

  getAmountPrefix(type: string): string {
    return ['deposit', 'refund'].includes(type) ? '+' : '-';
  }

  // Statistics helper methods
  getTotalDeposits(): number {
    return this.creditStats?.totalDeposits || 0;
  }

  getTotalUsed(): number {
    return this.creditStats?.totalUsed || 0;
  }

  getTotalRefunds(): number {
    return this.creditStats?.totalRefunds || 0;
  }

  getTotalBalance(): number {
    return this.creditStats?.totalBalance || 0;
  }

  getUsersWithCredits(): number {
    return this.creditStats?.usersWithCredits || 0;
  }

  getTotalTransactions(): number {
    return this.creditStats?.totalTransactions || 0;
  }
}