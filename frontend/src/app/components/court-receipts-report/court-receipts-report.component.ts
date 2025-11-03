import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CreditService, CreditTransaction } from '../../services/credit.service';
import { PaymentConfirmationDialogComponent, PaymentConfirmationData } from '../payment-confirmation-dialog/payment-confirmation-dialog.component';
import { UnrecordConfirmationDialogComponent, UnrecordDialogData } from '../unrecord-confirmation-dialog/unrecord-confirmation-dialog.component';
import { EditPaymentAmountDialogComponent, EditPaymentAmountData } from '../edit-payment-amount-dialog/edit-payment-amount-dialog.component';
import { environment } from '../../../environments/environment';

interface PaymentRecord {
  _id: string;
  paymentDate?: string;
  referenceNumber: string;
  amount: number;
  serviceFee?: number;
  courtRevenue?: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'record';
  memberName: string;
  memberUsername: string;
  reservationDate: string;
  timeSlot: number;
  timeSlotDisplay: string;
  players: string[];
  isPeakHour: boolean;
  approvedBy?: string;
  approvedAt?: string;
  recordedBy?: string;
  recordedAt?: string;
  userId: {
    _id: string;
    username: string;
    fullName: string;
  };
  // Open Play Event data
  pollId?: {
    _id: string;
    title: string;
    openPlayEvent?: {
      eventDate: Date;
      startTime: number;
      endTime: number;
      confirmedPlayers: Array<{
        _id: string;
        username: string;
        fullName: string;
      }>;
    };
  };
  isOpenPlayEvent: boolean;
  openPlayParticipants: string[];
}

