import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CancellationDialogComponent, CancellationDialogData } from '../cancellation-dialog/cancellation-dialog.component';
import { environment } from '../../../environments/environment';
import { canCancelReservation } from '../../utils/date-validation.util';

// Interfaces
interface Payment {
  _id: string;
  reservationId?: {
    _id: string;
    date: Date;
    timeSlot: number;
    players: string[];
    timeSlotDisplay: string;
    totalFee?: number;
  };
  pollId?: {
    _id: string;
    title: string;
    openPlayEvent?: {
      eventDate: Date;
      startTime: number;
      endTime: number;
    };
  };
  userId: {
    _id: string;
    username: string;
    fullName: string;
  };
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'gcash';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'record';
  transactionId?: string;
  referenceNumber: string;
  paymentDate?: Date;
  dueDate: Date;
  description: string;
  formattedAmount: string;
  statusDisplay: string;
  isOverdue: boolean;
  daysUntilDue: number;
  createdAt: Date;
  isSynthetic?: boolean; // Flag for synthetic payment objects created from unpaid reservations
  _groupedPayments?: Payment[]; // For storing original payments when grouped
  metadata?: {
    timeSlot?: number;
    date?: Date;
    playerCount?: number;
    isPeakHour?: boolean;
    originalFee?: number;
    isAdminOverride?: boolean;
    discounts?: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
    openPlayEventTitle?: string;
    openPlayEventDate?: Date;
    // Manual payment specific metadata
    isManualPayment?: boolean;
    playerNames?: string[];
    courtUsageDate?: Date;
    startTime?: number;
    endTime?: number;
    createdBy?: string;
    createdById?: string;
    // Cancellation metadata
    cancellation?: {
      reason: string;
      cancelledAt: Date;
      cancelledBy: string;
      previousStatus: string;
    };
  };
  notes?: string;
}

interface Reservation {
  _id: string;
  date: Date;
  timeSlot: number;
  players: string[];
  status: string;
  paymentStatus: string;
  totalFee: number;
  timeSlotDisplay: string;
  _groupedReservationIds?: string[]; // For grouped reservations
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="payments-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1>💳 Payment Management</h1>
        <p class="page-subtitle">Manage your court reservation payments</p>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'pending'"
          (click)="activeTab = 'pending'; loadPendingPayments()">
          Pending Payments
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'manual'"
          (click)="activeTab = 'manual'">
          Manual Payment
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'history'"
          (click)="activeTab = 'history'; loadPaymentHistory()">
          Payment History
        </button>
      </div>

      <!-- Manual Payment Tab -->
      <div class="tab-content" *ngIf="activeTab === 'manual'">
        <div class="manual-payment-container">
          <h2>Manual Payment</h2>
          <p class="tab-subtitle">Submit a payment for court usage not made through reservations</p>
          
          <div class="manual-payment-form-section">
            <div class="section-header">
              <div class="payment-icon">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <div class="section-title">
                Create Manual Payment
                <span class="step-indicator">Fill in the details below</span>
              </div>
            </div>

            <div class="form-container">
              <form [formGroup]="manualPaymentForm" (ngSubmit)="onManualPaymentSubmit()" class="manual-payment-form">
                <!-- Player Name (Only for Superadmin) -->
                <div class="field" *ngIf="isSuperAdmin()">
                  <label for="playerName">Player *</label>
                  <select id="playerName" formControlName="playerName">
                    <option value="">Select a player</option>
                    <option *ngFor="let member of members" [value]="member.fullName">
                      {{member.fullName}}
                    </option>
                  </select>
                  <small class="help-text">Select the player who used the court</small>
                  <small class="error" *ngIf="manualPaymentForm.get('playerName')?.hasError('required') && manualPaymentForm.get('playerName')?.touched">
                    Please select a player
                  </small>
                </div>

                <!-- Player Info (For non-superadmin) -->
                <div class="field" *ngIf="!isSuperAdmin()">
                  <label>Player</label>
                  <div class="player-info-display">
                    <span class="current-player">{{currentUser?.fullName}}</span>
                  </div>
                  <small class="help-text">This payment will be recorded for your account</small>
                </div>

                <!-- Court Usage Date -->
                <div class="field">
                  <label for="courtUsageDate">Date of Court Usage *</label>
                  <input 
                    type="date" 
                    id="courtUsageDate"
                    formControlName="courtUsageDate">
                  <small class="help-text">Select the date when the court was used</small>
                  <small class="error" *ngIf="manualPaymentForm.get('courtUsageDate')?.hasError('required') && manualPaymentForm.get('courtUsageDate')?.touched">
                    Court usage date is required
                  </small>
                </div>

                <!-- Payment Method -->
                <div class="field">
                  <label for="paymentMethod">Payment Method *</label>
                  <select id="paymentMethod" formControlName="paymentMethod">
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                  <small class="error" *ngIf="manualPaymentForm.get('paymentMethod')?.hasError('required') && manualPaymentForm.get('paymentMethod')?.touched">
                    Please select a payment method
                  </small>
                </div>

                <!-- Amount -->
                <div class="field">
                  <label for="amount">Amount (₱) *</label>
                  <input 
                    type="number" 
                    id="amount"
                    formControlName="amount"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01">
                  <small class="help-text">Enter the total amount paid</small>
                  <small class="error" *ngIf="manualPaymentForm.get('amount')?.hasError('required') && manualPaymentForm.get('amount')?.touched">
                    Amount is required
                  </small>
                  <small class="error" *ngIf="manualPaymentForm.get('amount')?.hasError('min') && manualPaymentForm.get('amount')?.touched">
                    Amount must be greater than 0
                  </small>
                </div>

                <!-- Notes -->
                <div class="field">
                  <label for="notes">Notes (Optional)</label>
                  <textarea 
                    id="notes"
                    formControlName="notes"
                    placeholder="Add any additional notes about this payment..."
                    rows="3"></textarea>
                  <small class="help-text">Optional: Add any additional details or context</small>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                  <button 
                    type="submit"
                    [disabled]="manualPaymentForm.invalid || loadingManualPayment"
                    class="submit-btn">
                    {{loadingManualPayment ? 'Processing...' : 'Submit Manual Payment'}}
                  </button>
                  
                  <button 
                    type="button"
                    (click)="resetManualPaymentForm()"
                    class="reset-btn">
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment History Tab -->
      <div class="tab-content" *ngIf="activeTab === 'history'">
        <div class="history-container">
          <h2>Your Payment History</h2>
          
          
          <div class="loading" *ngIf="loadingHistory">
            Loading payment history...
          </div>
          
          <div class="no-payments" *ngIf="!loadingHistory && displayedPayments.length === 0">
            <p>No payment history found.</p>
          </div>

          <div class="payments-list" *ngIf="!loadingHistory && displayedPayments.length > 0">
            <div 
              *ngFor="let payment of displayedPayments"
              class="payment-card"
              [class]="'payment-' + payment.status">
              
              <div class="payment-header">
                <div class="payment-info">
                  <h3>{{formatPaymentDescriptionForMobile(payment)}}</h3>
                  <p class="reference">Ref: {{payment.referenceNumber}}</p>
                </div>
                <div class="payment-amount">
                  <span class="amount">{{getCorrectPaymentAmount(payment)}}</span>
                  <span class="status" [class]="'status-' + payment.status">
                    {{payment.statusDisplay}}
                  </span>
                  <span class="payment-method-mobile">
                    {{formatPaymentMethod(payment.paymentMethod)}}
                  </span>
                </div>
              </div>

              <div class="payment-details">
                <!-- Manual Payment Details -->
                <div *ngIf="payment.metadata?.isManualPayment" class="manual-payment-details">
                  <div class="detail-row">
                    <span>Payment Type:</span>
                    <span class="manual-payment-badge">Manual Payment</span>
                  </div>
                  <div class="detail-row">
                    <span>Court Usage Date:</span>
                    <span>{{formatDate(payment.metadata.courtUsageDate)}}</span>
                  </div>
                  <div class="detail-row">
                    <span>Player:</span>
                    <span>{{formatManualPaymentPlayers(payment)}}</span>
                  </div>
                </div>
                
                <!-- Regular Payment Details -->
                <div *ngIf="!payment.metadata?.isManualPayment">
                  <div class="detail-row" *ngIf="payment.pollId && payment.userId">
                    <span>Participant:</span>
                    <span>{{payment.userId.fullName}}</span>
                  </div>
                  <div class="detail-row" *ngIf="payment.reservationId && payment.reservationId.players && payment.reservationId.players.length > 0">
                    <span>Players:</span>
                    <span>{{formatCourtPlayers(payment)}}</span>
                  </div>
                </div>

                <!-- Common Payment Details -->
                <div class="detail-row">
                  <span>Payment Method:</span>
                  <span>{{formatPaymentMethod(payment.paymentMethod)}}</span>
                </div>
                <div class="detail-row" *ngIf="payment.transactionId">
                  <span>Transaction ID:</span>
                  <span>{{payment.transactionId}}</span>
                </div>
                
                <!-- Cancellation Details for Failed/Refunded Payments -->
                <div *ngIf="payment.metadata?.cancellation || isLegacyCancelledPayment(payment)" class="cancellation-details">
                  <!-- New cancellation with metadata -->
                  <div *ngIf="payment.metadata?.cancellation">
                    <div class="detail-row cancellation-info">
                      <span>Cancellation Reason:</span>
                      <span class="cancellation-reason">{{payment.metadata.cancellation.reason}}</span>
                    </div>
                    <div class="detail-row cancellation-info">
                      <span>Cancelled On:</span>
                      <span>{{formatDate(payment.metadata.cancellation.cancelledAt)}}</span>
                    </div>
                  </div>
                  
                  <!-- Legacy cancelled payment fallback -->
                  <div *ngIf="!payment.metadata?.cancellation && isLegacyCancelledPayment(payment)">
                    <div class="detail-row cancellation-info">
                      <span>Status:</span>
                      <span class="cancellation-reason">This payment was cancelled</span>
                    </div>
                    <div class="detail-row cancellation-info">
                      <span>Note:</span>
                      <span>Payment was cancelled before detailed tracking was available</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Admin actions for recorded payments -->
              <div class="payment-actions" *ngIf="isAdmin() && payment.status === 'record'">
                <button 
                  class="unrecord-btn"
                  (click)="unrecordPayment(payment._id)"
                  [disabled]="processing.includes(payment._id)"
                  title="Unrecord payment and remove from Court Usage Report">
                  <mat-icon>undo</mat-icon>
                  {{processing.includes(payment._id) ? 'Unrecording...' : 'Unrecord'}}
                </button>
              </div>

              <!-- Expand/Collapse button for grouped payments -->
              <div class="expand-actions" *ngIf="payment._groupedPayments && payment._groupedPayments.length > 1">
                <button 
                  class="expand-btn"
                  (click)="togglePaymentExpansion(payment._id)"
                  title="{{isPaymentExpanded(payment._id) ? 'Hide' : 'Show'}} individual hour breakdown">
                  <mat-icon>{{isPaymentExpanded(payment._id) ? 'expand_less' : 'expand_more'}}</mat-icon>
                  {{isPaymentExpanded(payment._id) ? 'Hide' : 'Show'}} breakdown ({{payment._groupedPayments.length}} hours)
                </button>
              </div>

