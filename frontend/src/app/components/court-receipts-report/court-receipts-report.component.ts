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
      <!-- Header -->
      <div class="report-header">
        <div class="header-info">
          <button mat-icon-button (click)="goBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <h1>Payment Management</h1>
            <p class="subtitle">Payment approval and recording workflow for admin verification</p>
          </div>
        </div>
        
        <!-- Date Range Filter -->
        <mat-card class="filter-card">
          <mat-card-header>
            <mat-card-title>Date Range Filter</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="dateRangeForm" class="date-filter-form">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
              
              <div class="filter-actions">
                <button mat-raised-button color="accent" (click)="openRecordedPaymentsModal()" class="recorded-payments-btn">
                  <mat-icon>verified</mat-icon>
                  View Record
                </button>
                <button mat-raised-button color="primary" (click)="loadReport()" [disabled]="loading">
                  <mat-icon>refresh</mat-icon>
                  Update Report
                </button>
                <button mat-button (click)="resetDateRange()">
                  <mat-icon>clear</mat-icon>
                  Clear Filter
                </button>
                <button mat-button (click)="exportToCSV()" [disabled]="!reportData || reportData.payments.length === 0">
                  <mat-icon>download</mat-icon>
                  Export CSV
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
        <!-- Summary Cards -->
        <div class="summary-grid">
          <mat-card class="summary-card total">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">payments</mat-icon>
                <div class="summary-details">
                  <h3>Total Payments</h3>
                  <p class="summary-value">₱{{reportData.summary.totalAmount.toFixed(2)}}</p>
                  <p class="summary-label">{{reportData.summary.totalPayments}} payments</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card pending">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">pending</mat-icon>
                <div class="summary-details">
                  <h3>Pending Approval</h3>
                  <p class="summary-value">{{reportData.summary.pendingPayments}}</p>
                  <p class="summary-label">Need admin approval</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card completed">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">check_circle</mat-icon>
                <div class="summary-details">
                  <h3>Approved</h3>
                  <p class="summary-value">{{reportData.summary.completedPayments}}</p>
                  <p class="summary-label">Ready to record</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card recorded">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">verified</mat-icon>
                <div class="summary-details">
                  <h3>Recorded</h3>
                  <p class="summary-value">{{reportData.summary.recordedPayments}}</p>
                  <p class="summary-label">Fully processed</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Service Fee Breakdown -->
        <div class="service-fee-grid">
          <mat-card class="summary-card service-fee">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">monetization_on</mat-icon>
                <div class="summary-details">
                  <h3>App Service Fees (10%)</h3>
                  <p class="summary-value">₱{{reportData.summary.totalServiceFees?.toFixed(2) || '0.00'}}</p>
                  <p class="summary-label">Revenue from app fees</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card court-revenue">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">sports_tennis</mat-icon>
                <div class="summary-details">
                  <h3>Court Revenue (90%)</h3>
                  <p class="summary-value">₱{{reportData.summary.totalCourtRevenue?.toFixed(2) || '0.00'}}</p>
                  <p class="summary-label">Revenue to tennis club</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Payment Method Breakdown -->
        <mat-card class="breakdown-card">
          <mat-card-header>
            <mat-card-title>Payment Method Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="payment-method-grid">
              <div *ngFor="let method of reportData.paymentMethodBreakdown" class="payment-method-item">
                <div class="method-header">
                  <mat-icon>{{getPaymentMethodIcon(method.paymentMethod)}}</mat-icon>
                  <h4>{{formatPaymentMethod(method.paymentMethod)}}</h4>
                </div>
                <div class="method-stats">
                  <span class="count">{{method.count}} payments</span>
                  <span class="total">₱{{method.totalAmount.toFixed(2)}}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Payments Table -->
        <mat-card class="receipts-table-card">
          <mat-card-header>
            <mat-card-title>Court Payment Management</mat-card-title>
            <mat-card-subtitle>Payment approval and recording workflow for admin verification</mat-card-subtitle>
          </mat-card-header>
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
                    <button 
                      mat-raised-button 
                      [color]="getButtonColorForStatus(payment.status)"
                      [disabled]="isButtonDisabled(payment.status) || processingPaymentId === payment._id"
                      (click)="onPaymentAction(payment)"
                      class="action-button">
                      <mat-icon *ngIf="processingPaymentId === payment._id" class="spinner">hourglass_empty</mat-icon>
                      <span *ngIf="processingPaymentId !== payment._id">{{getButtonTextForStatus(payment.status)}}</span>
                      <span *ngIf="processingPaymentId === payment._id">Processing...</span>
                    </button>
                  </td>
                </ng-container>

                      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                  </div>

                  <div *ngIf="getActivePayments().length === 0" class="no-data">
                    <mat-icon>receipt_long</mat-icon>
                    <h3>No active payments found</h3>
                    <p>No pending or completed court payments found for the selected date range.</p>
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
    .report-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .report-header {
      margin-bottom: 24px;
    }

    .header-info {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .back-button {
      margin-right: 12px;
    }

    .title-section h1 {
      margin: 0;
      color: #1976d2;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .filter-card {
      margin-bottom: 24px;
    }

    .date-filter-form {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-actions {
      display: flex;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .service-fee-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      border-left: 4px solid #1976d2;
    }

    .summary-card.pending {
      border-left-color: #ff9800;
    }

    .summary-card.completed {
      border-left-color: #2196f3;
    }

    .summary-card.recorded {
      border-left-color: #4caf50;
    }

    .summary-card.service-fee {
      border-left-color: #ff9800;
    }

    .summary-card.court-revenue {
      border-left-color: #4caf50;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .summary-card.pending .summary-icon {
      color: #ff9800;
    }

    .summary-card.completed .summary-icon {
      color: #2196f3;
    }

    .summary-card.recorded .summary-icon {
      color: #4caf50;
    }

    .summary-card.service-fee .summary-icon {
      color: #ff9800;
    }

    .summary-card.court-revenue .summary-icon {
      color: #4caf50;
    }

    .summary-details h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #333;
    }

    .summary-value {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 4px 0;
      color: #1976d2;
    }

    .summary-card.pending .summary-value {
      color: #ff9800;
    }

    .summary-card.completed .summary-value {
      color: #2196f3;
    }

    .summary-card.recorded .summary-value {
      color: #4caf50;
    }

    .summary-card.service-fee .summary-value {
      color: #ff9800;
    }

    .summary-card.court-revenue .summary-value {
      color: #4caf50;
    }

    .summary-label {
      margin: 0;
      font-size: 12px;
      color: #666;
    }

    .breakdown-card {
      margin-bottom: 24px;
    }

    .payment-method-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .payment-method-item {
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .method-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .method-header mat-icon {
      color: #1976d2;
    }

    .method-header h4 {
      margin: 0;
      font-size: 14px;
    }

    .method-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .count {
      font-size: 12px;
      color: #666;
    }

    .total {
      font-weight: bold;
      color: #1976d2;
    }


    .receipts-table-card {
      margin-bottom: 24px;
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

    @media (max-width: 768px) {
      .report-container {
        padding: 16px;
      }
      
      .date-filter-form {
        flex-direction: column;
        align-items: stretch;
      }
      
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }

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
                
                // Determine if this is an Open Play event
                const isOpenPlayEvent = !!payment.pollId;
                
                let players: string[] = [];
                let reservationDate: string;
                let timeSlot: number;
                let timeSlotDisplay: string;
                let openPlayParticipants: string[] = [];
                
                if (isOpenPlayEvent) {
                  // Open Play event
                  reservationDate = openPlayEvent.eventDate || new Date().toISOString();
                  timeSlot = openPlayEvent.startTime || 18;
                  timeSlotDisplay = `${openPlayEvent.startTime || 18}:00-${openPlayEvent.endTime || 20}:00`;
                  openPlayParticipants = (openPlayEvent.confirmedPlayers || []).map((p: any) => p.fullName);
                  players = openPlayParticipants; // For backward compatibility
                } else {
                  // Court reservation
                  players = reservation.players || [];
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
              
              // Determine if this is an Open Play event
              const isOpenPlayEvent = !!payment.pollId;
              
              let players: string[] = [];
              let reservationDate: string;
              let timeSlot: number;
              let timeSlotDisplay: string;
              let openPlayParticipants: string[] = [];
              
              if (isOpenPlayEvent) {
                // Open Play event
                reservationDate = openPlayEvent.eventDate || new Date().toISOString();
                timeSlot = openPlayEvent.startTime || 18;
                timeSlotDisplay = `${openPlayEvent.startTime || 18}:00-${openPlayEvent.endTime || 20}:00`;
                openPlayParticipants = (openPlayEvent.confirmedPlayers || []).map((p: any) => p.fullName);
                players = openPlayParticipants; // For backward compatibility
              } else {
                // Court reservation
                players = reservation.players || [];
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
      payment.status === 'record'
    );
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pending',
      'completed': 'Approved',
      'record': 'Recorded',
      'failed': 'Failed',
      'refunded': 'Refunded'
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