interface PaymentsReportData {
  payments: PaymentRecord[];
  summary: {
    totalPayments: number;
    totalAmount: number;
    pendingPayments: number;
    completedPayments: number;
    recordedPayments: number;
    totalServiceFees: number;
    totalCourtRevenue: number;
  };
  paymentMethodBreakdown: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

@Component({
  selector: 'app-court-receipts-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    ReactiveFormsModule,
    FormsModule
  ],
  template: `
    <div class="report-container">
      <!-- Modern Header with Gradient -->
      <div class="modern-header">
        <div class="header-background"></div>
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-text">
            <h1 class="page-title">
              <mat-icon class="title-icon">assessment</mat-icon>
              Payment Management
            </h1>
            <p class="page-subtitle">Streamlined payment approval and recording workflow</p>
          </div>
        </div>
      </div>

      <!-- Filter Section with Modern Design -->
      <div class="filter-section">
        <mat-card class="filter-card modern-card">
          <div class="filter-header">
            <div class="filter-title">
              <mat-icon>filter_list</mat-icon>
              <span>Filter Options</span>
            </div>
          </div>
          <mat-card-content>
            <form [formGroup]="dateRangeForm" class="filter-form">
              <div class="date-inputs">
                <mat-form-field appearance="outline" class="modern-input">
                  <mat-label>Start Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                  <mat-icon matPrefix>event</mat-icon>
                  <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="modern-input">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                  <mat-icon matPrefix>event</mat-icon>
                  <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>

              <div class="action-buttons">
                <button mat-raised-button class="primary-action" (click)="loadReport()" [disabled]="loading">
                  <mat-icon>refresh</mat-icon>
                  <span>Update Report</span>
                </button>
                <button mat-stroked-button class="secondary-action" (click)="openRecordedPaymentsModal()">
                  <mat-icon>verified</mat-icon>
                  <span>View Recorded</span>
                </button>
                <button mat-stroked-button class="secondary-action" (click)="resetDateRange()">
                  <mat-icon>restore</mat-icon>
                  <span>Reset</span>
                </button>
                <button mat-stroked-button class="export-action" (click)="exportToCSV()" [disabled]="!reportData || reportData.payments.length === 0">
                  <mat-icon>download</mat-icon>
                  <span>Export CSV</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
        <p>Loading court receipts...</p>
      </div>

      <div *ngIf="!loading && reportData">
        <!-- Modern Summary Cards -->
        <div class="stats-section">
          <h2 class="section-title">
            <mat-icon>insights</mat-icon>
            Overview & Analytics
          </h2>

          <div class="stats-grid">
            <!-- Total Payments Card -->
            <div class="stat-card total-card">
              <div class="stat-icon-wrapper total-bg">
                <mat-icon class="stat-icon">payments</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">Total Payments</div>
                <div class="stat-value">₱{{reportData.summary.totalAmount.toFixed(2)}}</div>
                <div class="stat-meta">{{reportData.summary.totalPayments}} transactions</div>
              </div>
              <div class="stat-trend">
                <mat-icon class="trend-icon">trending_up</mat-icon>
              </div>
            </div>

            <!-- Pending Card -->
            <div class="stat-card pending-card">
              <div class="stat-icon-wrapper pending-bg">
                <mat-icon class="stat-icon">pending_actions</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">Pending Approval</div>
                <div class="stat-value">{{reportData.summary.pendingPayments}}</div>
                <div class="stat-meta">Awaiting review</div>
              </div>
              <div class="stat-badge pending-badge">Action Required</div>
            </div>

            <!-- Approved Card -->
            <div class="stat-card approved-card">
              <div class="stat-icon-wrapper approved-bg">
                <mat-icon class="stat-icon">check_circle</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">Approved</div>
                <div class="stat-value">{{reportData.summary.completedPayments}}</div>
                <div class="stat-meta">Ready to record</div>
              </div>
              <div class="stat-badge approved-badge">Ready</div>
            </div>

            <!-- Recorded Card -->
            <div class="stat-card recorded-card">
              <div class="stat-icon-wrapper recorded-bg">
                <mat-icon class="stat-icon">verified</mat-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">Recorded</div>
                <div class="stat-value">{{reportData.summary.recordedPayments}}</div>
                <div class="stat-meta">Fully processed</div>
              </div>
              <div class="stat-badge recorded-badge">Complete</div>
            </div>
          </div>
        </div>

        <!-- Revenue Breakdown Section -->
        <div class="revenue-section">
          <h2 class="section-title">
            <mat-icon>account_balance</mat-icon>
            Revenue Distribution
          </h2>

          <div class="revenue-grid">
            <mat-card class="revenue-card modern-card">
              <div class="revenue-header">
                <div class="revenue-icon service-fee-icon">
                  <mat-icon>monetization_on</mat-icon>
                </div>
                <div class="revenue-info">
                  <div class="revenue-title">App Service Fees</div>
                  <div class="revenue-subtitle">10% commission</div>
                </div>
              </div>
              <div class="revenue-amount service-fee-amount">
                ₱{{reportData.summary.totalServiceFees?.toFixed(2) || '0.00'}}
              </div>
              <div class="revenue-footer">
                <mat-icon>info_outline</mat-icon>
                <span>Platform maintenance & development</span>
              </div>
            </mat-card>

            <mat-card class="revenue-card modern-card">
              <div class="revenue-header">
                <div class="revenue-icon court-revenue-icon">
                  <mat-icon>sports_tennis</mat-icon>
                </div>
                <div class="revenue-info">
                  <div class="revenue-title">Court Revenue</div>
                  <div class="revenue-subtitle">90% to club</div>
                </div>
              </div>
              <div class="revenue-amount court-revenue-amount">
                ₱{{reportData.summary.totalCourtRevenue?.toFixed(2) || '0.00'}}
              </div>
              <div class="revenue-footer">
                <mat-icon>info_outline</mat-icon>
                <span>Direct earnings for tennis club</span>
              </div>
            </mat-card>
          </div>
        </div>

        <!-- Payment Methods Section -->
        <div class="payment-methods-section">
          <h2 class="section-title">
            <mat-icon>credit_card</mat-icon>
            Payment Methods Breakdown
          </h2>

          <mat-card class="modern-card">
            <mat-card-content>
              <div class="methods-grid">
                <div *ngFor="let method of reportData.paymentMethodBreakdown" class="method-card">
                  <div class="method-icon-wrapper">
                    <mat-icon class="method-icon">{{getPaymentMethodIcon(method.paymentMethod)}}</mat-icon>
                  </div>
                  <div class="method-details">
                    <div class="method-name">{{formatPaymentMethod(method.paymentMethod)}}</div>
                    <div class="method-count">{{method.count}} payments</div>
                  </div>
                  <div class="method-amount">₱{{method.totalAmount.toFixed(2)}}</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Payments Table -->
        <div class="table-section">
          <h2 class="section-title">
            <mat-icon>table_chart</mat-icon>
            Payment Records
          </h2>

          <mat-card class="modern-card table-card">
            <mat-card-content>
            <mat-tab-group>
              <!-- Active Payments Tab -->
              <mat-tab label="Active Payments">
                <div class="tab-content">
                  <div class="table-container">
                    <table mat-table [dataSource]="getActivePayments()" class="receipts-table">
                
                <!-- Payment Date Column -->
                <ng-container matColumnDef="paymentDate">
                  <th mat-header-cell *matHeaderCellDef>Payment Date</th>
                  <td mat-cell *matCellDef="let payment">
                    <span *ngIf="payment.paymentDate">{{formatDate(payment.paymentDate)}}</span>
                    <span *ngIf="!payment.paymentDate" class="no-date">Not paid</span>
                  </td>
                </ng-container>

                <!-- Reference Number Column -->
                <ng-container matColumnDef="referenceNumber">
                  <th mat-header-cell *matHeaderCellDef>Reference #</th>
                  <td mat-cell *matCellDef="let payment">
                    {{payment.referenceNumber}}
                  </td>
                </ng-container>

                <!-- Member Column -->
                <ng-container matColumnDef="member">
                  <th mat-header-cell *matHeaderCellDef>Member</th>
                  <td mat-cell *matCellDef="let payment">
                    <div class="member-info">
                      <strong>{{payment.memberName}}</strong>
                      <small>@{{payment.memberUsername}}</small>
                    </div>
                  </td>
                </ng-container>

                <!-- Reservation Details Column -->
                <ng-container matColumnDef="reservation">
                  <th mat-header-cell *matHeaderCellDef>Reservation</th>
                  <td mat-cell *matCellDef="let payment">
                    <div class="reservation-info">
                      <div class="reservation-date">{{formatDate(payment.reservationDate)}}</div>
                      <div class="time-slot">
                        {{payment.timeSlotDisplay}}
                        <mat-chip *ngIf="payment.isPeakHour" class="peak-chip">Peak</mat-chip>
                        <mat-chip *ngIf="payment.isOpenPlayEvent" class="open-play-chip">Open Play</mat-chip>
                      </div>
                      <div class="participants-info" *ngIf="!payment.isOpenPlayEvent && payment.players && payment.players.length > 0">
                        <div class="participants-count">{{payment.players.length}} players</div>
                        <div class="participants-list">{{getPlayersList(payment)}}</div>
                      </div>
                      <div class="participants-info" *ngIf="payment.isOpenPlayEvent">
                        <div class="participants-count">{{payment.openPlayParticipants.length}} participants</div>
                        <div class="participants-list">{{getParticipantsList(payment)}}</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Payment Method Column -->
                <ng-container matColumnDef="paymentMethod">
                  <th mat-header-cell *matHeaderCellDef>Payment Method</th>
                  <td mat-cell *matCellDef="let payment">
                    <div class="payment-method">
                      <mat-icon>{{getPaymentMethodIcon(payment.paymentMethod)}}</mat-icon>
                      {{formatPaymentMethod(payment.paymentMethod)}}
                    </div>
                  </td>
                </ng-container>

                <!-- Total Amount Column -->
                <ng-container matColumnDef="totalAmount">
                  <th mat-header-cell *matHeaderCellDef>Total Amount</th>
                  <td mat-cell *matCellDef="let payment">
                    <div class="amount-container">
                      <!-- Show all amounts with click handler that provides appropriate feedback -->
                      <div class="amount-display" 
                           [class.editable]="canEditPayment(payment)"
                           [class.readonly]="!canEditPayment(payment)"
                           (click)="handleAmountClick(payment)"
                           [title]="getAmountTitle(payment)">
                        <strong class="total-amount">₱{{payment.amount.toFixed(2)}}</strong>
                        <mat-icon class="action-icon">{{getAmountIcon(payment.status)}}</mat-icon>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let payment">
                    <mat-chip [color]="getStatusColor(payment.status)" selected>
                      {{payment.status | titlecase}}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let payment">
                    <div class="action-buttons">
                      <!-- Approve button for pending payments -->
                      <button
                        *ngIf="payment.status === 'pending'"
                        mat-raised-button
                        color="primary"
                        [disabled]="processingPaymentId === payment._id || processing.includes(payment._id)"
                        (click)="approvePayment(payment)"
                        class="action-button">
                        <mat-icon *ngIf="processing.includes(payment._id)" class="spinner">hourglass_empty</mat-icon>
                        <span *ngIf="!processing.includes(payment._id)">Approve</span>
                        <span *ngIf="processing.includes(payment._id)">Processing...</span>
                      </button>

                      <!-- Record and Cancel buttons for completed payments -->
                      <button
                        *ngIf="payment.status === 'completed'"
                        mat-raised-button
                        color="accent"
                        [disabled]="processingPaymentId === payment._id || processing.includes(payment._id)"
                        (click)="recordPayment(payment)"
                        class="action-button"
                        style="margin-right: 8px;">
                        <mat-icon *ngIf="processing.includes(payment._id)" class="spinner">hourglass_empty</mat-icon>
                        <span *ngIf="!processing.includes(payment._id)">Record</span>
                        <span *ngIf="processing.includes(payment._id)">Processing...</span>
                      </button>

                      <button
                        *ngIf="payment.status === 'completed'"
                        mat-raised-button
                        color="warn"
                        [disabled]="processing.includes(payment._id)"
                        (click)="cancelPayment(payment)"
                        class="action-button cancel-button">
                        <mat-icon>cancel</mat-icon>
                        Cancel
                      </button>
                    </div>
                  </td>
                </ng-container>

                      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                  </div>

                  <div *ngIf="getActivePayments().length === 0" class="no-data">
                    <mat-icon>receipt_long</mat-icon>
                    <h3>No active payments found</h3>
                    <p>No approved court payments ready to be recorded for the selected date range.</p>
                  </div>
                </div>
              </mat-tab>

              <!-- Credit Purchases Tab -->
              <mat-tab label="Credit Purchases">
                <div class="tab-content">
                  <div class="table-container">
                    <table mat-table [dataSource]="getCreditDeposits()" class="receipts-table">
                
                      <!-- Request Date Column -->
                      <ng-container matColumnDef="requestDate">
                        <th mat-header-cell *matHeaderCellDef>Request Date</th>
                        <td mat-cell *matCellDef="let deposit">
                          <div class="date-cell">
                            <span class="date">{{formatDate(deposit.createdAt)}}</span>
                            <span class="time">{{formatTimeFromDate(deposit.createdAt)}}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Member Column -->
                      <ng-container matColumnDef="member">
                        <th mat-header-cell *matHeaderCellDef>Member</th>
                        <td mat-cell *matCellDef="let deposit">
                          <div class="member-cell">
                            <strong>{{getUserFullName(deposit.userId)}}</strong>
                            <span class="username">@{{getUserUsername(deposit.userId)}}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Amount Column -->
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>Amount</th>
                        <td mat-cell *matCellDef="let deposit">
                          <div class="amount-cell">
                            <span class="amount">₱{{deposit.amount.toFixed(2)}}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Payment Method Column -->
                      <ng-container matColumnDef="paymentMethod">
                        <th mat-header-cell *matHeaderCellDef>Payment Method</th>
                        <td mat-cell *matCellDef="let deposit">
                          <mat-chip [class]="'payment-method-' + deposit.metadata?.paymentMethod">
                            {{getPaymentMethodLabel(deposit.metadata?.paymentMethod)}}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <!-- Status Column -->
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Status</th>
                        <td mat-cell *matCellDef="let deposit">
                          <mat-chip [class]="'status-' + deposit.status">
                            {{deposit.status | titlecase}}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <!-- Actions Column -->
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                        <td mat-cell *matCellDef="let deposit">
                          <div class="action-buttons">
                            <button 
                              *ngIf="deposit.status === 'pending' || deposit.status === 'completed'" 
                              mat-raised-button 
                              color="primary" 
                              (click)="recordCreditDeposit(deposit)"
                              [disabled]="loading">
                              <mat-icon>verified</mat-icon>
                              Record
                            </button>
                            <span *ngIf="deposit.status === 'recorded'" class="recorded-label">
                              <mat-icon>check_circle</mat-icon>
                              Recorded
                            </span>
                          </div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="creditDepositsColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: creditDepositsColumns;"></tr>
                    </table>

                    <div *ngIf="getCreditDeposits().length === 0" class="no-data">
                      <mat-icon>account_balance</mat-icon>
                      <p>No credit purchases found for the selected date range.</p>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Archived Payments Tab -->
              <mat-tab label="Archived Payments">
                <div class="tab-content">
                  <div class="table-container">
                    <table mat-table [dataSource]="getArchivedPayments()" class="receipts-table">
                
                      <!-- Payment Date Column -->
                      <ng-container matColumnDef="paymentDate">
                        <th mat-header-cell *matHeaderCellDef>Payment Date</th>
                        <td mat-cell *matCellDef="let payment">
                          <span *ngIf="payment.paymentDate">{{formatDate(payment.paymentDate)}}</span>
                          <span *ngIf="!payment.paymentDate" class="no-date">Not paid</span>
                        </td>
                      </ng-container>

                      <!-- Reference Number Column -->
                      <ng-container matColumnDef="referenceNumber">
                        <th mat-header-cell *matHeaderCellDef>Reference #</th>
                        <td mat-cell *matCellDef="let payment">
                          {{payment.referenceNumber}}
                        </td>
                      </ng-container>

                      <!-- Member Column -->
                      <ng-container matColumnDef="member">
                        <th mat-header-cell *matHeaderCellDef>Member</th>
                        <td mat-cell *matCellDef="let payment">
                          <div class="member-info">
                            <div class="member-name">{{payment.memberName}}</div>
                            <div class="member-username">@{{payment.memberUsername}}</div>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Reservation Details Column -->
                      <ng-container matColumnDef="reservation">
                        <th mat-header-cell *matHeaderCellDef>Reservation</th>
                        <td mat-cell *matCellDef="let payment">
                          <div class="reservation-info">
                            <div class="date">{{formatDate(payment.reservationDate)}}</div>
                            <div class="time">
                              {{payment.timeSlotDisplay}}
                              <mat-chip *ngIf="payment.isOpenPlayEvent" class="open-play-chip">Open Play</mat-chip>
                            </div>
                            <div class="participants-info" *ngIf="!payment.isOpenPlayEvent && payment.players.length > 0">
                              <div class="participants-count">{{payment.players.length}} players</div>
                              <div class="participants-list">{{getPlayersList(payment)}}</div>
                            </div>
                            <div class="participants-info" *ngIf="payment.isOpenPlayEvent">
                              <div class="participants-count">{{payment.openPlayParticipants.length}} participants</div>
                              <div class="participants-list">{{getParticipantsList(payment)}}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Amount Column -->
                      <ng-container matColumnDef="totalAmount">
                        <th mat-header-cell *matHeaderCellDef>Amount</th>
                        <td mat-cell *matCellDef="let payment">
                          <div class="amount-display">
                            <span class="amount">₱{{payment.amount.toFixed(2)}}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Payment Method Column -->
                      <ng-container matColumnDef="paymentMethod">
                        <th mat-header-cell *matHeaderCellDef>Payment Method</th>
                        <td mat-cell *matCellDef="let payment">
                          <mat-chip-set>
                            <mat-chip>{{formatPaymentMethod(payment.paymentMethod)}}</mat-chip>
                          </mat-chip-set>
                        </td>
                      </ng-container>

                      <!-- Status Column -->
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Status</th>
                        <td mat-cell *matCellDef="let payment">
                          <mat-chip-set>
                            <mat-chip [color]="getStatusColor(payment.status)" selected>
                              {{getStatusLabel(payment.status)}}
                            </mat-chip>
                          </mat-chip-set>
                        </td>
                      </ng-container>

                      <!-- Recorded Date Column -->
                      <ng-container matColumnDef="recordedDate">
                        <th mat-header-cell *matHeaderCellDef>Recorded Date</th>
                        <td mat-cell *matCellDef="let payment">
                          <span *ngIf="payment.recordedAt">{{formatDate(payment.recordedAt)}}</span>
                          <span *ngIf="!payment.recordedAt" class="no-date">-</span>
                        </td>
                      </ng-container>

                      <!-- Actions Column -->
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                        <td mat-cell *matCellDef="let payment">
                          <div class="action-buttons">
                            <button 
                              *ngIf="payment.status === 'record'"
                              mat-raised-button 
                              color="warn"
                              class="unrecord-button"
                              (click)="unrecordPayment(payment._id)"
                              [disabled]="processing.includes(payment._id)"
                              matTooltip="Unrecord payment and remove from Court Usage Report"
                              style="margin-top: 5px;">
                              <mat-icon>undo</mat-icon>
                              {{processing.includes(payment._id) ? 'Unrecording...' : 'Unrecord'}}
                            </button>
                          </div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="archivedDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: archivedDisplayedColumns;"></tr>
                    </table>
                  </div>

                  <div *ngIf="getArchivedPayments().length === 0" class="no-data">
                    <mat-icon>archive</mat-icon>
                    <h3>No archived payments found</h3>
                    <p>No archived court payments found for the selected date range.</p>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <!-- Record Payments Modal -->
    <div *ngIf="showRecordedModal" class="modal-overlay" (click)="closeRecordedModal()">
      <div class="recorded-modal" (click)="$event.stopPropagation()">
        <mat-card class="modal-card">
          <mat-card-header>
            <div class="modal-header">
              <mat-card-title>
                <mat-icon>verified</mat-icon>
                Record Payments
              </mat-card-title>
              <button mat-icon-button (click)="closeRecordedModal()" class="close-button">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loadingRecordedPayments" class="loading-recorded">
              <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
              <p>Loading recorded payments...</p>
            </div>

            <div *ngIf="!loadingRecordedPayments && recordedPayments.length === 0" class="no-recorded-data">
              <mat-icon>verified</mat-icon>
              <h3>No Record Payments</h3>
              <p>No payments have been recorded yet.</p>
            </div>

            <div *ngIf="!loadingRecordedPayments && recordedPayments.length > 0" class="recorded-table-container">
              <table mat-table [dataSource]="recordedPayments" class="recorded-table">
                
                <!-- Timestamp Column -->
                <ng-container matColumnDef="timestamp">
                  <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                  <td mat-cell *matCellDef="let payment">
                    {{formatDateTime(payment.recordedAt || payment.paymentDate)}}
                  </td>
                </ng-container>

                <!-- Member Column -->
                <ng-container matColumnDef="member">
                  <th mat-header-cell *matHeaderCellDef>Member</th>
                  <td mat-cell *matCellDef="let payment">
                    {{payment.memberName}}
                  </td>
                </ng-container>

                <!-- Date Column -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let payment">
                    {{formatDate(payment.reservationDate)}}
                  </td>
                </ng-container>

                <!-- Start Time Column -->
                <ng-container matColumnDef="startTime">
                  <th mat-header-cell *matHeaderCellDef>Start Time</th>
                  <td mat-cell *matCellDef="let payment">
                    {{formatTime(payment.timeSlot)}}
                  </td>
                </ng-container>

                <!-- End Time Column -->
                <ng-container matColumnDef="endTime">
                  <th mat-header-cell *matHeaderCellDef>End Time</th>
                  <td mat-cell *matCellDef="let payment">
                    {{formatTime(payment.timeSlot + 1)}}
                  </td>
                </ng-container>

                <!-- Paid To Column -->
                <ng-container matColumnDef="paidTo">
                  <th mat-header-cell *matHeaderCellDef>Paid to Cash/GCash</th>
                  <td mat-cell *matCellDef="let payment">
                    <div class="payment-method-badge">
                      <mat-icon>{{getPaymentMethodIcon(payment.paymentMethod)}}</mat-icon>
                      {{formatPaymentMethod(payment.paymentMethod)}}
                    </div>
                  </td>
                </ng-container>

                <!-- Amount Column -->
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let payment">
                    <strong class="amount-value">₱{{payment.amount.toFixed(2)}}</strong>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="recordedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: recordedColumns;"></tr>
              </table>
            </div>

            <div class="modal-actions">
              <button mat-button (click)="exportRecordedToCSV()" [disabled]="recordedPayments.length === 0">
                <mat-icon>download</mat-icon>
                Export Record Payments
              </button>
              <button mat-raised-button color="primary" (click)="closeRecordedModal()">
                Close
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

  `,
  styles: [`
    /* ===== CONTAINER & LAYOUT ===== */
    .report-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding-bottom: 40px;
    }

    /* ===== MODERN HEADER ===== */
    .modern-header {
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px;
      margin-bottom: 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .header-content {
      position: relative;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 1;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateX(-4px);
    }

    .header-text {
      flex: 1;
    }

    .page-title {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.5px;
    }

    .title-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .page-subtitle {
      margin: 8px 0 0 48px;
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
    }

    /* ===== FILTER SECTION ===== */
    .filter-section {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 24px;
    }

    .modern-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: none;
      background: white;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .modern-card:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .filter-header {
      padding: 20px 24px 0;
    }

    .filter-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .filter-title mat-icon {
      color: #667eea;
    }

    .filter-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .date-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .modern-input {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }

    .action-buttons button {
      border-radius: 8px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.25px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .primary-action {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0 24px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .primary-action:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    .secondary-action {
      border-color: #cbd5e1;
      color: #475569;
    }

    .secondary-action:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .export-action {
      border-color: #10b981;
      color: #10b981;
    }

    .export-action:hover:not(:disabled) {
      background: #d1fae5;
      border-color: #059669;
    }

    /* ===== SECTION TITLES ===== */
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }

    .section-title mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 40px;
      text-align: center;
      background: white;
      border-radius: 16px;
      margin: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    /* ===== STATS SECTION ===== */
    .stats-section {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .total-card::before { background: linear-gradient(90deg, #667eea, #764ba2); }
    .pending-card::before { background: linear-gradient(90deg, #f59e0b, #ef4444); }
    .approved-card::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
    .recorded-card::before { background: linear-gradient(90deg, #10b981, #059669); }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .total-bg { background: linear-gradient(135deg, #667eea15, #764ba215); }
    .pending-bg { background: linear-gradient(135deg, #f59e0b15, #ef444415); }
    .approved-bg { background: linear-gradient(135deg, #3b82f615, #2563eb15); }
    .recorded-bg { background: linear-gradient(135deg, #10b98115, #05966915); }

    .stat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .total-bg .stat-icon { color: #667eea; }
    .pending-bg .stat-icon { color: #f59e0b; }
    .approved-bg .stat-icon { color: #3b82f6; }
    .recorded-bg .stat-icon { color: #10b981; }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      letter-spacing: -1px;
    }

    .stat-meta {
      font-size: 13px;
      color: #94a3b8;
    }

    .stat-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pending-badge { background: #fef3c7; color: #92400e; }
    .approved-badge { background: #dbeafe; color: #1e40af; }
    .recorded-badge { background: #d1fae5; color: #065f46; }

    .stat-trend {
      position: absolute;
      bottom: 16px;
      right: 16px;
      opacity: 0.1;
    }

    .trend-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    /* ===== REVENUE SECTION ===== */
    .revenue-section {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 24px;
    }

    .revenue-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .revenue-card {
      padding: 24px;
    }

    .revenue-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .revenue-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .service-fee-icon {
      background: linear-gradient(135deg, #f59e0b15, #ef444415);
    }

    .service-fee-icon mat-icon {
      color: #f59e0b;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .court-revenue-icon {
      background: linear-gradient(135deg, #10b98115, #05966915);
    }

    .court-revenue-icon mat-icon {
      color: #10b981;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .revenue-info {
      flex: 1;
    }

    .revenue-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .revenue-subtitle {
      font-size: 13px;
      color: #64748b;
    }

    .revenue-amount {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }

    .service-fee-amount { color: #f59e0b; }
    .court-revenue-amount { color: #10b981; }

    .revenue-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 13px;
    }

    .revenue-footer mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* ===== PAYMENT METHODS SECTION ===== */
    .payment-methods-section {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 24px;
    }

    .methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .method-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .method-card:hover {
      border-color: #cbd5e1;
      transform: translateX(4px);
      background: white;
    }

    .method-icon-wrapper {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea15, #764ba215);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .method-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .method-details {
      flex: 1;
    }

    .method-name {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .method-count {
      font-size: 13px;
      color: #64748b;
    }

    .method-amount {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }


    /* ===== TABLE SECTION ===== */
    .table-section {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 24px;
    }

    .table-card {
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
      max-width: 100%;
    }

    .tab-content {
      padding-top: 20px;
    }

    .receipts-table {
      width: 100%;
      min-width: 1000px;
    }

    /* Modern table styling */
    ::ng-deep .mat-mdc-tab-group {
      --mdc-tab-indicator-active-indicator-color: #667eea;
    }

    ::ng-deep .mat-mdc-tab:not(.mat-mdc-tab-disabled).mdc-tab--active .mdc-tab__text-label {
      color: #667eea;
      font-weight: 600;
    }

    ::ng-deep .mat-mdc-tab {
      color: #64748b;
    }

    ::ng-deep .mat-mdc-table {
      border-radius: 8px;
      overflow: hidden;
    }

    ::ng-deep .mat-mdc-header-row {
      background: #f8fafc;
    }

    ::ng-deep .mat-mdc-header-cell {
      color: #475569;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    ::ng-deep .mat-mdc-row:hover {
      background: #f8fafc;
    }

    .member-info strong {
      display: block;
      font-size: 14px;
    }

    .member-info small {
      color: #666;
      font-size: 12px;
    }

    .reservation-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .reservation-date {
      font-weight: 500;
      font-size: 13px;
    }

    .time-slot {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }

    .peak-chip {
      font-size: 10px;
      height: 20px;
      background-color: #ff9800;
      color: white;
    }

    .open-play-chip {
      font-size: 10px;
      height: 20px;
      background-color: #4caf50;
      color: white;
    }

    .players-count {
      font-size: 12px;
      color: #666;
    }

    .participants-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .participants-count {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .participants-list {
      font-size: 11px;
      color: #888;
      line-height: 1.2;
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .payment-method mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .total-amount {
      color: #1976d2;
      font-size: 15px;
    }


    .no-date {
      color: #999;
      font-style: italic;
      font-size: 12px;
    }

    .action-button {
      min-width: 100px;
      font-size: 12px;
    }

    .action-button .spinner {
      animation: spin 1s linear infinite;
      font-size: 16px;
      margin-right: 4px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    mat-chip {
      font-size: 11px;
      min-height: 24px;
    }

    mat-chip.mat-chip-selected.mat-warn {
      background-color: #ff9800;
      color: white;
    }

    mat-chip.mat-chip-selected.mat-primary {
      background-color: #2196f3;
      color: white;
    }

    mat-chip.mat-chip-selected.mat-accent {
      background-color: #4caf50;
      color: white;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .recorded-modal {
      width: 90%;
      max-width: 1200px;
      max-height: 90vh;
      overflow: hidden;
    }

    .modal-card {
      margin: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .modal-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    .close-button {
      color: #666;
    }

    .close-button:hover {
      color: #333;
    }

    .loading-recorded {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;
    }

    .no-recorded-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .no-recorded-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #4caf50;
    }

    .no-recorded-data h3 {
      margin: 0 0 8px 0;
    }

    .no-recorded-data p {
      margin: 0;
      font-size: 14px;
    }

    .recorded-table-container {
      overflow-x: auto;
      max-height: 60vh;
      overflow-y: auto;
    }

    .recorded-table {
      width: 100%;
      min-width: 800px;
    }

    .recorded-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }

    .payment-method-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .payment-method-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .amount-value {
      color: #2196f3;
      font-size: 14px;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .recorded-payments-btn {
      margin-right: 12px;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .no-data h3 {
      margin: 0 0 8px 0;
    }

    .no-data p {
      margin: 0;
      font-size: 14px;
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 768px) {
      .modern-header {
        padding: 24px 16px;
      }

      .page-title {
        font-size: 24px;
      }

      .title-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .page-subtitle {
        font-size: 14px;
        margin-left: 40px;
      }

      .filter-section,
      .stats-section,
      .revenue-section,
      .payment-methods-section,
      .table-section {
        padding: 0 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .revenue-grid {
        grid-template-columns: 1fr;
      }

      .methods-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
      }

      .date-inputs {
        grid-template-columns: 1fr;
      }

      .stat-value {
        font-size: 28px;
      }

      .revenue-amount {
        font-size: 28px;
      }
    }

    /* ===== SMOOTH ANIMATIONS ===== */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .stat-card,
    .revenue-card,
    .method-card {
      animation: fadeIn 0.5s ease-out;
    }

    /* Stagger animation for cards */
    .stat-card:nth-child(1) { animation-delay: 0.1s; }
    .stat-card:nth-child(2) { animation-delay: 0.2s; }
    .stat-card:nth-child(3) { animation-delay: 0.3s; }
    .stat-card:nth-child(4) { animation-delay: 0.4s; }

    /* Amount Display Styles */
    .amount-container {
      width: 100%;
    }

    .amount-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      min-width: 110px;
    }

    /* Editable amounts (pending payments) */
    .amount-display.editable {
      cursor: pointer;
      background: rgba(59, 130, 246, 0.03);
    }

    .amount-display.editable:hover {
      background: rgba(59, 130, 246, 0.08);
      border-color: rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }

    .amount-display.editable:hover .total-amount {
      color: #1d4ed8;
    }

    /* Read-only amounts (completed/recorded payments) */
    .amount-display.readonly {
      cursor: default;
      background: rgba(107, 114, 128, 0.03);
    }

    .amount-display.readonly:hover {
      background: rgba(107, 114, 128, 0.05);
    }

    .amount-display .total-amount {
      font-weight: 600;
      font-size: 14px;
      color: #1e293b;
      transition: color 0.2s ease;
    }

    /* Action icon for all payment types */
    .action-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      transition: all 0.2s ease;
    }

    /* Edit icon for pending payments */
    .amount-display.editable .action-icon {
      color: #94a3b8;
      opacity: 0;
    }

    .amount-display.editable:hover .action-icon {
      opacity: 1;
      color: #3b82f6;
    }

    /* Status icon for completed payments */
    .amount-display.readonly .action-icon {
      color: #6b7280;
      opacity: 0.7;
    }

    .amount-display.readonly:hover .action-icon {
      opacity: 1;
    }

    /* Modal Panel Styling */
    ::ng-deep .edit-amount-dialog .mat-mdc-dialog-container {
      padding: 0;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class CourtReceiptsReportComponent implements OnInit {
  reportData: PaymentsReportData | null = null;
  loading = false;
  processingPaymentId: string | null = null;
  processing: string[] = [];
  
  // Recorded payments modal
  showRecordedModal = false;
  loadingRecordedPayments = false;
  recordedPayments: PaymentRecord[] = [];
  recordedColumns = ['timestamp', 'member', 'date', 'startTime', 'endTime', 'paidTo', 'amount'];
  
  // Credit deposits data
  creditDeposits: CreditTransaction[] = [];
  creditDepositsColumns = ['requestDate', 'member', 'amount', 'paymentMethod', 'status', 'actions'];
  loadingCreditDeposits = false;
  
  // Amount editing
  updatingPayment = false;
  
  private apiUrl = environment.apiUrl;
  
  
  dateRangeForm = new FormGroup({
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null)
  });

  displayedColumns: string[] = [
    'paymentDate',
    'referenceNumber', 
    'member',
    'reservation',
    'paymentMethod',
    'totalAmount',
    'status',
    'actions'
  ];
  
  archivedDisplayedColumns: string[] = [
    'paymentDate',
    'referenceNumber',
    'member', 
    'reservation',
    'paymentMethod',
    'totalAmount',
    'status',
    'recordedDate',
    'actions'
  ];

  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private creditService: CreditService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Set default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.dateRangeForm.patchValue({
      startDate: startDate,
      endDate: endDate
    });
  }

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    this.loadReport();
    this.loadCreditDeposits();
  }

  loadReport(): void {
    this.loading = true;
    this.loadCreditDeposits();
    
    const params: any = {};
    if (this.dateRangeForm.value.startDate) {
      params.startDate = this.dateRangeForm.value.startDate.toISOString();
    }
    if (this.dateRangeForm.value.endDate) {
      params.endDate = this.dateRangeForm.value.endDate.toISOString();
    }

    this.http.get<{success: boolean, data: PaymentRecord[]}>(`${this.baseUrl}/payments`, { params })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Transform the payments data to match our interface
            this.reportData = {
              payments: response.data.map((payment: any) => {
                const reservation = payment.reservationId || {};
                const poll = payment.pollId || {};
                const openPlayEvent = poll.openPlayEvent || {};

                // Determine payment type
                const isOpenPlayEvent = !!payment.pollId;
                const isManualPayment = payment.metadata?.isManualPayment;

                let players: string[] = [];
                let reservationDate: string;
                let timeSlot: number;
                let timeSlotDisplay: string;
                let openPlayParticipants: string[] = [];

                if (isManualPayment) {
                  // Manual payment
                  players = payment.metadata.playerNames || [];
                  reservationDate = payment.metadata.courtUsageDate || new Date().toISOString();
                  timeSlot = payment.metadata.startTime || 0;
                  const endTime = payment.metadata.endTime || (timeSlot + 1);
                  timeSlotDisplay = `${timeSlot}:00-${endTime}:00`;
                } else if (isOpenPlayEvent) {
                  // Open Play event
                  reservationDate = openPlayEvent.eventDate || new Date().toISOString();
                  timeSlot = openPlayEvent.startTime || 18;
                  timeSlotDisplay = `${openPlayEvent.startTime || 18}:00-${openPlayEvent.endTime || 20}:00`;
                  openPlayParticipants = (openPlayEvent.confirmedPlayers || []).map((p: any) => p.fullName);
                  players = openPlayParticipants; // For backward compatibility
                } else {
                  // Court reservation
                  // Map player objects to their names
                  const playersArray = reservation.players || [];
                  players = playersArray.map((p: any) => {
                    if (typeof p === 'string') return p;
                    // New format: objects with 'name' property
                    if (p.name) return p.name;
                    // Fallback to user object properties
                    return p.fullName || p.username || 'Unknown Player';
                  });
                  reservationDate = reservation.date || new Date().toISOString();
                  timeSlot = reservation.timeSlot || 0;
                  const endTimeSlot = reservation.endTimeSlot || (timeSlot + 1);
                  timeSlotDisplay = `${timeSlot}:00-${endTimeSlot}:00`;

                }
                
                return {
                  ...payment,
                  memberName: payment.userId?.fullName || 'Unknown',
                  memberUsername: payment.userId?.username || 'unknown',
                  reservationDate,
                  timeSlot,
                  timeSlotDisplay,
                  players,
                  openPlayParticipants,
                  isOpenPlayEvent,
                  isPeakHour: payment.metadata?.isPeakHour || false
                };
              }),
              summary: {
                totalPayments: response.data.filter((p: any) => p.status === 'completed' || p.status === 'record').length,
                totalAmount: response.data.filter((p: any) => p.status === 'completed' || p.status === 'record').reduce((sum: number, p: any) => sum + p.amount, 0),
                pendingPayments: response.data.filter((p: any) => p.status === 'pending').length,
                completedPayments: response.data.filter((p: any) => p.status === 'completed').length,
                recordedPayments: response.data.filter((p: any) => p.status === 'record').length,
                totalServiceFees: response.data.filter((p: any) => p.status === 'completed' || p.status === 'record').reduce((sum: number, p: any) => sum + (p.amount * 0.10), 0),
                totalCourtRevenue: response.data.filter((p: any) => p.status === 'completed' || p.status === 'record').reduce((sum: number, p: any) => sum + (p.amount * 0.90), 0)
              },
              paymentMethodBreakdown: this.calculatePaymentMethodBreakdown(response.data),
              period: {
                startDate: params.startDate || '',
                endDate: params.endDate || ''
              }
            };
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading payments report:', error);
          this.showMessage('Failed to load payments data', 'error');
          this.loading = false;
        }
      });
  }

  resetDateRange(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.dateRangeForm.patchValue({
      startDate: startDate,
      endDate: endDate
    });
    
    this.loadReport();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatPaymentMethod(method: string): string {
    const methodMap: {[key: string]: string} = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'gcash': 'GCash',
      'coins': 'Coins'
    };
    return methodMap[method] || method;
  }

  getPaymentMethodIcon(method: string): string {
    const iconMap: {[key: string]: string} = {
      'cash': 'payments',
      'bank_transfer': 'account_balance',
      'gcash': 'phone_android',
      'coins': 'monetization_on'
    };
    return iconMap[method] || 'payment';
  }

  exportToCSV(): void {
    if (!this.reportData || !this.reportData.payments.length) {
      return;
    }

    const headers = [
      'Payment Date',
      'Reference Number',
      'Member Name', 
      'Username',
      'Reservation Date',
      'Time Slot',
      'Players Count',
      'Event Type',
      'Participants',
      'Peak Hour',
      'Payment Method',
      'Total Amount',
      'Status',
      'Approved By',
      'Recorded By'
    ];

    const csvContent = [
      headers.join(','),
      ...this.reportData.payments.map(payment => [
        `"${payment.paymentDate ? this.formatDate(payment.paymentDate) : 'Not paid'}"`,
        `"${payment.referenceNumber}"`,
        `"${payment.memberName}"`,
        `"${payment.memberUsername}"`,
        `"${this.formatDate(payment.reservationDate)}"`,
        `"${payment.timeSlotDisplay}"`,
        payment.players.length,
        payment.isOpenPlayEvent ? 'Open Play Event' : 'Court Reservation',
        payment.isOpenPlayEvent ? `"${payment.openPlayParticipants.join(', ')}"` : `"${payment.players.join(', ')}"`,
        payment.isPeakHour ? 'Yes' : 'No',
        `"${this.formatPaymentMethod(payment.paymentMethod)}"`,
        payment.amount.toFixed(2),
        `"${payment.status}"`,
        `"${payment.approvedBy || ''}"`,
        `"${payment.recordedBy || ''}"`
      ].join(','))
    ].join('\n');

    // Add summary at the end
    const summaryRows = [
      '',
      'SUMMARY',
      `Total Payments,${this.reportData.summary.totalPayments}`,
      `Total Amount,₱${this.reportData.summary.totalAmount.toFixed(2)}`,
      `Pending Payments,${this.reportData.summary.pendingPayments}`,
      `Approved Payments,${this.reportData.summary.completedPayments}`,
      `Record Payments,${this.reportData.summary.recordedPayments}`
    ];

    const finalContent = csvContent + '\n' + summaryRows.join('\n');

    // Create and download file
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const startDate = this.dateRangeForm.value.startDate;
      const endDate = this.dateRangeForm.value.endDate;
      const dateRange = startDate && endDate ? 
        `${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}` : 
        'last_30_days';
      
      link.setAttribute('download', `payment_management_${dateRange}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  calculatePaymentMethodBreakdown(payments: any[]): Array<{paymentMethod: string; count: number; totalAmount: number}> {
    const methodMap = new Map<string, {count: number; totalAmount: number}>();
    
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (methodMap.has(method)) {
        const current = methodMap.get(method)!;
        methodMap.set(method, {
          count: current.count + 1,
          totalAmount: current.totalAmount + payment.amount
        });
      } else {
        methodMap.set(method, {
          count: 1,
          totalAmount: payment.amount
        });
      }
    });
    
    return Array.from(methodMap.entries()).map(([paymentMethod, data]) => ({
      paymentMethod,
      ...data
    }));
  }