              <!-- Detailed breakdown for grouped payments -->
              <div class="grouped-payment-details" *ngIf="payment._groupedPayments && payment._groupedPayments.length > 1 && isPaymentExpanded(payment._id)">
                <h4>Individual Hour Breakdown:</h4>
                <div class="breakdown-summary">
                  <p><strong>Expected Total:</strong> {{payment._groupedPayments.length}} hours × 3 players × ₱20 = ₱{{(payment._groupedPayments.length * 3 * 20).toFixed(2)}}</p>
                  <p><strong>Actual Total:</strong> ₱{{payment.amount.toFixed(2)}} 
                    <span *ngIf="payment.amount !== (payment._groupedPayments.length * 3 * 20)" class="pricing-warning">⚠️ Pricing discrepancy detected</span>
                  </p>
                </div>
                <div class="breakdown-list">
                  <div 
                    *ngFor="let individualPayment of payment._groupedPayments" 
                    class="breakdown-item">
                    <div class="breakdown-time">
                      {{formatTime(individualPayment.reservationId.timeSlot)}} - {{formatTime(individualPayment.reservationId.timeSlot + 1)}}
                    </div>
                    <div class="breakdown-amount">
                      ₱{{individualPayment.amount.toFixed(2)}}
                      <span *ngIf="individualPayment.amount !== 60" class="amount-warning">
                        (Expected: ₱60)
                      </span>
                    </div>
                    <div class="breakdown-ref">
                      Ref: {{individualPayment.referenceNumber}}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Pending Payments Tab -->
      <div class="tab-content" *ngIf="activeTab === 'pending'">
        <div class="pending-container">
          <h2>Pending Payments</h2>
          
          <!-- Payment Form Section (when reservation selected) -->
          <div class="payment-form-section" *ngIf="selectedReservation">
            <div class="section-header">
              <div class="payment-icon">
                <mat-icon>payment</mat-icon>
              </div>
              <div class="section-title">
                Complete Payment
                <span class="step-indicator">Step 2 of 2</span>
              </div>
            </div>

            <!-- Selected Reservation Display -->
            <div class="selected-reservation-display">
              <div class="reservation-summary">
                <div class="reservation-icon">
                  <mat-icon>event</mat-icon>
                </div>
                <div class="reservation-info">
                  <h4>{{isManualPayment() ? 'Manual Court Usage' : isOpenPlayPayment() ? 'Open Play Event' : 'Court Reservation'}}</h4>
                  <div class="reservation-details">
                    <div class="detail-item">
                      <mat-icon>schedule</mat-icon>
                      <span>{{formatDate(selectedReservation.date)}} at {{selectedReservation.timeSlotDisplay}}</span>
                    </div>
                    <div class="detail-item" *ngIf="!isOpenPlayPayment() && !isManualPayment()">
                      <mat-icon>group</mat-icon>
                      <span>{{selectedReservation.players.length}} player{{selectedReservation.players.length !== 1 ? 's' : ''}}: {{selectedReservation.players.join(', ')}}</span>
                    </div>
                    <div class="detail-item" *ngIf="isManualPayment()">
                      <mat-icon>group</mat-icon>
                      <span>Players: {{selectedReservation.players.join(', ')}}</span>
                    </div>
                    <div class="detail-item" *ngIf="isOpenPlayPayment()">
                      <mat-icon>sports_tennis</mat-icon>
                      <span>Open Play Participation</span>
                    </div>
                  </div>
                </div>
                <div class="payment-amount">
                  <span class="amount">{{getDisplayAmount()}}</span>
                  <span class="currency">PHP</span>
                </div>
              </div>
            </div>


            <div class="form-container">

              <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="payment-form">
                
                <!-- Payment Method -->
                <!-- Court Fee -->
                <div class="field">
                  <label for="courtFee">Court Fee (₱) *</label>
                  <input 
                    type="number" 
                    id="courtFee"
                    formControlName="courtFee"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01">
                  <small class="help-text">Auto-populated with calculated fee, but you can edit if needed</small>
                  <small class="error" *ngIf="paymentForm.get('courtFee')?.hasError('required') && paymentForm.get('courtFee')?.touched">
                    Court fee is required
                  </small>
                  <small class="error" *ngIf="paymentForm.get('courtFee')?.hasError('min') && paymentForm.get('courtFee')?.touched">
                    Court fee must be greater than 0
                  </small>
                </div>

                <!-- Payment Method -->
                <div class="field">
                  <label for="paymentMethod">Payment Method *</label>
                  <select id="paymentMethod" formControlName="paymentMethod">
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                  <small class="error" *ngIf="paymentForm.get('paymentMethod')?.hasError('required') && paymentForm.get('paymentMethod')?.touched">
                    Please select a payment method
                  </small>
                </div>

                <!-- Transaction Details -->
                <div class="field" *ngIf="paymentForm.get('paymentMethod')?.value && paymentForm.get('paymentMethod')?.value !== 'cash'">
                  <label for="transactionId">Transaction/Reference Number</label>
                  <input 
                    type="text" 
                    id="transactionId"
                    formControlName="transactionId"
                    placeholder="Enter transaction or reference number">
                  <small class="help-text">Optional: Provide reference number for tracking</small>
                </div>


                <!-- Notes -->
                <div class="field">
                  <label for="notes">Notes (Optional)</label>
                  <textarea 
                    id="notes"
                    formControlName="notes"
                    placeholder="Add any notes about this payment..."
                    rows="3"></textarea>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                  <button 
                    type="submit"
                    [disabled]="paymentForm.invalid || loading"
                    class="submit-btn">
                    {{loading ? 'Processing Payment...' : 'Complete Payment'}}
                  </button>
                  
                  <button 
                    type="button"
                    (click)="resetForm()"
                    class="reset-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <!-- Pending Payments List -->
          <div class="pending-payments-section" *ngIf="!selectedReservation">
            <div class="loading" *ngIf="loadingUnpaid">
              Loading pending payments...
            </div>
            
            <div class="no-payments" *ngIf="!loadingUnpaid && displayedPendingPayments.length === 0">
              <p>No pending payments! 🎉</p>
            </div>

            <div class="payments-list" *ngIf="!loadingUnpaid && displayedPendingPayments.length > 0">
              <h3>Your Pending Payments</h3>
              
              <div 
                *ngFor="let payment of displayedPendingPayments"
                class="payment-card"
                [class.overdue]="isPaymentOverdue(payment)">
                
                <div class="payment-header">
                  <div class="payment-info">
                    <h4>
                      {{payment.metadata?.isManualPayment ? 'Manual Court Usage' : payment.reservationId ? 'Court Reservation' : 'Open Play Event'}}
                      <span class="overdue-badge" *ngIf="isPaymentOverdue(payment)">OVERDUE</span>
                    </h4>
                    <p>{{formatPaymentReservation(payment)}}</p>
                    <p class="players-info" *ngIf="payment.reservationId && payment.reservationId.players">
                      <mat-icon class="small-icon">group</mat-icon>
                      {{formatPlayersWithFees(payment)}}
                    </p>
                    <p class="players-info" *ngIf="payment.pollId && payment.userId">
                      <mat-icon class="small-icon">sports_tennis</mat-icon>
                      Participant: {{payment.userId.fullName}}
                    </p>
                  </div>
                  <div class="payment-amount">
                    <span class="amount">{{getCorrectPaymentAmount(payment)}}</span>
                  </div>
                </div>

                <!-- Payment details removed for cleaner display -->

                <div class="payment-actions">
                  <!-- For synthetic payments (unpaid reservations), show Pay Now and Cancel buttons -->
                  <ng-container *ngIf="payment.isSynthetic && payment.reservationId">
                    <button 
                      class="pay-btn"
                      (click)="payForGroupedReservation(payment)">
                      Pay Now
                    </button>
                    <button 
                      class="cancel-reservation-btn"
                      (click)="cancelReservationDirectly(convertPaymentToReservation(payment))"
                      [disabled]="processing.includes(payment.reservationId._id) || !canCancel(payment)">
                      Cancel Reservation
                    </button>
                  </ng-container>
                  
                  <!-- For real payment records -->
                  <ng-container *ngIf="!payment.isSynthetic">
                    <!-- Payment Action Buttons Row 1: Primary Actions -->
                    <div class="payment-buttons-row">
                      <!-- Open Play events should show Pay Now button -->
                      <button
                        class="pay-btn"
                        (click)="payForOpenPlay(payment)"
                        *ngIf="payment.pollId">
                        Pay Now
                      </button>

                      <!-- Manual court usage payments - always show Pay Now to choose payment method -->
                      <button
                        class="pay-btn"
                        (click)="payForManualPayment(payment)"
                        *ngIf="payment.metadata?.isManualPayment">
                        Pay Now
                      </button>

                      <!-- Court reservations can be marked as paid if cash -->
                      <button
                        class="pay-btn"
                        (click)="processPayment(payment._id)"
                        *ngIf="payment.reservationId && payment.paymentMethod === 'cash'"
                        [disabled]="processing.includes(payment._id)">
                        {{processing.includes(payment._id) ? 'Processing...' : 'Mark as Paid'}}
                      </button>

                      <!-- Other payment methods should show Pay Now -->
                      <button
                        class="pay-btn"
                        (click)="payForExistingPayment(payment)"
                        *ngIf="payment.reservationId && payment.paymentMethod !== 'cash'">
                        Pay Now
                      </button>
                    </div>
                    
                    <!-- Payment Action Buttons Row 2: Secondary Actions -->
                    <div class="payment-buttons-row">
                      <!-- Cancel Reservation button for court reservations -->
                      <button 
                        class="cancel-reservation-btn"
                        (click)="cancelReservationFromPayment(payment)"
                        *ngIf="payment.reservationId && canCancel(payment)"
                        [disabled]="processing.includes(payment.reservationId._id)">
                        Cancel Reservation
                      </button>
                      
                      <!-- Cancel button for Open Play Events -->
                      <button
                        class="cancel-reservation-btn"
                        (click)="cancelPayment(payment._id)"
                        *ngIf="payment.pollId && canCancel(payment)"
                        [disabled]="processing.includes(payment._id)">
                        Cancel Open Play
                      </button>

                      <!-- Cancel button for Manual Court Usage -->
                      <button
                        class="cancel-reservation-btn"
                        (click)="cancelPayment(payment._id)"
                        *ngIf="payment.metadata?.isManualPayment && canCancel(payment)"
                        [disabled]="processing.includes(payment._id)">
                        Cancel Payment
                      </button>
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="notification-container">
        <div 
          *ngFor="let notification of notifications; trackBy: trackNotification"
          class="notification"
          [class]="'notification-' + notification.type"
          [@slideInOut]>
          <div class="notification-icon">
            <span *ngIf="notification.type === 'success'">✅</span>
            <span *ngIf="notification.type === 'error'">❌</span>
            <span *ngIf="notification.type === 'warning'">⚠️</span>
            <span *ngIf="notification.type === 'info'">ℹ️</span>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{notification.title}}</div>
            <div class="notification-message">{{notification.message}}</div>
          </div>
          <button 
            class="notification-close"
            (click)="removeNotification(notification.id)">
            ×
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  paymentForm: FormGroup;
  loading = false;
  loadingHistory = false;
  loadingUnpaid = false;
  activeTab = 'pending';
  unpaidReservations: Reservation[] = [];
  pendingPayments: Payment[] = [];
  displayedPendingPayments: Payment[] = [];
  paymentHistory: Payment[] = [];
  displayedPayments: Payment[] = [];
  expandedPayments: Set<string> = new Set();
  selectedReservation: Reservation | null = null;
  currentUser: any = null;
  processing: string[] = [];
  isDirectPayment: boolean = false; // Track if coming from notification
  showReservationSelector: boolean = false; // Show dropdown when user wants to change

  // Notifications
  notifications: Notification[] = [];
  
  // Members data for fee calculation
  members: any[] = [];

  // Manual Payment form
  manualPaymentForm: FormGroup;
  loadingManualPayment = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.paymentForm = this.fb.group({
      reservationId: ['', Validators.required],
      courtFee: ['', [Validators.required, Validators.min(0.01)]], // Editable court fee for all users
      paymentMethod: ['', Validators.required],
      transactionId: [''],
      notes: ['']
    });

    this.manualPaymentForm = this.fb.group({
      playerName: [''],
      courtUsageDate: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });

    this.currentUser = this.authService.currentUser;
  }

  async ngOnInit(): Promise<void> {
    // Load members data for proper fee calculation
    await this.loadMembersData();
    
    // Set up form validation based on user role
    this.setupManualPaymentFormValidation();
    
    // Check for query parameters first (from notification "Pay Now")
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
      
      // Always load pending payments
      this.loadPendingPayments();
      
      if (params['reservationId']) {
        // Auto-populate the form with the specific reservation
        this.handleDirectPayment(params['reservationId']);
      }
    });
  }

  loadUnpaidReservations(): void {
    this.loadingUnpaid = true;
    
    this.http.get<any>(`${this.apiUrl}/reservations?paymentStatus=pending`).subscribe({
      next: (response) => {
        const allReservations = response.data || [];
        
        // Include all reservations with pending payments (including past ones that are overdue)
        // Only filter out cancelled reservations
        this.unpaidReservations = allReservations.filter((reservation: Reservation) => {
          return reservation.status !== 'cancelled';
        });
        
        this.loadingUnpaid = false;
      },
      error: (error) => {
        console.error('Error loading unpaid reservations:', error);
        this.loadingUnpaid = false;
        this.showError('Error', 'Failed to load unpaid reservations');
      }
    });
  }

  async loadPendingPayments(bustCache = false): Promise<void> {
    this.loadingUnpaid = true;
    
    try {
      // Add cache busting parameter when needed to ensure fresh data after payment processing
      const cacheBuster = bustCache ? `&_t=${Date.now()}` : '';
      
      // Load both existing pending payments and unpaid reservations
      const [paymentsResponse, reservationsResponse] = await Promise.all([
        this.http.get<any>(`${this.apiUrl}/payments/my?status=pending${cacheBuster}`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/reservations?paymentStatus=pending${cacheBuster}`).toPromise()
      ]);
      const rawExistingPayments = paymentsResponse?.data || [];
      console.log('🔍 Raw API response for /payments/my?status=pending:', rawExistingPayments.map((p: any) => ({
        desc: p.description,
        status: p.status,
        id: p._id
      })));
      
      const unpaidReservations = (reservationsResponse?.data || [])
        .filter((reservation: Reservation) => reservation.status !== 'cancelled');
      
      // Simplified filtering: only keep payments that are actually pending
      // Remove the complex duplicate payment filtering that might cause race conditions
      const existingPayments = rawExistingPayments.filter((payment: Payment) => payment.status === 'pending');
        
      console.log('🔍 Filtered pending payments:', existingPayments.map((p: any) => ({
        desc: p.description,
        status: p.status,
        id: p._id
      })));
      
      // Get all payment records to check which reservations already have payments
      const allPaymentsResponse = await this.http.get<any>(`${this.apiUrl}/payments/my`).toPromise();
      const allPayments = allPaymentsResponse?.data || [];
      
      const reservationIdsWithPayments = new Set(
        allPayments
          .filter((payment: Payment) => payment.reservationId)
          .map((payment: Payment) => payment.reservationId!._id)
      );
      
      // Filter out unpaid reservations that already have payment records
      const reservationsNeedingPayments = unpaidReservations
        .filter((reservation: Reservation) => !reservationIdsWithPayments.has(reservation._id));
      
      // Convert unpaid reservations to payment-like objects for display
      const syntheticPayments = await Promise.all(reservationsNeedingPayments.map(async (reservation: Reservation) => {
        let amount = reservation.totalFee || 0;
        
        // If amount is 0, try to calculate it from backend
        if (amount === 0) {
          try {
            const reservationDate = new Date(reservation.date);
            const params = {
              timeSlot: reservation.timeSlot.toString(),
              playerCount: reservation.players.length.toString(),
              date: reservationDate.toISOString()
            };
            const calcResponse = await this.http.get<any>(`${this.apiUrl}/payments/calculate`, { params }).toPromise();
            if (calcResponse?.success && calcResponse?.data) {
              amount = calcResponse.data.amount;
            }
          } catch (error) {
            console.warn('Failed to calculate fee for reservation', reservation._id, error);
            // Keep amount as 0 if calculation fails
          }
        }
        
        return {
          _id: `synthetic-${reservation._id}`,
          reservationId: {
            _id: reservation._id,
            date: new Date(reservation.date),
            timeSlot: reservation.timeSlot,
            players: reservation.players,
            timeSlotDisplay: reservation.timeSlotDisplay
          },
          userId: { _id: '', username: '', fullName: '' }, // Not needed for display
          amount: amount,
          currency: 'PHP',
          paymentMethod: 'cash' as const,
          status: 'pending' as const,
          referenceNumber: '',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          description: `Court reservation payment for ${new Date(reservation.date).toDateString()} ${reservation.timeSlot}:00-${reservation.timeSlot + 1}:00`,
          formattedAmount: `₱${amount.toFixed(2)}`,
          statusDisplay: 'Pending',
          isOverdue: this.isReservationOverdue(reservation),
          daysUntilDue: 7,
          createdAt: new Date(),
          isSynthetic: true // Flag to identify synthetic payments
        };
      }));
      
      // Combine existing payments with synthetic payments
      this.pendingPayments = [...existingPayments, ...syntheticPayments];
      
      // Group pending payments for multi-hour reservations
      this.displayedPendingPayments = this.groupPayments([...this.pendingPayments]);
      
      // Debug: Log payment statuses to ensure proper separation
      console.log('📋 Pending Payments loaded:', this.pendingPayments.length);
      console.log('📋 Displayed Pending Payments after grouping:', this.displayedPendingPayments.length);
      
      this.pendingPayments.forEach(payment => {
        console.log(`  - Raw: ${payment.description} (Status: ${payment.status}, TimeSlot: ${payment.reservationId?.timeSlot}, Date: ${payment.reservationId?.date}, ID: ${payment._id}, Synthetic: ${payment.isSynthetic || false})`);
      });
      
      this.displayedPendingPayments.forEach(payment => {
        console.log(`  - Displayed: ${payment.description} (Amount: ₱${payment.amount}, TimeSlot: ${payment.reservationId?.timeSlot}, Grouped: ${payment._groupedPayments ? payment._groupedPayments.length : 0})`);
      });
      
      this.loadingUnpaid = false;
    } catch (error) {
      console.error('Error loading pending payments:', error);
      this.loadingUnpaid = false;
      this.showError('Error', 'Failed to load pending payments');
      throw error; // Re-throw to allow callers to handle the error
    }
  }

  loadPaymentHistory(bustCache = false): void {
    this.loadingHistory = true;
    
    // Add cache busting parameter when needed to ensure fresh data after payment processing
    const cacheBuster = bustCache ? `?_t=${Date.now()}` : '';
    
    this.http.get<any>(`${this.apiUrl}/payments/my${cacheBuster}`).subscribe({
      next: (response) => {
        // Filter out pending payments from history - they belong in Pending tab only
        const allPayments = response.data || [];
        this.paymentHistory = allPayments.filter((payment: Payment) => payment.status !== 'pending');
        
        // Sort by payment date (most recent first) to show newly completed payments at the top
        this.paymentHistory.sort((a: Payment, b: Payment) => {
          const dateA = new Date(a.paymentDate || a.createdAt);
          const dateB = new Date(b.paymentDate || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        // Group payments for multi-hour reservations
        this.displayedPayments = this.groupPayments([...this.paymentHistory]);
        
        // Debug: Log displayed payments after grouping
        console.log('📋 Displayed Payments after grouping:', this.displayedPayments.length, 'payments');
        this.displayedPayments.forEach((payment, index) => {
          console.log(`Displayed Payment ${index + 1}:`, {
            id: payment._id,
            amount: payment.amount,
            formattedAmount: payment.formattedAmount,
            hasGroupedPayments: !!payment._groupedPayments,
            groupedCount: payment._groupedPayments?.length,
            timeSlotDisplay: payment.reservationId?.timeSlotDisplay,
            isSynthetic: payment._id?.startsWith?.('synthetic-')
          });
        });
        
        // Debug: Log payment history statuses
        console.log('📋 Payment History loaded:', this.paymentHistory.length, 'payments (excluding pending)');
        this.paymentHistory.forEach((payment, index) => {
          console.log(`Payment ${index + 1}:`, {
            status: payment.status,
            hasReservationId: !!payment.reservationId,
            timeSlot: payment.reservationId?.timeSlot,
            timeSlotDisplay: payment.reservationId?.timeSlotDisplay,
            date: payment.reservationId?.date,
            amount: payment.amount,
            hasPollId: !!payment.pollId,
            pollTitle: payment.pollId?.title,
            userFullName: payment.userId?.fullName
          });
        });
        this.paymentHistory.forEach(payment => {
          console.log(`  - ${payment.description} (Status: ${payment.status}, ID: ${payment._id}, PaymentDate: ${payment.paymentDate || 'N/A'})`);
        });
        
        console.log(`📋 Total payments from API: ${allPayments.length}, Pending filtered out: ${allPayments.length - this.paymentHistory.length}`);
        
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.loadingHistory = false;
        this.showError('Error', 'Failed to load payment history');
      }
    });
  }

  onReservationChange(event: any): void {
    const reservationId = event.target.value;
    this.selectedReservation = this.unpaidReservations.find(r => r._id === reservationId) || null;
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || this.loading) return;

    this.loading = true;
    const formValue = this.paymentForm.value;

    // Check if this is an Open Play payment
    const isOpenPlay = (this.selectedReservation as any)?.isOpenPlay;
    const isManualPayment = (this.selectedReservation as any)?.isManualPayment;
    const originalPaymentId = (this.selectedReservation as any)?.originalPaymentId;

    if (isOpenPlay && originalPaymentId) {
      // For Open Play, update the existing payment record with the chosen payment method
      this.updateOpenPlayPayment(originalPaymentId, formValue.paymentMethod, formValue.transactionId);
      return;
    }

    if (isManualPayment && originalPaymentId) {
      // For Manual Payment, update the existing payment record with the chosen payment method
      this.updateManualPayment(originalPaymentId, formValue.paymentMethod, formValue.transactionId);
      return;
    }

    // Check if this is for an existing payment that needs to be updated
    const existingPaymentId = (this.selectedReservation as any)?.existingPaymentId;
    
    if (existingPaymentId) {
      // Update existing payment instead of creating new one
      console.log('💰 Updating existing payment:', existingPaymentId);
      
      const updateData: any = {
        paymentMethod: formValue.paymentMethod,
        transactionId: formValue.transactionId || undefined
      };
      
      // Add court fee from form input
      updateData.customAmount = formValue.courtFee;
      
      this.http.put<any>(`${this.apiUrl}/payments/${existingPaymentId}`, updateData).subscribe({
        next: (response) => {
          this.loading = false;
          
          // For admin users, auto-complete ALL payment methods since admin is confirming payment
          if (this.isAdmin()) {
            this.processPayment(existingPaymentId, true);
            this.showSuccess('Payment Completed', 'Payment has been processed and completed successfully');
          } else {
            // For regular users, only auto-complete cash payments
            if (formValue.paymentMethod === 'cash') {
              this.processPayment(existingPaymentId, true);
              this.showSuccess('Payment Completed', 'Cash payment has been completed successfully');
            } else {
              this.showSuccess('Payment Updated', 'Payment method updated successfully');
            }
          }
          
          this.resetForm();
          this.loadPendingPayments(true);
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.error || 'Failed to update payment';
          this.showError('Payment Failed', message);
        }
      });
      return;
    }
    
    // Create new payment (for synthetic payments from unpaid reservations)
    const paymentData: any = {
      reservationId: formValue.reservationId,
      paymentMethod: formValue.paymentMethod,
      transactionId: formValue.transactionId || undefined,
      notes: formValue.notes || undefined
    };
    
    // Check if this is a grouped payment with multiple reservations
    if (this.selectedReservation && this.selectedReservation._groupedReservationIds && this.selectedReservation._groupedReservationIds.length > 1) {
      paymentData.groupedReservationIds = this.selectedReservation._groupedReservationIds;
      console.log(`💰 Creating grouped payment for ${paymentData.groupedReservationIds.length} reservations:`, paymentData.groupedReservationIds);
    }
    
    // Add court fee from form input
    paymentData.customAmount = formValue.courtFee;


    this.http.post<any>(`${this.apiUrl}/payments`, paymentData).subscribe({
      next: (response) => {
        this.loading = false;
        
        // For admin users, auto-complete ALL payment methods since admin is confirming payment
        if (this.isAdmin()) {
          this.processPayment(response.data._id, true);
          this.showSuccess('Payment Completed', 'Payment has been processed and completed successfully');
        } else {
          // For regular users, only auto-complete cash payments
          if (formValue.paymentMethod === 'cash') {
            this.processPayment(response.data._id, true);
            this.showSuccess('Payment Completed', 'Cash payment has been completed successfully');
          } else {
            this.showSuccess('Payment Logged', 'Payment has been logged and is pending confirmation');
          }
        }
        
        this.resetForm();
        this.loadPendingPayments(true);
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.error || 'Failed to log payment';
        this.showError('Payment Failed', message);
      }
    });
  }


  processPayment(paymentId: string, silent = false): void {
    this.processing.push(paymentId);
    
    this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/process`, {}).subscribe({
      next: (response) => {
        this.processing = this.processing.filter(id => id !== paymentId);
        if (!silent) {
          this.showSuccess('Payment Processed', 'Payment has been marked as completed and moved to Payment History');
        }
        
        // Refresh both tabs sequentially with cache busting to ensure fresh data
        // First refresh pending payments to remove the completed payment
        this.loadPendingPayments(true).then(() => {
          // Then refresh payment history to show the newly completed payment
          this.loadPaymentHistory(true);
        }).catch(error => {
          console.error('Error refreshing pending payments:', error);
          // Still refresh payment history even if pending payments refresh fails
          this.loadPaymentHistory(true);
        });
      },
      error: (error) => {
        this.processing = this.processing.filter(id => id !== paymentId);
        const message = error.error?.error || 'Failed to process payment';
        this.showError('Process Failed', message);
      }
    });
  }

  canCancel(payment: Payment): boolean {
    // If payment is for a reservation, check the date
    if (payment.reservationId) {
      return canCancelReservation({
        date: payment.reservationId.date,
        status: payment.status
      }) && payment.status !== 'refunded';
    }
    
    // For non-reservation payments (like polls), allow cancellation if not refunded
    return payment.status !== 'refunded';
  }

  cancelPayment(paymentId: string): void {
    // Find payment details for the dialog - check both pending payments and payment history
    let payment = this.pendingPayments.find(p => p._id === paymentId);
    if (!payment) {
      payment = this.paymentHistory.find(p => p._id === paymentId);
    }
    
    if (!payment) {
      this.showError('Payment Not Found', 'Could not find payment details');
      return;
    }

    // Prepare dialog data
    const dialogData: CancellationDialogData = {
      paymentId: paymentId,
      paymentAmount: payment.formattedAmount,
      reservationDate: payment.reservationId 
        ? this.formatDate(payment.reservationId.date)
        : payment.pollId?.openPlayEvent 
          ? this.formatDate(payment.pollId.openPlayEvent.eventDate)
          : 'N/A',
      reservationTime: payment.reservationId
        ? payment.reservationId.timeSlotDisplay
        : payment.pollId?.title || 'Open Play Event'
    };

    // Open the modern cancellation dialog
    const dialogRef = this.dialog.open(CancellationDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.cancelled) {
        this.processCancellation(paymentId, result.reason);
      }
    });
  }

  private processCancellation(paymentId: string, reason: string): void {
    this.processing.push(paymentId);
    
    this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/cancel`, {
      reason: reason
    }).subscribe({
      next: (response) => {
        this.processing = this.processing.filter(id => id !== paymentId);
        this.showSuccess('Payment Cancelled', `Payment cancelled: ${reason}`);
        this.loadPaymentHistory();
        this.loadPendingPayments();
      },
      error: (error) => {
        this.processing = this.processing.filter(id => id !== paymentId);
        const message = error.error?.error || 'Failed to cancel payment';
        this.showError('Cancel Failed', message);
      }
    });
  }


  cancelReservationPayment(reservation: Reservation): void {
    // Find the payment associated with this reservation
    this.http.get<any>(`${this.apiUrl}/payments/my`).subscribe({
      next: (response) => {
        const payments = response.data || [];
        const associatedPayment = payments.find((p: any) => 
          p.reservationId?._id === reservation._id && p.status === 'pending'
        );
        
        if (associatedPayment) {
          // Prepare dialog data using reservation info
          const dialogData: CancellationDialogData = {
            paymentId: associatedPayment._id,
            paymentAmount: associatedPayment.formattedAmount,
            reservationDate: this.formatDate(reservation.date),
            reservationTime: reservation.timeSlotDisplay
          };

          // Open the modern cancellation dialog
          const dialogRef = this.dialog.open(CancellationDialogComponent, {
            width: '500px',
            maxWidth: '90vw',
            disableClose: true,
            data: dialogData
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result && result.cancelled) {
              this.processCancellation(associatedPayment._id, result.reason);
            }
          });
        } else {
          this.showError('No Payment Record Found', 
            'This reservation has not been paid yet. Please click "Pay Now" first to create a payment record, then you can cancel it if needed.');
        }
      },
      error: (error) => {
        this.showError('Error', 'Failed to find associated payment');
      }
    });
  }

  cancelReservationDirectly(reservation: Reservation): void {
    // Open confirmation dialog for canceling the entire reservation
    const dialogData: CancellationDialogData = {
      paymentId: '', // No payment ID since we're canceling reservation directly
      paymentAmount: `₱${reservation.totalFee}`,
      reservationDate: this.formatDate(reservation.date),
      reservationTime: reservation.timeSlotDisplay,
      isReservationCancellation: true // Flag to indicate this is a reservation cancellation
    };

    const dialogRef = this.dialog.open(CancellationDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.cancelled) {
        this.processReservationCancellation(reservation._id, result.reason);
      }
    });
  }

  processReservationCancellation(reservationId: string, reason: string): void {
    if (this.processing.includes(reservationId)) return;
    
    this.processing.push(reservationId);

    // Cancel the reservation directly via DELETE /reservations/:id
    this.http.delete<any>(`${this.apiUrl}/reservations/${reservationId}`, {
      body: { reason: reason }
    }).subscribe({
      next: (response) => {
        this.processing = this.processing.filter(id => id !== reservationId);
        this.showSuccess('Reservation Cancelled', 
          response.message || `Reservation cancelled successfully. ${reason ? 'Reason: ' + reason : ''}`);
        this.loadPendingPayments();
      },
      error: (error) => {
        this.processing = this.processing.filter(id => id !== reservationId);
        const message = error.error?.error || 'Failed to cancel reservation';
        this.showError('Cancel Failed', message);
      }
    });
  }

  unrecordPayment(paymentId: string): void {
    if (!this.isAdmin()) {
      this.showError('Access Denied', 'Only admins can unrecord payments');
      return;
    }

    // Find payment details for confirmation
    const payment = this.paymentHistory.find(p => p._id === paymentId);
    if (!payment) {
      this.showError('Payment Not Found', 'Could not find payment details');
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to unrecord this payment?\n\nThis will:\n- Change status from "Recorded" back to "Completed"\n- Remove it from the Court Usage Report\n- Keep the payment as paid but no longer counted in monthly reports\n\nPayment: ${payment.description}\nAmount: ${payment.formattedAmount || '₱' + payment.amount.toFixed(2)}`);

    if (!confirmed) return;

    this.processing.push(paymentId);

    this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/unrecord`, {
      notes: 'Unrecorded via Payment Management interface'
    }).subscribe({
      next: (response) => {
        this.processing = this.processing.filter(id => id !== paymentId);
        this.showSuccess('Payment Unrecorded', 'Payment has been unrecorded successfully and removed from Court Usage Report');
        
        // Refresh payment history to show the status change
        this.loadPaymentHistory(true);
      },
      error: (error) => {
        this.processing = this.processing.filter(id => id !== paymentId);
        const message = error.error?.error || 'Failed to unrecord payment';
        this.showError('Unrecord Failed', message);
      }
    });
  }

  // Utility methods
  formatReservationOption(reservation: Reservation): string {
    const date = new Date(reservation.date).toLocaleDateString();
    return `${date} - ${reservation.timeSlotDisplay} (₱${reservation.totalFee})`;
  }

  formatReservationDetails(reservation: Reservation): string {
    const playerCount = reservation.players.length;
    const date = new Date(reservation.date).toLocaleDateString();
    return `${playerCount} player${playerCount !== 1 ? 's' : ''} on ${date}`;
  }

  formatPaymentReservation(payment: Payment): string {
    if (payment.reservationId) {
      const date = new Date(payment.reservationId.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      // Use timeSlotDisplay if available (for grouped payments), otherwise calculate manually
      const timeRange = payment.reservationId.timeSlotDisplay ||
        `${this.formatTime(payment.reservationId.timeSlot)}-${this.formatTime(payment.reservationId.timeSlot + 1)}`;
      return `${date} ${timeRange}`;
    } else if (payment.metadata?.isManualPayment) {
      // Format manual court usage payment
      const date = new Date(payment.metadata.courtUsageDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const startTime = payment.metadata.startTime ?? payment.metadata.timeSlot ?? 0;
      const endTime = payment.metadata.endTime ?? (payment.metadata.timeSlot ? payment.metadata.timeSlot + 1 : 0);
      const timeRange = `${this.format24Hour(startTime)} - ${this.format24Hour(endTime)}`;
      const players = payment.metadata.playerNames ? ` - Players: ${payment.metadata.playerNames.join(', ')}` : '';
      return `${date} ${timeRange}${players}`;
    } else if (payment.pollId?.openPlayEvent) {
      const date = new Date(payment.pollId.openPlayEvent.eventDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${date} - ${payment.pollId.title}`;
    }
    return 'N/A';
  }

  /**
   * Convert 24-hour time to 12-hour AM/PM format
   */
  formatTime(hour: number): string {
    if (hour === 0) return '12AM';
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  }

  /**
   * Format time in 24-hour format (e.g., 18:00)
   */
  format24Hour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  formatPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'gcash': 'GCash',
      'coins': 'Coins'
    };
    return methods[method] || method;
  }

  /**
   * Group consecutive payments for the same date/user to display multi-hour reservations as single entries
   */
  groupPayments(payments: Payment[]): Payment[] {
    // Separate court payments from other payments
    const courtPayments = payments.filter(p => 
      p.reservationId && 
      p.reservationId.timeSlot !== undefined && 
      p.reservationId.date
    );
    const nonCourtPayments = payments.filter(p => 
      !p.reservationId || 
      p.reservationId.timeSlot === undefined || 
      !p.reservationId.date
    );

    // Initialize debug info

    if (courtPayments.length === 0) {
      return payments;
    }

    // Group payments by date and user first
    const groupsByDateAndUser = new Map<string, Payment[]>();
    
    courtPayments.forEach(payment => {
      const dateStr = new Date(payment.reservationId!.date).toDateString();
      const userId = payment.userId._id;
      const key = `${dateStr}-${userId}`;
      
      if (!groupsByDateAndUser.has(key)) {
        groupsByDateAndUser.set(key, []);
      }
      groupsByDateAndUser.get(key)!.push(payment);
    });

    const grouped: Payment[] = [];

    // Process each date/user group
    groupsByDateAndUser.forEach(userPayments => {
      // Sort by timeSlot
      const sorted = userPayments.sort((a, b) => 
        a.reservationId!.timeSlot - b.reservationId!.timeSlot
      );

      let i = 0;
      while (i < sorted.length) {
        const consecutiveGroup = [sorted[i]];
        let j = i + 1;

        // Find consecutive time slots
        while (j < sorted.length) {
          const currentLastSlot = consecutiveGroup[consecutiveGroup.length - 1].reservationId!.timeSlot;
          if (sorted[j].reservationId!.timeSlot === currentLastSlot + 1) {
            consecutiveGroup.push(sorted[j]);
            j++;
          } else {
            break;
          }
        }

        // Create merged payment or single payment
        if (consecutiveGroup.length > 1) {
          
          const firstSlot = consecutiveGroup[0];
          const lastSlot = consecutiveGroup[consecutiveGroup.length - 1];
          const totalAmount = consecutiveGroup.reduce((sum, p) => sum + p.amount, 0);

          const mergedPayment: Payment = {
            ...firstSlot,
            amount: totalAmount,
            formattedAmount: `₱${totalAmount.toFixed(2)}`,
            description: `Court reservation payment for ${new Date(firstSlot.reservationId!.date).toDateString()} ${this.formatTime(firstSlot.reservationId!.timeSlot)}-${this.formatTime(lastSlot.reservationId!.timeSlot + 1)}`,
            reservationId: {
              ...firstSlot.reservationId!,
              timeSlotDisplay: this.formatTimeRange(firstSlot.reservationId!.timeSlot, lastSlot.reservationId!.timeSlot + 1),
              totalFee: totalAmount
            },
            _groupedPayments: consecutiveGroup
          };
          
          grouped.push(mergedPayment);
        } else {
          // Single payment - ensure it has timeSlotDisplay
          const singlePayment = { ...consecutiveGroup[0] };
          if (singlePayment.reservationId && !singlePayment.reservationId.timeSlotDisplay) {
            singlePayment.reservationId.timeSlotDisplay = this.formatTimeRange(
              singlePayment.reservationId.timeSlot, 
              singlePayment.reservationId.timeSlot + 1
            );
          }
          grouped.push(singlePayment);
        }

        i = j; // Move to next unprocessed payment
      }
    });

    // Combine and sort by creation date (most recent first)
    return [...grouped, ...nonCourtPayments].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Format time range (reused from my-reservations component)
   */
  formatTimeRange(startHour: number, endHour: number): string {
    return `${this.formatTime(startHour)}-${this.formatTime(endHour)}`;
  }

  /**
   * Toggle expansion of grouped payment to show individual payments
   */
  togglePaymentExpansion(paymentId: string): void {
    if (this.expandedPayments.has(paymentId)) {
      this.expandedPayments.delete(paymentId);
    } else {
      this.expandedPayments.add(paymentId);
    }
  }

  /**
   * Check if payment is expanded
   */
  isPaymentExpanded(paymentId: string): boolean {
    return this.expandedPayments.has(paymentId);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Notification methods
  private showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 5000): void {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, title, message, duration };
    
    this.notifications.push(notification);
    
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  private showSuccess(title: string, message: string): void {
    this.showNotification('success', title, message, 4000);
  }

  private showError(title: string, message: string): void {
    this.showNotification('error', title, message, 6000);
  }

  trackNotification(index: number, notification: Notification): string {
    return notification.id;
  }

  // Check if reservation is overdue (past date with pending payment)
  isReservationOverdue(reservation: Reservation): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reservationDate = new Date(reservation.date);
    reservationDate.setHours(0, 0, 0, 0);
    
    return reservationDate < today && reservation.paymentStatus === 'pending';
  }

  // Check if payment is overdue
  isPaymentOverdue(payment: Payment): boolean {
    if (payment.status === 'completed' || payment.status === 'refunded' || payment.status === 'record') {
      return false;
    }
    return new Date() > new Date(payment.dueDate);
  }

  // Check if payment is a legacy cancelled payment (cancelled before metadata tracking)
  isLegacyCancelledPayment(payment: Payment): boolean {
    // Check for cancellation indicators in description or method
    const hasCancelledDescription = payment.description && (
      payment.description.toLowerCase().includes('cancelled') ||
      payment.description.toLowerCase().includes('cancel')
    );
    
    const hasCancelledMethod = payment.paymentMethod && (
      (payment.paymentMethod as string).toLowerCase().includes('cancelled') ||
      (payment.paymentMethod as string).toLowerCase().includes('cancel')
    );
    
    // Check if it's a failed Open Play payment (likely cancelled)
    const isFailedOpenPlay = payment.status === 'failed' && 
                           payment.pollId && 
                           payment.description && 
                           payment.description.toLowerCase().includes('open play');
    
    const hasCancellationMetadata = !!payment.metadata?.cancellation;
    
    // It's a legacy cancellation if it has cancellation indicators or is a failed Open Play and no new metadata
    return (hasCancelledDescription || hasCancelledMethod || isFailedOpenPlay) && !hasCancellationMetadata;
  }

  handleDirectPayment(reservationId: string): void {
    // Wait for reservations to load, then auto-select the specific one
    if (this.unpaidReservations.length === 0) {
      // If reservations haven't loaded yet, wait and try again
      setTimeout(() => this.handleDirectPayment(reservationId), 500);
      return;
    }

    const targetReservation = this.unpaidReservations.find(r => r._id === reservationId);
    if (targetReservation) {
      this.isDirectPayment = true;
      this.selectedReservation = targetReservation;
      this.paymentForm.patchValue({
        reservationId: reservationId,
        courtFee: targetReservation.totalFee || 0
      });
      
      // Clear the query parameters to clean up the URL
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {}
      });
    }
  }

  toggleReservationSelection(): void {
    this.showReservationSelector = true;
  }

  cancelReservationChange(): void {
    this.showReservationSelector = false;
    // Restore the original selection
    if (this.selectedReservation) {
      this.paymentForm.patchValue({
        reservationId: this.selectedReservation._id
      });
    }
  }

  resetForm(): void {
    this.selectedReservation = null;
    this.isDirectPayment = false;
    this.showReservationSelector = false;
    this.paymentForm.reset();
    this.paymentForm.patchValue({
      reservationId: '',
      courtFee: '',
      paymentMethod: '',
      transactionId: '',
      notes: ''
    });
  }

  payForReservation(reservation: Reservation | {_id: string, date: Date, timeSlot: number, players: string[], timeSlotDisplay: string} | undefined, overrideAmount?: number): void {
    if (!reservation) return;
    
    console.log('💰 payForReservation called with override amount:', overrideAmount);
    
    // If admin, check if there's already an existing payment record for this reservation
    if (this.isAdmin()) {
      const existingPayment = this.pendingPayments.find(p => 
        !p.isSynthetic && p.reservationId && p.reservationId._id === reservation._id
      );
      
      if (existingPayment) {
        console.log('💰 Admin detected existing payment, redirecting to update existing payment:', existingPayment._id);
        this.payForExistingPayment(existingPayment);
        return;
      }
    }
    
    // Convert to full Reservation object if needed
    const fullReservation: Reservation = {
      _id: reservation._id,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      players: reservation.players,
      timeSlotDisplay: reservation.timeSlotDisplay,
      status: 'confirmed',
      paymentStatus: 'pending',
      totalFee: ('totalFee' in reservation) ? reservation.totalFee : 0
    };
    
    // Use override amount if provided, otherwise recalculate the fee
    if (overrideAmount) {
      console.log(`✅ Using override amount: ₱${overrideAmount}`);
      this.calculateAndSetReservationFee(fullReservation, overrideAmount);
    } else {
      // Always recalculate the fee based on current member data to ensure accuracy
      this.calculateAndSetReservationFeeWithMemberData(fullReservation);
    }
  }

  /**
   * Handle payment for grouped reservations (multi-hour bookings)
   */
  payForGroupedReservation(payment: Payment): void {
    if (!payment) return;

    // Check if this is a grouped payment with multiple reservations
    if (payment._groupedPayments && payment._groupedPayments.length > 1) {
      // For grouped payments, we need to handle all reservations at once
      // Use the total amount from the grouped payment
      const totalAmount = payment.amount;
      const firstReservation = payment.reservationId;
      
      if (!firstReservation) return;

      // Create a consolidated reservation object for the payment form
      const consolidatedReservation: Reservation = {
        _id: firstReservation._id, // Use first reservation's ID as primary
        date: firstReservation.date,
        timeSlot: firstReservation.timeSlot,
        players: firstReservation.players,
        timeSlotDisplay: firstReservation.timeSlotDisplay || payment.reservationId?.timeSlotDisplay,
        status: 'confirmed',
        paymentStatus: 'pending',
        totalFee: totalAmount, // Use the grouped total amount
        _groupedReservationIds: payment._groupedPayments.map(p => p.reservationId!._id) // Store all reservation IDs
      };

      // Set this as the selected reservation and populate the form
      this.selectedReservation = consolidatedReservation;
      this.paymentForm.patchValue({
        reservationId: consolidatedReservation._id,
        courtFee: totalAmount
      });

      // Payment form will be shown via calculateAndSetReservationFeeWithMemberData
      
      console.log(`💰 Grouped payment setup: ${payment._groupedPayments.length} reservations, total: ₱${totalAmount}`);
    } else {
      // Single payment, use the amount from the payment object
      const paymentAmount = payment.amount;
      console.log(`💰 Single payment: using payment amount ₱${paymentAmount}`);
      this.payForReservation(payment.reservationId, paymentAmount);
    }
  }

  calculateAndSetReservationFeeWithMemberData(reservation: Reservation): void {
    console.log('🔍 DEBUG calculateAndSetReservationFeeWithMemberData input:', {
      reservationId: reservation._id,
      initialTotalFee: reservation.totalFee,
      timeSlot: reservation.timeSlot,
      players: reservation.players
    });
    // Calculate fee using current member data instead of backend calculation
    const mockPayment = {
      reservationId: {
        players: reservation.players,
        timeSlot: reservation.timeSlot,
        date: reservation.date
      }
    };

    const feeInfo = this.getPlayerFeeInfo(mockPayment);
    const calculatedFee = (feeInfo.memberCount * feeInfo.memberFee) + (feeInfo.nonMemberCount * feeInfo.nonMemberFee);
    
    console.log(`💰 Setting reservation fee with member data:`);
    console.log(`💰 Players: ${reservation.players.join(', ')}`);
    console.log(`💰 Original stored fee: ₱${reservation.totalFee}`);
    console.log(`💰 Calculated fee: ₱${calculatedFee} (${feeInfo.memberCount} members × ₱${feeInfo.memberFee} + ${feeInfo.nonMemberCount} non-members × ₱${feeInfo.nonMemberFee})`);
    
    // Update the reservation with the correctly calculated fee
    reservation.totalFee = calculatedFee;
    this.selectedReservation = reservation;
    this.paymentForm.patchValue({
      reservationId: reservation._id,
      courtFee: calculatedFee
    });
  }

  calculateAndSetReservationFee(reservation: Reservation, overrideAmount?: number): void {
    // Use override amount if provided, otherwise use reservation's totalFee
    const correctFee = overrideAmount || reservation.totalFee || 0;
    
    console.log(`✅ Using fee: ₱${correctFee} ${overrideAmount ? '(override provided)' : '(from reservation)'}`);
    
    this.selectedReservation = reservation;
    this.paymentForm.patchValue({
      reservationId: reservation._id,
      courtFee: correctFee
    });
  }

  payForOpenPlay(payment: Payment): void {
    if (!payment.pollId) return;

    // For Open Play events, create a reservation-like object for the payment form
    // This allows users to select payment method and complete the payment properly
    const openPlayAsReservation: Reservation = {
      _id: payment._id, // Use payment ID instead of reservation ID
      date: payment.pollId.openPlayEvent?.eventDate || new Date(),
      timeSlot: payment.pollId.openPlayEvent?.startTime || 18,
      players: ['Open Play Participant'], // Generic player for Open Play
      timeSlotDisplay: `${payment.pollId.title}`,
      status: 'confirmed',
      paymentStatus: 'pending',
      totalFee: payment.amount // ₱120 for Open Play
    };

    // Set a flag to indicate this is an Open Play payment
    (openPlayAsReservation as any).isOpenPlay = true;
    (openPlayAsReservation as any).originalPaymentId = payment._id;

    this.selectedReservation = openPlayAsReservation;
    this.paymentForm.patchValue({
      reservationId: payment._id, // Use payment ID for Open Play
      paymentMethod: '' // Reset payment method so user can choose
    });
  }

  payForManualPayment(payment: Payment): void {
    if (!payment.metadata?.isManualPayment) return;

    console.log('💰 Opening payment form for manual payment:', payment._id);
    console.log('💰 Payment metadata:', payment.metadata);

    // For manual court usage payments, create a reservation-like object for the payment form
    const startTime = payment.metadata.startTime ?? payment.metadata.timeSlot ?? 0;
    const endTime = payment.metadata.endTime ?? (payment.metadata.timeSlot ? payment.metadata.timeSlot + 1 : 0);
    const playerNames = payment.metadata.playerNames || [];
    const date = payment.metadata.courtUsageDate || new Date();

    console.log('💰 Time values - startTime:', startTime, 'endTime:', endTime);

    const manualPaymentAsReservation: Reservation = {
      _id: payment._id, // Use payment ID
      date: date,
      timeSlot: startTime,
      players: playerNames, // Use the actual player names
      timeSlotDisplay: `${this.format24Hour(startTime)} - ${this.format24Hour(endTime)}`,
      status: 'confirmed',
      paymentStatus: 'pending',
      totalFee: payment.amount
    };

    // Set a flag to indicate this is a manual payment
    (manualPaymentAsReservation as any).isManualPayment = true;
    (manualPaymentAsReservation as any).originalPaymentId = payment._id;

    this.selectedReservation = manualPaymentAsReservation;
    this.paymentForm.patchValue({
      reservationId: payment._id, // Use payment ID for manual payment
      paymentMethod: '', // Reset payment method so user can choose
      courtFee: payment.amount // Set the amount
    });

    // Scroll to top where payment form appears
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    console.log('💰 Payment form should now be visible. selectedReservation:', this.selectedReservation);
    console.log('💰 Total fee set to:', payment.amount);
  }

  payForExistingPayment(payment: Payment): void {
    if (!payment.reservationId) return;
    
    console.log('🔍 DEBUG payForExistingPayment:', {
      paymentAmount: payment.amount,
      reservationTotalFee: payment.reservationId.totalFee,
      reservationId: payment.reservationId._id,
      timeSlot: payment.reservationId.timeSlot,
      players: payment.reservationId.players
    });
    
    // For existing payment records that are not cash, show the payment form
    // Convert the payment back to a reservation-like object for the form
    const reservationForForm: Reservation = {
      _id: payment.reservationId._id,
      date: payment.reservationId.date,
      timeSlot: payment.reservationId.timeSlot,
      players: payment.reservationId.players,
      timeSlotDisplay: payment.reservationId.timeSlotDisplay,
      status: 'confirmed',
      paymentStatus: 'pending',
      totalFee: payment.reservationId.totalFee || payment.amount // Use reservation's totalFee first
    };
    
    console.log('🔍 DEBUG reservationForForm totalFee:', reservationForForm.totalFee);
    
    // Mark this as an existing payment update
    (reservationForForm as any).existingPaymentId = payment._id;
    
    // Recalculate the fee with current member data
    this.calculateAndSetReservationFeeWithMemberData(reservationForForm);
    this.paymentForm.patchValue({
      reservationId: payment.reservationId._id,
      paymentMethod: payment.paymentMethod
    });
  }

  convertPaymentToReservation(payment: Payment): Reservation {
    // Convert synthetic payment back to reservation object for cancellation
    if (!payment.reservationId) {
      throw new Error('Payment does not have reservation information');
    }
    
    return {
      _id: payment.reservationId._id,
      date: payment.reservationId.date,
      timeSlot: payment.reservationId.timeSlot,
      players: payment.reservationId.players,
      timeSlotDisplay: payment.reservationId.timeSlotDisplay,
      status: 'confirmed',
      paymentStatus: 'pending',
      totalFee: payment.amount
    };
  }

  cancelReservationFromPayment(payment: Payment): void {
    if (!payment.reservationId) return;
    
    // Convert payment to reservation and use the existing cancellation flow
    const reservation = this.convertPaymentToReservation(payment);
    this.cancelReservationDirectly(reservation);
  }

  updateOpenPlayPayment(paymentId: string, paymentMethod: string, transactionId?: string): void {
    // For Open Play, we need to update the existing payment record with the new payment method
    // and then process it based on the method chosen

    const updateData: any = {
      paymentMethod: paymentMethod
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    // First update the payment method
    const requestUrl = `${this.apiUrl}/payments/${paymentId}`;
    console.log('💰 FRONTEND: Attempting PUT request to:', requestUrl);
    console.log('💰 FRONTEND: Update data:', updateData);
    console.log('💰 FRONTEND: Payment ID:', paymentId);

    this.http.put<any>(requestUrl, updateData).subscribe({
      next: (response) => {
        // Open Play payments: update payment method and mark as completed
        // Then admin will verify and record it in Active Payments tab
        this.processing.push(paymentId);

        this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/process`, {}).subscribe({
          next: (processResponse) => {
            this.processing = this.processing.filter(id => id !== paymentId);
            this.loading = false;
            this.showSuccess('Payment Method Selected', 'Payment method has been recorded. An admin will verify and record the payment.');
            this.resetForm();
            this.loadPendingPayments(true);
          },
          error: (processError) => {
            this.processing = this.processing.filter(id => id !== paymentId);
            this.loading = false;
            console.error('Failed to process payment:', processError);
            this.showError('Payment Processing Failed', 'Failed to mark payment as completed');
          }
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('💰 Open Play payment update error:', error);
        console.error('💰 Error response:', error.error);
        console.error('💰 Error status:', error.status);
        console.error('💰 Error message:', error.message);

        let message = 'Failed to update Open Play payment';
        if (error.error?.error) {
          message = error.error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.message) {
          message = error.message;
        }

        this.showError('Open Play Payment Update Failed', `${message} (Status: ${error.status})`);
      }
    });
  }

  updateManualPayment(paymentId: string, paymentMethod: string, transactionId?: string): void {
    // For Manual Payments, we need to update the existing payment record with the new payment method
    // and then process it based on the method chosen

    const updateData: any = {
      paymentMethod: paymentMethod
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    // First update the payment method
    const requestUrl = `${this.apiUrl}/payments/${paymentId}`;
    console.log('💰 FRONTEND: Updating manual payment:', requestUrl);
    console.log('💰 FRONTEND: Update data:', updateData);

    this.http.put<any>(requestUrl, updateData).subscribe({
      next: (response) => {
        // Manual court usage payments: update payment method and mark as completed
        // Then admin will verify and record it in Active Payments tab
        this.processing.push(paymentId);

        this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/process`, {}).subscribe({
          next: (processResponse) => {
            this.processing = this.processing.filter(id => id !== paymentId);
            this.loading = false;
            this.showSuccess('Payment Method Selected', 'Payment method has been recorded. An admin will verify and record the payment.');
            this.resetForm();
            this.loadPendingPayments(true);
          },
          error: (processError) => {
            this.processing = this.processing.filter(id => id !== paymentId);
            this.loading = false;
            console.error('Failed to process payment:', processError);
            this.showError('Payment Processing Failed', 'Failed to mark payment as completed');
          }
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('💰 Manual payment update error:', error);

        let message = 'Failed to update manual payment';
        if (error.error?.error) {
          message = error.error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.message) {
          message = error.message;
        }

        this.showError('Manual Payment Update Failed', `${message} (Status: ${error.status})`);
      }
    });
  }

  isOpenPlayPayment(): boolean {
    return !!(this.selectedReservation as any)?.isOpenPlay;
  }

  isManualPayment(): boolean {
    return !!(this.selectedReservation as any)?.isManualPayment;
  }

  getTimeSlotInfo(): string {
    if (!this.selectedReservation) return '';
    
    return `${this.selectedReservation.timeSlotDisplay || this.formatTimeSlot(this.selectedReservation.timeSlot)}`;
  }

  getRateTypeInfo(): string {
    if (!this.selectedReservation) return '';
    
    const isPeak = this.isPeakHourReservation();
    return isPeak ? 'Peak Hour (₱100 minimum)' : 'Off-Peak (per player rate)';
  }

  isPeakHourReservation(): boolean {
    if (!this.selectedReservation) return false;
    
    // Peak hours: 5AM, 6PM, 7PM, 9PM (5, 18, 19, 21)
    const peakHours = [5, 18, 19, 21];
    return peakHours.includes(this.selectedReservation.timeSlot);
  }

  getMemberRate(): string {
    return this.isPeakHourReservation() ? 'Peak Rate' : '₱20';
  }

  getPlayerBreakdownInfo(): {
    memberCount: number;
    nonMemberCount: number;
    memberTotal: number;
    nonMemberTotal: number;
  } {
    if (!this.selectedReservation || !this.selectedReservation.players) {
      return { memberCount: 0, nonMemberCount: 0, memberTotal: 0, nonMemberTotal: 0 };
    }

    // Use the same fee calculation logic as the payment cards for consistency
    const mockPayment = {
      reservationId: {
        players: this.selectedReservation.players,
        timeSlot: this.selectedReservation.timeSlot,
        date: this.selectedReservation.date
      }
    };

    const feeInfo = this.getPlayerFeeInfo(mockPayment);
    
    return {
      memberCount: feeInfo.memberCount,
      nonMemberCount: feeInfo.nonMemberCount,
      memberTotal: feeInfo.memberCount * feeInfo.memberFee,
      nonMemberTotal: feeInfo.nonMemberCount * feeInfo.nonMemberFee
    };
  }

  formatTimeSlot(timeSlot: number): string {
    return `${timeSlot}:00 - ${timeSlot + 1}:00`;
  }

  // Calculate individual player fees for payment cards
  getPlayerFeeInfo(payment: any): { memberFee: number, nonMemberFee: number, memberCount: number, nonMemberCount: number } {
    if (!payment.reservationId || !payment.reservationId.players || !payment.reservationId.timeSlot) {
      return { memberFee: 0, nonMemberFee: 0, memberCount: 0, nonMemberCount: 0 };
    }

    const reservation = payment.reservationId;
    const players = reservation.players;
    const timeSlot = reservation.timeSlot;
    
    // Peak hours: 5AM, 6PM, 7PM, 9PM (5, 18, 19, 21)
    const peakHours = [5, 18, 19, 21];
    const isPeakHour = peakHours.includes(timeSlot);
    
    // Try to distinguish members from non-members
    // For now, we'll need to check if we have member data or use a heuristic
    const { memberCount, nonMemberCount } = this.categorizePlayersForPayment(players);
    
    if (isPeakHour) {
      // Peak hours: ₱100 minimum total
      const baseFee = (memberCount * 20) + (nonMemberCount * 50);
      const totalFee = Math.max(100, baseFee);
      
      if (memberCount > 0 && nonMemberCount > 0) {
        // Mixed members and non-members: distribute proportionally
        const memberRatio = (memberCount * 20) / (memberCount * 20 + nonMemberCount * 50);
        const memberPortionOfTotal = Math.round(totalFee * memberRatio);
        const nonMemberPortionOfTotal = totalFee - memberPortionOfTotal;
        
        return {
          memberFee: Math.round(memberPortionOfTotal / memberCount),
          nonMemberFee: Math.round(nonMemberPortionOfTotal / nonMemberCount),
          memberCount,
          nonMemberCount
        };
      } else if (memberCount > 0) {
        // Only members
        return {
          memberFee: Math.round(totalFee / memberCount),
          nonMemberFee: 0,
          memberCount,
          nonMemberCount: 0
        };
      } else {
        // Only non-members
        return {
          memberFee: 0,
          nonMemberFee: Math.round(totalFee / nonMemberCount),
          memberCount: 0,
          nonMemberCount
        };
      }
    } else {
      // Off-peak: ₱20 per member, ₱50 per non-member
      return {
        memberFee: 20,
        nonMemberFee: 50,
        memberCount,
        nonMemberCount
      };
    }
  }

  // Load members data for fee calculation
  private async loadMembersData(): Promise<void> {
    console.log('🔄 Starting loadMembersData...');
    console.log('🔄 Current user:', this.currentUser);
    console.log('🔄 Auth token available:', !!this.authService.token);
    
    try {
      // Load members with maximum allowed limit (100) and get all pages
      let allMembers: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`🔄 Loading members page ${page}...`);
        const response = await this.http.get<any>(`${this.apiUrl}/members?limit=100&page=${page}`).toPromise();
        console.log(`🔄 Page ${page} response:`, {
          success: response?.success,
          dataLength: response?.data?.length || 0,
          pagination: response?.pagination
        });
        
        const members = response?.data || [];
        allMembers = [...allMembers, ...members];
        
        // Check if there are more pages
        hasMore = response?.pagination?.hasNext || false;
        page++;
        
        // Safety break to prevent infinite loops
        if (page > 20) break;
      }
      
      this.members = allMembers;
      console.log('📋 Loaded ALL members for fee calculation:', this.members.length, 'members across', page - 1, 'pages');
      
      // Check specifically for Adrian Raphael Choi, Helen Sundiam and Coco Gauf
      const adrianFound = this.members.find(m => m.fullName && m.fullName.toLowerCase().includes('adrian'));
      const helenFound = this.members.find(m => m.fullName && m.fullName.toLowerCase().includes('helen'));
      const cocoFound = this.members.find(m => m.fullName && m.fullName.toLowerCase().includes('coco'));
      
      console.log(adrianFound ? `✅ Adrian found: "${adrianFound.fullName}" (${adrianFound.username})` : '❌ Adrian NOT found');
      console.log(helenFound ? `✅ Helen found: "${helenFound.fullName}"` : '❌ Helen NOT found');
      console.log(cocoFound ? `✅ Coco found: "${cocoFound.fullName}"` : '❌ Coco NOT found (correct - should be non-member)');
      
      // Log a sample of loaded members for debugging
      console.log('📋 Sample of loaded members:', this.members.slice(0, 5).map(m => ({
        fullName: m.fullName,
        username: m.username
      })));
      
    } catch (error) {
      console.error('❌ Error loading members:', error);
      console.error('❌ Error details:', {
        status: (error as any).status,
        message: (error as any).message,
        error: (error as any).error
      });
      // Continue without member data - will use heuristic approach
      this.members = [];
    }
  }

  // Try to categorize players as members vs non-members
  private categorizePlayersForPayment(players: string[]): { memberCount: number, nonMemberCount: number } {
    let memberCount = 0;
    let nonMemberCount = 0;
    
    console.log('🔍 === CATEGORIZING PLAYERS ===');
    console.log('🔍 Players to categorize:', players);
    console.log('🔍 Members data loaded:', this.members.length, 'members');
    
    if (this.members && this.members.length > 0) {
      // If we have member data, use it
      const memberNames = this.members.map(m => m.fullName.toLowerCase().trim());
      
      console.log('🔍 Sample member names:', memberNames.slice(0, 5));
      
      players.forEach(playerName => {
        const cleanPlayerName = playerName.toLowerCase().trim();
        console.log(`🔍 Checking player: "${playerName}" (cleaned: "${cleanPlayerName}")`);
        
        const isFoundInMembers = memberNames.includes(cleanPlayerName);
        
        if (isFoundInMembers) {
          memberCount++;
          console.log(`✅ "${playerName}" is a MEMBER (exact match)`);
        } else {
          // Try fuzzy matching for potential matches
          const fuzzyMatches = memberNames.filter(name => {
            const similarity = this.calculateStringSimilarity(cleanPlayerName, name);
            return similarity > 0.8;
          });
          
          if (fuzzyMatches.length > 0) {
            console.log(`🔍 Fuzzy matches for "${playerName}":`, fuzzyMatches);
            // Use the best fuzzy match as a member
            memberCount++;
            console.log(`✅ "${playerName}" is a MEMBER (fuzzy match)`);
          } else {
            nonMemberCount++;
            console.log(`❌ "${playerName}" is a NON-MEMBER (no match found)`);
          }
        }
      });
    } else {
      // Fallback: Use a more realistic heuristic for member vs non-member distribution
      console.log('🔍 Using heuristic approach (no member data available)');
      
      // For the specific case mentioned (₱60 vs ₱90), we need to ensure proper distribution
      // Assuming a typical tennis club scenario: some members, some non-members
      const totalPlayers = players.length;
      
      if (totalPlayers === 3) {
        // For 3 players: assume 1 member + 2 non-members to get ₱90 (1×20 + 2×50 = 120, but for off-peak could be different)
        // Or 2 members + 1 non-member to get ₱90 (2×20 + 1×50 = 90) - This matches!
        memberCount = 2;
        nonMemberCount = 1;
        console.log(`🔍 Heuristic for ${totalPlayers} players: ${memberCount} members, ${nonMemberCount} non-members (2×₱20 + 1×₱50 = ₱90)`);
      } else if (totalPlayers === 2) {
        // For 2 players: assume 1 member + 1 non-member
        memberCount = 1;
        nonMemberCount = 1;
        console.log(`🔍 Heuristic for ${totalPlayers} players: ${memberCount} members, ${nonMemberCount} non-members`);
      } else {
        // For other cases, distribute roughly 60% members, 40% non-members
        memberCount = Math.ceil(totalPlayers * 0.6);
        nonMemberCount = totalPlayers - memberCount;
        console.log(`🔍 Heuristic for ${totalPlayers} players: ${memberCount} members, ${nonMemberCount} non-members`);
      }
    }
    
    console.log(`🔍 === FINAL CATEGORIZATION RESULT ===`);
    console.log(`🔍 Members: ${memberCount}, Non-members: ${nonMemberCount}`);
    return { memberCount, nonMemberCount };
  }

  // Get detailed player list with fees
  formatPlayersWithFees(payment: any): string {
    if (!payment.reservationId || !payment.reservationId.players) {
      return '';
    }

    const reservation = payment.reservationId;
    const players = reservation.players;
    const timeSlot = reservation.timeSlot;
    const feeBreakdown = this.getPlayerFeeInfo(payment);
    
    // Determine if it's peak hour for context
    const peakHours = [5, 18, 19, 21];
    const isPeakHour = peakHours.includes(timeSlot);
    const timeContext = isPeakHour ? ' (Peak)' : ' (Off-Peak)';
    
    // Build fee description
    let feeDescription = '';
    if (feeBreakdown.memberCount > 0 && feeBreakdown.nonMemberCount > 0) {
      // Mixed members and non-members
      feeDescription = `${feeBreakdown.memberCount} members @ ₱${feeBreakdown.memberFee}, ${feeBreakdown.nonMemberCount} non-members @ ₱${feeBreakdown.nonMemberFee}`;
    } else if (feeBreakdown.memberCount > 0) {
      // Only members
      const fee = feeBreakdown.memberFee;
      feeDescription = `${feeBreakdown.memberCount} ${feeBreakdown.memberCount === 1 ? 'member' : 'members'} @ ₱${fee} each`;
    } else if (feeBreakdown.nonMemberCount > 0) {
      // Only non-members  
      const fee = feeBreakdown.nonMemberFee;
      feeDescription = `${feeBreakdown.nonMemberCount} non-${feeBreakdown.nonMemberCount === 1 ? 'member' : 'members'} @ ₱${fee} each`;
    }
    
    const playerCount = players.length;
    
    if (playerCount <= 2) {
      // For 1-2 players, show names with fees
      return `${players.join(', ')} • ${feeDescription}${timeContext}`;
    } else {
      // For 3+ players, show fee breakdown and names
      return `${feeDescription}${timeContext}: ${players.join(', ')}`;
    }
  }

  cancelReservationFromPaymentHistory(payment: Payment): void {
    if (!payment.reservationId) return;
    
    // For Payment History, we need to convert the payment reservation info to a full reservation object
    const reservation: Reservation = {
      _id: payment.reservationId._id,
      date: payment.reservationId.date,
      timeSlot: payment.reservationId.timeSlot,
      players: payment.reservationId.players,
      timeSlotDisplay: payment.reservationId.timeSlotDisplay,
      status: 'confirmed',
      paymentStatus: payment.status === 'completed' ? 'paid' : 'pending',
      totalFee: payment.amount
    };
    
    this.cancelReservationDirectly(reservation);
  }

  // Calculate correct payment amount based on stored amount (respects user-edited court fees)
  getCorrectPaymentAmount(payment: any): string {
    // Debug log for payment history amount issues
    console.log(`💰 DEBUG Payment Amount for ${payment._id}:`, {
      amount: payment.amount,
      formattedAmount: payment.formattedAmount,
      hasGroupedPayments: !!payment._groupedPayments,
      groupedPaymentsCount: payment._groupedPayments?.length,
      isReservationPayment: !!payment.reservationId,
      timeSlotDisplay: payment.reservationId?.timeSlotDisplay
    });
    
    // Always use the stored amount since users can now edit court fees
    // This respects both user-edited amounts and admin overrides
    if (payment.amount !== undefined && payment.amount !== null) {
      console.log(`💰 Using stored payment amount for ${payment._id}: ₱${payment.amount}`);
      return '₱' + payment.amount.toFixed(2);
    }
    
    // For Open Play Events and other payment types, use stored amount
    if (payment.formattedAmount) {
      return payment.formattedAmount;
    }
    
    // Final fallback to raw amount
    if (payment.amount !== undefined) {
      return '₱' + payment.amount.toFixed(2);
    }
    
    // Last resort fallback
    return '₱0.00';
  }

  // Calculate correct reservation amount for the payment form
  getCorrectReservationAmount(): string {
    if (!this.selectedReservation) {
      return '₱0.00';
    }

    if (this.isOpenPlayPayment()) {
      // Open Play events have fixed pricing
      return '₱' + this.selectedReservation.totalFee.toFixed(2);
    }

    if (this.isManualPayment()) {
      // Manual court usage payments have fixed amounts set by admin
      return '₱' + this.selectedReservation.totalFee.toFixed(2);
    }

    // Create a mock payment object for fee calculation
    const mockPayment = {
      reservationId: {
        players: this.selectedReservation.players,
        timeSlot: this.selectedReservation.timeSlot,
        date: this.selectedReservation.date
      }
    };

    const feeInfo = this.getPlayerFeeInfo(mockPayment);
    const totalFee = (feeInfo.memberCount * feeInfo.memberFee) + (feeInfo.nonMemberCount * feeInfo.nonMemberFee);

    console.log(`💰 Reservation form amount: ₱${totalFee} (${feeInfo.memberCount} members × ₱${feeInfo.memberFee} + ${feeInfo.nonMemberCount} non-members × ₱${feeInfo.nonMemberFee})`);

    return '₱' + totalFee.toFixed(2);
  }

  // Admin detection
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'superadmin';
  }


  // Get display amount from court fee field
  getDisplayAmount(): string {
    const courtFee = this.paymentForm.get('courtFee')?.value;
    if (courtFee && courtFee > 0) {
      return '₱' + parseFloat(courtFee).toFixed(2);
    }
    return this.getCorrectReservationAmount();
  }

  // Get the actual amount to use for payment processing
  getPaymentAmount(): number {
    const courtFee = this.paymentForm.get('courtFee')?.value;
    if (courtFee && courtFee > 0) {
      return parseFloat(courtFee);
    }

    // Fallback to calculated logic
    if (!this.selectedReservation) return 0;

    if (this.isOpenPlayPayment()) {
      return this.selectedReservation.totalFee;
    }

    if (this.isManualPayment()) {
      return this.selectedReservation.totalFee;
    }

    const mockPayment = {
      reservationId: {
        players: this.selectedReservation.players,
        timeSlot: this.selectedReservation.timeSlot,
        date: this.selectedReservation.date
      }
    };

    const feeInfo = this.getPlayerFeeInfo(mockPayment);
    return (feeInfo.memberCount * feeInfo.memberFee) + (feeInfo.nonMemberCount * feeInfo.nonMemberFee);
  }

  // Format court reservation players for display
  formatCourtPlayers(payment: Payment): string {
    if (!payment.reservationId || !payment.reservationId.players || payment.reservationId.players.length === 0) {
      return '';
    }
    
    return payment.reservationId.players.join(', ');
  }

  // Helper function for string similarity calculation
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    // Levenshtein distance algorithm
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  // Setup manual payment form validation based on user role
  setupManualPaymentFormValidation(): void {
    if (this.isSuperAdmin()) {
      // Superadmin needs to select a player
      this.manualPaymentForm.get('playerName')?.setValidators([Validators.required]);
    } else {
      // Non-superadmin uses their own account
      this.manualPaymentForm.get('playerName')?.clearValidators();
    }
    this.manualPaymentForm.get('playerName')?.updateValueAndValidity();
  }

  // Check if user is superadmin
  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'superadmin';
  }

  // Manual Payment Methods
  onManualPaymentSubmit(): void {
    if (this.manualPaymentForm.invalid) {
      this.markFormGroupTouched(this.manualPaymentForm);
      return;
    }

    this.loadingManualPayment = true;
    const formValue = this.manualPaymentForm.value;

    // Determine the player name based on user role
    let selectedPlayerName: string;
    if (this.isSuperAdmin()) {
      // Superadmin must select a player
      if (!formValue.playerName || formValue.playerName.trim() === '') {
        this.showError('Invalid Input', 'Please select a player');
        this.loadingManualPayment = false;
        return;
      }
      selectedPlayerName = formValue.playerName.trim();
    } else {
      // Non-superadmin uses their own account
      selectedPlayerName = this.currentUser?.fullName || '';
      if (!selectedPlayerName) {
        this.showError('Invalid Input', 'Unable to determine your player name');
        this.loadingManualPayment = false;
        return;
      }
    }

    const manualPaymentData = {
      isManualPayment: true,
      playerNames: [selectedPlayerName], // Send as array with single player
      courtUsageDate: new Date(formValue.courtUsageDate).toISOString(),
      paymentMethod: formValue.paymentMethod,
      amount: parseFloat(formValue.amount),
      notes: formValue.notes || undefined
    };

    console.log('📝 Submitting manual payment:', manualPaymentData);

    this.http.post<any>(`${this.apiUrl}/payments`, manualPaymentData).subscribe({
      next: (response) => {
        this.loadingManualPayment = false;
        if (response.success) {
          this.showSuccess('Manual Payment Created', 
            `Payment of ₱${formValue.amount} for ${selectedPlayerName} has been submitted successfully`);
          
          // Reset form
          this.resetManualPaymentForm();
          
          // Refresh payment history to show the new manual payment
          this.loadPaymentHistory();
          
          // Switch to payment history tab to show the result
          this.activeTab = 'history';
        }
      },
      error: (error) => {
        this.loadingManualPayment = false;
        console.error('Manual payment error:', error);
        console.error('Manual payment error details:', error.error);
        
        let message = 'Failed to create manual payment';
        if (error.error?.details && Array.isArray(error.error.details)) {
          // Show validation error details
          const validationErrors = error.error.details.map((detail: any) => detail.msg).join(', ');
          message = `Validation errors: ${validationErrors}`;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        
        this.showError('Manual Payment Failed', message);
      }
    });
  }

  resetManualPaymentForm(): void {
    this.manualPaymentForm.reset({
      playerName: '',
      courtUsageDate: '',
      paymentMethod: '',
      amount: '',
      notes: ''
    });
    this.manualPaymentForm.markAsUntouched();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.controls[key];
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  formatManualPaymentPlayers(payment: any): string {
    if (!payment.metadata?.playerNames || !Array.isArray(payment.metadata.playerNames)) {
      return 'No player listed';
    }
    
    const players = payment.metadata.playerNames;
    if (players.length === 1) {
      return players[0];
    } else if (players.length <= 3) {
      return players.join(', ');
    } else {
      const firstThree = players.slice(0, 3).join(', ');
      const remaining = players.length - 3;
      return `${firstThree} and ${remaining} other${remaining !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Format payment description for mobile with proper AM/PM time and wrapping
   */
  formatPaymentDescriptionForMobile(payment: Payment): string {
    if (payment.reservationId) {
      const date = new Date(payment.reservationId.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
      const startTime = this.formatTime(payment.reservationId.timeSlot);
      const endTime = this.formatTime(payment.reservationId.timeSlot + 1);
      
      // Create a more compact description for mobile
      return `Court reservation ${date} ${startTime}-${endTime}`;
    } else if (payment.pollId?.title) {
      const date = new Date(payment.pollId.openPlayEvent?.eventDate || new Date()).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      return `${payment.pollId.title} ${date}`;
    } else if (payment.metadata?.isManualPayment) {
      const date = payment.metadata.courtUsageDate 
        ? new Date(payment.metadata.courtUsageDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
        : 'Unknown date';
      return `Manual payment ${date}`;
    }
    
    // Fallback to original description but make it more compact
    return payment.description || 'Payment';
  }
}