  getButtonTextForStatus(status: string): string {
    switch (status) {
      case 'pending': return 'Approve';
      case 'completed': return 'Record';
      case 'record': return '✓ Record';
      default: return '-';
    }
  }

  getButtonColorForStatus(status: string): string {
    switch (status) {
      case 'pending': return 'primary';
      case 'completed': return 'accent';
      default: return '';
    }
  }

  isButtonDisabled(status: string): boolean {
    return status === 'record' || status === 'failed' || status === 'refunded';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warn';
      case 'completed': return 'primary';
      case 'record': return 'accent';
      case 'failed': return 'warn';
      case 'refunded': return '';
      default: return '';
    }
  }

  onPaymentAction(payment: PaymentRecord): void {
    if (payment.status === 'pending') {
      this.approvePayment(payment);
    } else if (payment.status === 'completed') {
      this.recordPayment(payment);
    }
  }

  approvePayment(payment: PaymentRecord): void {
    const dialogData: PaymentConfirmationData = {
      action: 'approve',
      paymentId: payment._id,
      referenceNumber: payment.referenceNumber,
      memberName: payment.memberName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reservationDate: this.formatDate(payment.reservationDate),
      timeSlot: payment.timeSlotDisplay
    };

    const dialogRef = this.dialog.open(PaymentConfirmationDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        this.processingPaymentId = payment._id;
        
        this.http.put(`${this.baseUrl}/payments/${payment._id}/approve`, {})
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.showMessage('Payment approved successfully', 'success');
                this.loadReport(); // Refresh the data
              }
              this.processingPaymentId = null;
            },
            error: (error) => {
              console.error('Error approving payment:', error);
              this.showMessage('Failed to approve payment', 'error');
              this.processingPaymentId = null;
            }
          });
      }
    });
  }

  recordPayment(payment: PaymentRecord): void {
    const dialogData: PaymentConfirmationData = {
      action: 'record',
      paymentId: payment._id,
      referenceNumber: payment.referenceNumber,
      memberName: payment.memberName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reservationDate: this.formatDate(payment.reservationDate),
      timeSlot: payment.timeSlotDisplay
    };

    const dialogRef = this.dialog.open(PaymentConfirmationDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        this.processingPaymentId = payment._id;
        
        this.http.put(`${this.baseUrl}/payments/${payment._id}/record`, {})
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.showMessage('Payment recorded successfully', 'success');
                this.loadReport(); // Refresh the data
              }
              this.processingPaymentId = null;
            },
            error: (error) => {
              console.error('Error recording payment:', error);
              this.showMessage('Failed to record payment', 'error');
              this.processingPaymentId = null;
            }
          });
      }
    });
  }

  openRecordedPaymentsModal(): void {
    this.showRecordedModal = true;
    this.loadRecordedPayments();
  }

  closeRecordedModal(): void {
    this.showRecordedModal = false;
    this.recordedPayments = [];
  }

  loadRecordedPayments(): void {
    this.loadingRecordedPayments = true;
    
    // Fetch only completed payments (approved payments ready to be recorded)
    const params = { 
      status: 'completed',
      limit: '1000' // Get all completed payments ready for recording
    };

    this.http.get<{success: boolean, data: PaymentRecord[]}>(`${this.baseUrl}/payments`, { params })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Transform the payments data
            this.recordedPayments = response.data.map((payment: any) => {
              const reservation = payment.reservationId || {};
              const poll = payment.pollId || {};
              const openPlayEvent = poll.openPlayEvent || {};

              // Determine payment type
              const isOpenPlayEvent = !!payment.pollId;
              const isManualPayment = payment.metadata?.isManualPayment;

              let players: string[] = [];
              let reservationDate: string;
              let timeSlot: number;
              let timeSlotDisplay: string;
              let openPlayParticipants: string[] = [];

              if (isManualPayment) {
                // Manual payment
                players = payment.metadata.playerNames || [];
                reservationDate = payment.metadata.courtUsageDate || new Date().toISOString();
                timeSlot = payment.metadata.startTime || 0;
                const endTime = payment.metadata.endTime || (timeSlot + 1);
                timeSlotDisplay = `${timeSlot}:00-${endTime}:00`;
              } else if (isOpenPlayEvent) {
                // Open Play event
                reservationDate = openPlayEvent.eventDate || new Date().toISOString();
                timeSlot = openPlayEvent.startTime || 18;
                timeSlotDisplay = `${openPlayEvent.startTime || 18}:00-${openPlayEvent.endTime || 20}:00`;
                openPlayParticipants = (openPlayEvent.confirmedPlayers || []).map((p: any) => p.fullName);
                players = openPlayParticipants; // For backward compatibility
              } else {
                // Court reservation
                // Map player objects to their names
                const playersArray = reservation.players || [];
                players = playersArray.map((p: any) => {
                  if (typeof p === 'string') return p;
                  // New format: objects with 'name' property
                  if (p.name) return p.name;
                  // Fallback to user object properties
                  return p.fullName || p.username || 'Unknown Player';
                });
                reservationDate = reservation.date || new Date().toISOString();
                timeSlot = reservation.timeSlot || 0;
                const endTimeSlot = reservation.endTimeSlot || (timeSlot + 1);
                timeSlotDisplay = `${timeSlot}:00-${endTimeSlot}:00`;
              }
              
              return {
                ...payment,
                memberName: payment.userId?.fullName || 'Unknown',
                memberUsername: payment.userId?.username || 'unknown',
                reservationDate,
                timeSlot,
                timeSlotDisplay,
                players,
                openPlayParticipants,
                isOpenPlayEvent,
                isPeakHour: payment.metadata?.isPeakHour || false
              };
            });
          }
          this.loadingRecordedPayments = false;
        },
        error: (error) => {
          console.error('Error loading recorded payments:', error);
          this.showMessage('Failed to load recorded payments', 'error');
          this.loadingRecordedPayments = false;
        }
      });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(hour: number): string {
    // Convert 24-hour format to 12-hour format with AM/PM
    const date = new Date();
    date.setHours(hour, 0, 0, 0); // Set hours, minutes, seconds, milliseconds
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  exportRecordedToCSV(): void {
    if (!this.recordedPayments.length) {
      return;
    }

    const headers = [
      'Timestamp',
      'Member Name',
      'Date',
      'Start Time',
      'End Time',
      'Event Type',
      'Participants',
      'Paid to Cash/GCash',
      'Amount',
      'Recorded By',
      'Reference Number'
    ];

    const csvContent = [
      headers.join(','),
      ...this.recordedPayments.map(payment => [
        `"${this.formatDateTime(payment.recordedAt || payment.paymentDate || '')}"`,
        `"${payment.memberName}"`,
        `"${this.formatDate(payment.reservationDate)}"`,
        `"${this.formatTime(payment.timeSlot)}"`,
        `"${this.formatTime(payment.timeSlot + 1)}"`,
        payment.isOpenPlayEvent ? 'Open Play Event' : 'Court Reservation',
        payment.isOpenPlayEvent ? `"${payment.openPlayParticipants.join(', ')}"` : `"${payment.players.join(', ')}"`,
        `"${this.formatPaymentMethod(payment.paymentMethod)}"`,
        payment.amount.toFixed(2),
        `"${payment.recordedBy || ''}"`,
        `"${payment.referenceNumber}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `recorded_payments_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }


  showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Tab filtering methods
  getActivePayments(): PaymentRecord[] {
    if (!this.reportData || !this.reportData.payments) {
      return [];
    }
    return this.reportData.payments.filter(payment =>
      payment.status === 'completed'
    );
  }

  getArchivedPayments(): PaymentRecord[] {
    if (!this.reportData || !this.reportData.payments) {
      return [];
    }
    return this.reportData.payments.filter(payment =>
      payment.status === 'record' || payment.status === 'refunded' || payment.status === 'failed'
    );
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pending',
      'completed': 'Approved',
      'record': 'Recorded',
      'failed': 'Cancelled',
      'refunded': 'Cancelled'
    };
    return statusLabels[status] || status;
  }

  getParticipantsList(payment: PaymentRecord): string {
    if (!payment.isOpenPlayEvent || !payment.openPlayParticipants.length) {
      return '';
    }
    
    // Show first few names, then "and X others" if too many
    if (payment.openPlayParticipants.length <= 3) {
      return payment.openPlayParticipants.join(', ');
    } else {
      const firstThree = payment.openPlayParticipants.slice(0, 3).join(', ');
      const remaining = payment.openPlayParticipants.length - 3;
      return `${firstThree} and ${remaining} other${remaining !== 1 ? 's' : ''}`;
    }
  }

  getPlayersList(payment: PaymentRecord): string {
    if (payment.isOpenPlayEvent || !payment.players || !payment.players.length) {
      return '';
    }
    
    // Show first few names, then "and X others" if too many
    if (payment.players.length <= 3) {
      return payment.players.join(', ');
    } else {
      const firstThree = payment.players.slice(0, 3).join(', ');
      const remaining = payment.players.length - 3;
      return `${firstThree} and ${remaining} other${remaining !== 1 ? 's' : ''}`;
    }
  }

  unrecordPayment(paymentId: string): void {
    // Find payment details for confirmation
    const payment = this.getArchivedPayments().find(p => p._id === paymentId);
    if (!payment) {
      this.snackBar.open('❌ Payment not found', 'Close', { duration: 3000 });
      return;
    }

    // Open modern confirmation dialog
    const dialogRef = this.dialog.open(UnrecordConfirmationDialogComponent, {
      width: '600px',
      data: {
        paymentId: payment._id,
        memberName: payment.memberName,
        amount: payment.amount,
        referenceNumber: payment.referenceNumber,
        description: payment.reservationDate ?
          `${new Date(payment.reservationDate).toLocaleDateString()} - ${payment.timeSlotDisplay}` :
          undefined
      } as UnrecordDialogData,
      disableClose: true,
      panelClass: ['modern-dialog']
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.processing.push(paymentId);

        this.http.put(`${this.baseUrl}/payments/${paymentId}/unrecord`, {
          notes: 'Unrecorded via Admin Court Receipts Report'
        }).subscribe({
          next: (response: any) => {
            this.processing = this.processing.filter(id => id !== paymentId);
            this.snackBar.open('✅ Payment unrecorded successfully', 'Close', {
              duration: 4000,
              panelClass: ['success-snack']
            });

            // Refresh the report data to show the changes
            this.loadReport();
          },
          error: (error) => {
            this.processing = this.processing.filter(id => id !== paymentId);
            const message = error.error?.error || 'Failed to unrecord payment';
            this.snackBar.open(`❌ ${message}`, 'Close', {
              duration: 5000,
              panelClass: ['error-snack']
            });
          }
        });
      }
    });
  }

  cancelPayment(payment: PaymentRecord): void {
    // Open confirmation dialog
    const dialogData: PaymentConfirmationData = {
      action: 'cancel',
      paymentId: payment._id,
      referenceNumber: payment.referenceNumber,
      memberName: payment.memberName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reservationDate: this.formatDate(payment.reservationDate),
      timeSlot: payment.timeSlotDisplay
    };

    const dialogRef = this.dialog.open(PaymentConfirmationDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        this.processing.push(payment._id);

        this.http.put(`${this.baseUrl}/payments/${payment._id}/cancel`, {
          reason: result.reason || 'Cancelled by admin'
        }).subscribe({
          next: (response: any) => {
            this.processing = this.processing.filter(id => id !== payment._id);
            this.snackBar.open('✅ Payment cancelled successfully', 'Close', {
              duration: 4000,
              panelClass: ['success-snack']
            });

            // Refresh the report data to show the changes
            this.loadReport();
          },
          error: (error) => {
            this.processing = this.processing.filter(id => id !== payment._id);
            const message = error.error?.error || 'Failed to cancel payment';
            this.snackBar.open(`❌ ${message}`, 'Close', {
              duration: 5000,
              panelClass: ['error-snack']
            });
          }
        });
      }
    });
  }

  // Credit Deposits methods
  getCreditDeposits(): CreditTransaction[] {
    return this.creditDeposits;
  }

  loadCreditDeposits(): void {
    this.loadingCreditDeposits = true;
    const startDate = this.dateRangeForm.get('startDate')?.value;
    const endDate = this.dateRangeForm.get('endDate')?.value;

    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

    this.creditService.getAllCreditDeposits(1, 100, undefined, startDateStr, endDateStr).subscribe({
      next: (response) => {
        if (response.success) {
          this.creditDeposits = response.data.transactions;
        }
        this.loadingCreditDeposits = false;
      },
      error: (error) => {
        console.error('Error loading credit deposits:', error);
        this.showMessage('Failed to load credit deposits', 'error');
        this.loadingCreditDeposits = false;
      }
    });
  }

  recordCreditDeposit(deposit: CreditTransaction): void {
    if (this.processing.includes(deposit._id)) {
      return; // Already processing
    }

    this.processing.push(deposit._id);
    this.creditService.recordCreditDeposit(deposit._id).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the deposit status in the local array
          const index = this.creditDeposits.findIndex(d => d._id === deposit._id);
          if (index !== -1) {
            this.creditDeposits[index] = { ...this.creditDeposits[index], status: 'recorded' };
          }
          this.showMessage('Credit deposit recorded successfully', 'success');
        }
        this.processing = this.processing.filter(id => id !== deposit._id);
      },
      error: (error) => {
        console.error('Error recording credit deposit:', error);
        this.showMessage('Failed to record credit deposit', 'error');
        this.processing = this.processing.filter(id => id !== deposit._id);
      }
    });
  }

  getUserFullName(userId: string | { fullName: string }): string {
    if (typeof userId === 'string') {
      return 'Unknown User';
    }
    return userId.fullName;
  }

  getUserUsername(userId: string | { username: string }): string {
    if (typeof userId === 'string') {
      return 'unknown';
    }
    return userId.username;
  }

  getPaymentMethodLabel(method: string): string {
    const methodMap: {[key: string]: string} = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'gcash': 'GCash'
    };
    return methodMap[method] || method || 'N/A';
  }

  formatTimeFromDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Amount editing methods
  handleAmountClick(payment: PaymentRecord): void {
    
    // Only allow admins to edit amounts
    if (!this.authService.isAdmin()) {
      this.snackBar.open('Only admins can edit payment amounts', 'Close', {
        duration: 3000
      });
      return;
    }

    // Check payment status restrictions
    if (payment.status === 'record') {
      this.snackBar.open('Recorded payments cannot be edited. Use unrecord feature first.', 'Close', {
        duration: 4000
      });
      return;
    }

    if (payment.status === 'refunded') {
      this.snackBar.open('Refunded payments cannot be edited.', 'Close', {
        duration: 4000
      });
      return;
    }

    // Allow editing pending, completed, and failed payments
    if (!['pending', 'completed', 'failed'].includes(payment.status)) {
      this.snackBar.open(`Cannot edit ${payment.status} payments.`, 'Close', {
        duration: 4000
      });
      return;
    }

    // If we get here, the payment can be edited
    this.openEditAmountModal(payment);
  }

  openEditAmountModal(payment: PaymentRecord): void {
    const dialogData: EditPaymentAmountData = {
      paymentId: payment._id,
      memberName: payment.memberName,
      currentAmount: payment.amount,
      reservationDate: payment.reservationDate,
      timeSlot: payment.timeSlotDisplay
    };

    const dialogRef = this.dialog.open(EditPaymentAmountDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: false,
      panelClass: 'edit-amount-dialog'
    });

    dialogRef.afterClosed().subscribe(newAmount => {
      if (newAmount && newAmount !== payment.amount) {
        this.updatePaymentAmount(payment, newAmount);
      }
    });
  }

  canEditPayment(payment: PaymentRecord): boolean {
    if (!this.authService.isAdmin()) {
      return false;
    }
    
    // Admins can edit pending, completed, and failed payments
    return ['pending', 'completed', 'failed'].includes(payment.status);
  }

  getAmountTitle(payment: PaymentRecord): string {
    if (!this.authService.isAdmin()) {
      return 'Only admins can edit payment amounts';
    }
    
    if (this.canEditPayment(payment)) {
      return 'Click to edit amount';
    }
    
    const titles: {[key: string]: string} = {
      'record': 'Payment recorded in financial reports - use unrecord feature first',
      'refunded': 'Refunded payments cannot be edited'
    };
    return titles[payment.status] || 'Amount cannot be edited';
  }

  getAmountIcon(status: string): string {
    // Show edit icon for editable payments
    if (['pending', 'completed', 'failed'].includes(status)) {
      return 'edit';
    }
    
    const icons: {[key: string]: string} = {
      'record': 'assignment',
      'refunded': 'money_off'
    };
    return icons[status] || 'lock';
  }

  private updatePaymentAmount(payment: PaymentRecord, newAmount: number): void {
    this.updatingPayment = true;

    const updateData = {
      customAmount: newAmount
    };

    this.http.put<any>(`${this.apiUrl}/payments/${payment._id}`, updateData)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Payment amount updated successfully', 'Close', {
              duration: 3000
            });
            
            // Update the payment in the local data
            if (this.reportData && this.reportData.payments) {
              const paymentIndex = this.reportData.payments.findIndex(p => p._id === payment._id);
              if (paymentIndex !== -1) {
                this.reportData.payments[paymentIndex].amount = newAmount;
              }
            }
          } else {
            this.snackBar.open(response.message || 'Failed to update payment amount', 'Close', {
              duration: 3000
            });
          }
        },
        error: (error) => {
          console.error('Error updating payment amount:', error);
          this.snackBar.open('Error updating payment amount', 'Close', {
            duration: 3000
          });
        },
        complete: () => {
          this.updatingPayment = false;
        }
      });
  }
}